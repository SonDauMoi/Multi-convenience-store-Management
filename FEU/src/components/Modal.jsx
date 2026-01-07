import React from "react";

const Modal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "info",
  confirmText = "Xác nhận",
  cancelText = "Hủy",
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    info: {
      icon: (
        <svg
          className="w-12 h-12 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      bgColor: "bg-blue-50",
      borderColor: "border-blue-500",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
    },
    success: {
      icon: (
        <svg
          className="w-12 h-12 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      bgColor: "bg-green-50",
      borderColor: "border-green-500",
      buttonColor: "bg-green-600 hover:bg-green-700",
    },
    warning: {
      icon: (
        <svg
          className="w-12 h-12 text-yellow-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-500",
      buttonColor: "bg-yellow-600 hover:bg-yellow-700",
    },
    error: {
      icon: (
        <svg
          className="w-12 h-12 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      bgColor: "bg-red-50",
      borderColor: "border-red-500",
      buttonColor: "bg-red-600 hover:bg-red-700",
    },
  };

  const currentStyle = typeStyles[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-scaleIn">
        {/* Close button */}
        {onClose && !onConfirm && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div
            className={`flex items-center justify-center w-16 h-16 mx-auto rounded-full ${currentStyle.bgColor} border-4 ${currentStyle.borderColor} mb-4`}
          >
            {currentStyle.icon}
          </div>

          {/* Title */}
          {title && (
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
              {title}
            </h3>
          )}

          {/* Message */}
          <div className="text-gray-600 text-center whitespace-pre-line leading-relaxed">
            {message}
          </div>
        </div>

        {/* Actions */}
        <div className={`px-6 py-4 ${onConfirm ? "flex gap-3" : ""}`}>
          {onConfirm ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 px-6 py-3 text-white rounded-lg font-semibold transition-colors ${currentStyle.buttonColor}`}
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className={`w-full px-6 py-3 text-white rounded-lg font-semibold transition-colors ${currentStyle.buttonColor}`}
            >
              Đóng
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Modal;
