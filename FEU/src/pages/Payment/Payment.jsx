// src/pages/payment/PaymentPage.jsx
import { Elements } from "@stripe/react-stripe-js";
import React, { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "./CheckoutPayment";
import PayPalCheckout from "./PayPalCheckout";
import { useSelector } from "react-redux";
import { selectCartItems } from "../../store/features/cart";
import { placeOrderAPI } from "../../api/order.js";
import { createOrderRequest } from "../../utils/order-util";

const stripePromise = loadStripe(
  "pk_test_51RitF8QTOMW9o79JqpIR8NPiGFw8tzoXaQKiCy9MISFfXPz0WmBA7vf3TrcZpFktqRVR5Mv9o5VGaHFzKbe47kIh0081EiTXiq"
);

const PaymentPage = ({ userId, addressId }) => {
  const cartItems = useSelector(selectCartItems);
  const [clientSecret, setClientSecret] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("paypal"); // 'stripe' or 'paypal'

  // Tính tổng tiền
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  useEffect(() => {
    // Chỉ init Stripe khi user chọn Stripe
    if (paymentMethod === "stripe") {
      const initPayment = async () => {
        try {
          const orderRequest = createOrderRequest(cartItems, userId, addressId);
          const res = await placeOrderAPI(orderRequest);
          setClientSecret(res.credentials.client_secret);
          setOrderId(res.orderId);
        } catch (error) {
          console.error(" Lỗi khi tạo đơn hàng:", error);
        }
      };

      initPayment();
    }
  }, [cartItems, userId, addressId, paymentMethod]);

  const options = {
    clientSecret,
    appearance: {
      theme: "flat",
    },
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Chọn phương thức thanh toán</h2>

      {/* Payment method selector */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setPaymentMethod("paypal")}
          className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all ${
            paymentMethod === "paypal"
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          PayPal
        </button>
        <button
          onClick={() => setPaymentMethod("stripe")}
          className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all ${
            paymentMethod === "stripe"
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          Thẻ tín dụng (Stripe)
        </button>
      </div>

      {/* Payment forms */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {paymentMethod === "paypal" ? (
          <PayPalCheckout
            userId={userId}
            totalAmount={totalAmount}
            currency="USD"
          />
        ) : (
          <div>
            {clientSecret ? (
              <Elements stripe={stripePromise} options={options}>
                <CheckoutForm clientSecret={clientSecret} orderId={orderId} />
              </Elements>
            ) : (
              <p>Đang xử lý thanh toán...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
