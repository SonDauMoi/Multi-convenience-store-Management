// src/pages/payment/CheckoutPayment.jsx
import React, { useCallback, useEffect, useState } from "react";
import {
  PaymentElement,
  useElements,
  useStripe,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import { API_BASE_URL } from "../../api/constant";
import { useDispatch } from "react-redux";
import { setLoading } from "../../store/features/common";

const CheckoutForm = ({ clientSecret, orderId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!stripe || !elements) return;

      dispatch(setLoading(true));
      setError("");

      try {
        await elements.submit();

        const { error } = await stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: {
            return_url: "http://localhost:5175/payment/stripe-success",
          },
        });

        if (error) {
          setError(error.message);
          console.error("Stripe confirm error:", error);
        }
      } catch (err) {
        setError("Đã xảy ra lỗi khi xác nhận thanh toán.");
      } finally {
        dispatch(setLoading(false));
      }
    },
    [stripe, elements, clientSecret, dispatch]
  );

  return (
    <form onSubmit={handleSubmit} className="p-4 w-[550px]">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe}
        className="w-full mt-4 bg-black text-white h-12 rounded hover:bg-gray-800"
      >
        Thanh toán
      </button>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      {success && (
        <p className="text-green-600 text-sm mt-2">Thanh toán thành công!</p>
      )}
    </form>
  );
};

const StripePayment = ({ totalAmount, userId, orderId, onCreateOrder }) => {
  const [clientSecret, setClientSecret] = useState("");
  const [ready, setReady] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [creatingOrder, setCreatingOrder] = useState(false);

  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
  const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

  useEffect(() => {
    if (!userId || !totalAmount) {
      setFetchError("Thiếu thông tin người dùng hoặc số tiền.");
      setReady(true);
      return;
    }

    const fetchIntent = async () => {
      try {
        // Nếu chưa có orderId, tạo order trước
        let currentOrderId = orderId;
        if (!currentOrderId && onCreateOrder) {
          setCreatingOrder(true);
          currentOrderId = await onCreateOrder();
          setCreatingOrder(false);

          if (!currentOrderId) {
            setFetchError("Không thể tạo đơn hàng.");
            setReady(true);
            return;
          }
        }

        const currency = "usd";
        const res = await axios.post(
          `${API_BASE_URL}/payment/stripe/create-intent`,
          {
            totalAmount,
            currency,
            user_id: userId,
            orderId: currentOrderId, // Gửi orderId để backend liên kết
          }
        );
        setClientSecret(res.data?.clientSecret || "");
      } catch (e) {
        setFetchError("Không thể khởi tạo phiên thanh toán Stripe.");
      } finally {
        setReady(true);
      }
    };
    fetchIntent();
  }, [totalAmount, userId, orderId, onCreateOrder]);

  if (!stripePromise) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">Thiếu cấu hình Stripe</h2>
        <p className="text-gray-700">
          Vui lòng thêm biến môi trường `VITE_STRIPE_PUBLISHABLE_KEY` trong
          `.env` của FEU để bật thanh toán bằng Stripe.
        </p>
      </div>
    );
  }

  if (!ready || creatingOrder) {
    return (
      <div className="p-6">
        {creatingOrder
          ? "Đang tạo đơn hàng..."
          : "Đang chuẩn bị phiên thanh toán..."}
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2 text-red-600">Lỗi</h2>
        <p className="text-gray-700">{fetchError}</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">Chưa có clientSecret</h2>
        <p className="text-gray-700">
          Backend chưa tạo PaymentIntent cho Stripe. Hãy triển khai endpoint tạo
          intent rồi truyền `clientSecret` vào Elements.
        </p>
      </div>
    );
  }

  return (
    <Elements options={{ clientSecret }} stripe={stripePromise}>
      <div className="flex items-center justify-center py-8">
        <CheckoutForm clientSecret={clientSecret} />
      </div>
    </Elements>
  );
};

export default StripePayment;
