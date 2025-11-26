import React, { useState } from "react";
import { createPayPalOrderAPI } from "../../api/order";

const PayPalCheckout = ({
  userId,
  totalAmount,
  currency = "USD",
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayPalPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Tạo PayPal order
      const response = await createPayPalOrderAPI({
        user_id: userId,
        totalAmount: totalAmount,
        currency: currency,
      });

      // Tìm link approve từ response
      const approveLink = response.links?.find(
        (link) => link.rel === "approve"
      );

      if (approveLink) {
        // Redirect user đến PayPal để thanh toán
        window.location.href = approveLink.href;
      } else {
        throw new Error("Không tìm thấy link PayPal approve");
      }
    } catch (err) {
      console.error("Lỗi khi tạo PayPal order:", err);
      setError(err.message || "Có lỗi xảy ra khi tạo thanh toán PayPal");
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="paypal-checkout">
      {error && (
        <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handlePayPalPayment}
        disabled={loading}
        className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-white"
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
            Đang xử lý...
          </>
        ) : (
          <>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-1.12 7.106c-.054.341.182.65.524.65h3.72a.946.946 0 0 0 .934-.788l.396-2.496h2.45c3.88 0 6.91-1.572 7.77-6.08.625-3.278-.174-5.982-1.449-7.312z" />
            </svg>
            Thanh toán với PayPal
          </>
        )}
      </button>

      <p className="text-sm text-gray-500 text-center mt-2">
        Bạn sẽ được chuyển đến PayPal để hoàn tất thanh toán
      </p>
    </div>
  );
};

export default PayPalCheckout;
