import React from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo } from "../../utils/jwt-helper";
import { logoutAPI } from "../../api/authencation";

const ManagerWelcome = () => {
  const navigate = useNavigate();
  const userInfo = getUserInfo();

  const handleLogout = async () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      await logoutAPI();
      navigate("/v1/login");
    }
  };

  const handleGoToPanel = () => {
    navigate("/manager/products");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Manager Dashboard
              </h1>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Manager
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-r from-[#0A68FE] to-[#0052CC] rounded-full mb-4">
              <svg
                className="w-16 h-16 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Chào mừng, {userInfo?.name || "Manager"}!
            </h2>
            <p className="text-gray-600 text-lg">
              Bạn đang quản lý cửa hàng #{userInfo?.storeId || "N/A"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-900">
                  Quản lý sản phẩm
                </h3>
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <p className="text-blue-700 text-sm">
                Thêm, sửa, xóa sản phẩm trong cửa hàng của bạn
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-green-900">
                  Quản lý đơn hàng
                </h3>
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <p className="text-green-700 text-sm">
                Xem và xử lý đơn hàng của khách hàng
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-purple-900">
                  Thống kê
                </h3>
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <p className="text-purple-700 text-sm">
                Xem báo cáo và phân tích dữ liệu
              </p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleGoToPanel}
              className="px-8 py-4 bg-gradient-to-r from-[#0A68FE] to-[#0052CC] hover:from-[#0052CC] hover:to-[#003d99] text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              Vào trang quản lý →
            </button>
            <p className="mt-4 text-sm text-gray-500">
              Hoặc chọn một trong các tính năng ở trên
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Thông tin cá nhân
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Username:</span>
                <span className="font-medium text-gray-900">
                  {userInfo?.username}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tên:</span>
                <span className="font-medium text-gray-900">
                  {userInfo?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vai trò:</span>
                <span className="font-medium text-green-600">Manager</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Store ID:</span>
                <span className="font-medium text-blue-600">
                  #{userInfo?.storeId}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#0A68FE] to-[#0052CC] rounded-xl shadow-md p-6 text-white">
            <h3 className="text-lg font-semibold mb-3">Hỗ trợ nhanh</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Hướng dẫn sử dụng</span>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span>Liên hệ hỗ trợ</span>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Câu hỏi thường gặp</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerWelcome;
