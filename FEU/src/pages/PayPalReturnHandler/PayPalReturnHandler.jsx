import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { capturePayPalOrderAPI } from "../../api/order";
import { deleteCart } from "../../store/features/cart";
import { getUserInfo } from "../../utils/jwt-helper";

const PayPalReturnHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handlePayPalReturn = async () => {
      // Lấy token (orderID) từ URL
      const token = searchParams.get("token");
      console.log("[PayPal Return] Token from URL:", token);

      if (!token) {
        setError("Thiếu thông tin thanh toán từ PayPal");
        setLoading(false);
        return;
      }

      try {
        // Lấy order data từ localStorage
        const orderDataStr = localStorage.getItem("checkout_orderData");
        const userInfo = getUserInfo();
        const userIdFromJwt = userInfo?.userId;
        const userIdFromCheckout = Number(
          localStorage.getItem("checkout_userId")
        );
        const userId =
          userIdFromJwt ||
          (Number.isFinite(userIdFromCheckout)
            ? userIdFromCheckout
            : undefined);

        console.log("[PayPal Return] User info:", {
          userIdFromJwt,
          userIdFromCheckout,
          userId,
        });
        console.log("[PayPal Return] Has orderData:", !!orderDataStr);

        if (!orderDataStr) {
          throw new Error("Không tìm thấy thông tin đơn hàng");
        }

        const orderData = JSON.parse(orderDataStr);
        console.log("[PayPal Return] OrderData:", {
          storeId: orderData.storeId,
          itemsCount: orderData.items?.length,
        });

        // Capture PayPal payment và tạo đơn hàng
        console.log("[PayPal Return] Calling capturePayPalOrderAPI...");
        const response = await capturePayPalOrderAPI({
          orderID: token,
          ...(userId ? { user_id: parseInt(userId) } : {}),
          storeId: parseInt(orderData.storeId),
          orderData: orderData, // Send order data to backend
        });

        console.log("[PayPal Return] Capture response:", {
          paypalStatus: response.paypalStatus,
          orderId: response.order?.id,
          hasOrder: !!response.order,
        });

        if (response.paypalStatus === "COMPLETED") {
          setSuccess(true);
          setLoading(false);

          // Xóa giỏ hàng Redux
          dispatch(deleteCart());

          // Clean up localStorage
          localStorage.removeItem("checkout_storeId");
          localStorage.removeItem("checkout_orderData");
          localStorage.removeItem("checkout_userId");
          console.log("[PayPal Return] Cleaned up localStorage");

          // Chuyển đến trang đơn hàng sau 2 giây
          setTimeout(() => {
            const orderId = response.order?.id;
            const amount = response.capturedAmount;
            const currency = response.capturedCurrency;
            const params = new URLSearchParams({
              ...(orderId ? { orderId: String(orderId) } : {}),
              status: "success",
              ...(amount ? { amount: String(amount) } : {}),
              ...(currency ? { currency: String(currency) } : {}),
              ...(response.paypalOrderId
                ? { paypalOrderId: String(response.paypalOrderId) }
                : {}),
            });
            console.log(
              "[PayPal Return] Navigating to:",
              `/orderConfirmed?${params.toString()}`
            );
            navigate(`/orderConfirmed?${params.toString()}`);
          }, 2000);
        } else {
          throw new Error("Thanh toán chưa hoàn tất");
        }
      } catch (err) {
        console.error("[PayPal Return] Error:", {
          message: err.message,
          response: err.response?.data,
          stack: err.stack,
        });
        setError(
          err.response?.data?.message ||
            err.message ||
            "Có lỗi xảy ra khi xử lý thanh toán"
        );
        setLoading(false);
      }
    };

    handlePayPalReturn();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {loading && (
          <div className="text-center">
            <svg
              className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Đang xử lý thanh toán...
            </h2>
            <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
          </div>
        )}

        {success && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Thanh toán thành công!
            </h2>
            <p className="text-gray-600">
              Đơn hàng của bạn đã được xác nhận. Đang chuyển hướng...
            </p>
          </div>
        )}

        {error && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Thanh toán thất bại
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate("/cart")}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              Quay lại giỏ hàng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayPalReturnHandler;
