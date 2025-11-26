import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { capturePayPalOrderAPI } from "../../api/order";

const PayPalReturnHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handlePayPalReturn = async () => {
      // Lấy token (orderID) từ URL
      const token = searchParams.get("token");
      const payerId = searchParams.get("PayerID");

      if (!token) {
        setError("Thiếu thông tin thanh toán từ PayPal");
        setLoading(false);
        return;
      }

      try {
        // Lấy user_id từ localStorage hoặc Redux
        const userId = localStorage.getItem("userId") || 1; // Cần điều chỉnh theo logic app của bạn

        // Gọi API capture PayPal order
        const response = await capturePayPalOrderAPI({
          orderID: token,
          user_id: parseInt(userId),
        });

        if (response.paypalStatus === "COMPLETED") {
          setSuccess(true);
          setLoading(false);

          // Chuyển đến trang xác nhận sau 2 giây
          setTimeout(() => {
            navigate("/order-confirmed", {
              state: {
                orderId: response.order?.id,
                paypalOrderId: response.paypalOrderId,
              },
            });
          }, 2000);
        } else {
          throw new Error("Thanh toán chưa hoàn tất");
        }
      } catch (err) {
        console.error("Lỗi khi capture PayPal order:", err);
        setError(err.message || "Có lỗi xảy ra khi xử lý thanh toán");
        setLoading(false);
      }
    };

    handlePayPalReturn();
  }, [searchParams, navigate]);

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
