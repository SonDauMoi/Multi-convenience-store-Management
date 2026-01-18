import React from "react";
import { logoutAPI } from "../../api/authencation";
import { useNavigate } from "react-router-dom";
import Toast from "./Toast.jsx";
import ConfirmModal from "./ConfirmModal.jsx";

const DashboardLayout = ({ 
  title, 
  role, 
  roleBadgeColor = "bg-red-100 text-red-800", 
  stats = [], 
  tabs = [], 
  activeTab, 
  setActiveTab, 
  notification = { show: false, message: "", type: "success" }, 
  setNotification,
  confirmData = { show: false, title: "", message: "", onConfirm: () => {} },
  setConfirmData,
  children 
}) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutAPI();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Shared Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <span className={`px-3 py-1 ${roleBadgeColor} rounded-full text-sm font-medium`}>
              {role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm active:scale-95"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Global Notifications */}
        {notification.show && (
          <Toast 
            message={notification.message} 
            type={notification.type} 
            onClose={() => setNotification({ ...notification, show: false })} 
          />
        )}
        
        {/* Global Confirm Modal */}
        <ConfirmModal 
          show={confirmData.show} 
          title={confirmData.title} 
          message={confirmData.message} 
          confirmText={confirmData.confirmText || "Confirm"} 
          onConfirm={confirmData.onConfirm} 
          onCancel={() => setConfirmData({ ...confirmData, show: false })} 
        />

        {/* Stats Grid */}
        {stats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((s, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 transition-transform hover:translate-y-[-2px]">
                <p className="text-sm text-gray-500 font-medium mb-1">{s.label}</p>
                <p className="text-3xl font-bold text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Tabs Navigation */}
          {tabs.length > 0 && (
            <div className="border-b border-gray-200 bg-gray-50/50">
              <nav className="flex gap-8 px-6 overflow-x-auto" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap capitalize ${
                      activeTab === tab.id
                        ? "border-black text-black"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          )}

          {/* Render Active Tab Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
