import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo, getAccessToken } from "../../utils/jwt-helper";
import { logoutAPI } from "../../api/authencation";
import axios from "axios";
import { API_BASE_URL } from "../../api/constant";
import StoreRevenueAnalytics from "../Admin/StoreRevenueAnalytics.jsx";
import Toast from "../../components/commom/Toast.jsx";
import ConfirmModal from "../../components/commom/ConfirmModal.jsx";
import ProductManagement from "../Admin/ProductManagement.jsx";
import DashboardLayout from "../../components/commom/DashboardLayout.jsx";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const userInfo = getUserInfo();
  const [activeTab, setActiveTab] = useState("products");
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    lowStock: 0,
  });

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Notification & Confirm State
  const [notification, setNotification] = useState({ show: false, type: "success", message: "" });
  const [confirmData, setConfirmData] = useState({ show: false, title: "", message: "", onConfirm: () => {} });

  useEffect(() => {
    if (!userInfo || userInfo.role !== "manager") {
      navigate("/");
      return;
    }
    fetchData();
  }, [navigate]);

  const showNotify = (message, type = "success") => {
    setNotification({ show: true, type, message });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [storeProductsRes, pendingRes, assignedRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/store-products`, { headers }),
        axios.get(`${API_BASE_URL}/orders/manager/pending`, { headers }),
        axios.get(`${API_BASE_URL}/orders/manager/assigned`, { headers })
      ]);

      const pendingOrders = Array.isArray(pendingRes.data) ? pendingRes.data : (pendingRes.data?.orders || []);
      const assignedOrders = Array.isArray(assignedRes.data) ? assignedRes.data : (assignedRes.data?.orders || []);
      const allOrders = [...pendingOrders, ...assignedOrders];
      const productList = storeProductsRes.data.products || [];

      setProducts(productList);
      setOrders(allOrders);
      setStats({
        totalProducts: productList.length,
        totalOrders: allOrders.length,
        pendingOrders: allOrders.filter(o => o.status === 'pending').length,
        lowStock: productList.filter(p => p.quantity < 10).length,
      });
    } catch (error) {
      console.error("Error:", error);
      showNotify("Failed to load store data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const token = getAccessToken();
      await axios.post(`${API_BASE_URL}/orders/manager/accept/${orderId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      showNotify("Order accepted successfully!");
      fetchData();
    } catch (e) { 
      showNotify("Failed to accept order", "error"); 
    }
  };

  const handleDeclineOrder = (orderId) => {
    setConfirmData({
      show: true,
      title: "Decline Order",
      message: "Are you sure you want to decline this order?",
      onConfirm: async () => {
        try {
          const token = getAccessToken();
          await axios.post(`${API_BASE_URL}/orders/manager/decline/${orderId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
          showNotify("Order declined");
          fetchData();
        } catch (e) { 
          showNotify("Failed to decline order", "error"); 
        } finally {
          setConfirmData(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const filteredOrders = orders.filter(o => {
    const matchesTab = orderFilter === "all" || o.status === orderFilter;
    const matchesSearch = o.id.toString().includes(searchTerm) || (o.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "products", label: "Products" },
    { id: "orders", label: "Orders" },
    { id: "revenue", label: "Revenue" },
  ];

  const statsList = [
    { label: "Inventory", value: stats.totalProducts },
    { label: "Total Orders", value: stats.totalOrders },
    { label: "Pending", value: stats.pendingOrders },
    { label: "Low Stock", value: stats.lowStock },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-gradient-to-r from-[#0A68FE] to-[#0052CC] rounded-xl p-8 text-white shadow">
              <h3 className="text-2xl font-bold mb-2">Welcome back, {userInfo?.name}!</h3>
              <p className="text-blue-100 font-medium">Managing Store #{userInfo?.storeId}.</p>
            </div>
          </div>
        );
      case "products":
        return <ProductManagement />;
      case "orders":
        return (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-black uppercase tracking-tight">Orders ({filteredOrders.length})</h3>
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                {["all", "pending", "processing", "completed"].map(f => (
                  <button key={f} onClick={() => setOrderFilter(f)} className={`px-4 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${orderFilter === f ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"}`}>{f}</button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto border rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-black">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-black text-white uppercase tracking-widest">ID</th>
                    <th className="px-6 py-3 text-left text-[10px] font-black text-white uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-3 text-left text-[10px] font-black text-white uppercase tracking-widest">Total</th>
                    <th className="px-6 py-3 text-left text-[10px] font-black text-white uppercase tracking-widest">Status</th>
                    <th className="px-6 py-3 text-left text-[10px] font-black text-white uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold">#{o.id}</td>
                      <td className="px-6 py-4 text-sm">{o.user?.name || "Guest"}</td>
                      <td className="px-6 py-4 text-sm font-bold text-blue-600">{o.final_price?.toLocaleString()}đ</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-[10px] font-black rounded-full uppercase tracking-tighter">{o.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {o.status === 'pending' && (
                            <>
                              <button onClick={() => handleAcceptOrder(o.id)} className="p-1 bg-black text-white rounded hover:bg-gray-800 transition-all shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></button>
                              <button onClick={() => handleDeclineOrder(o.id)} className="p-1 border border-black rounded hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </>
                          )}
                          <button onClick={() => navigate(`/manager/orders/${o.id}`)} className="px-2 py-1 border border-black text-[10px] font-black rounded uppercase hover:bg-black hover:text-white transition-all">Details</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "revenue":
        return <StoreRevenueAnalytics />;
      default:
        return null;
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black"></div></div>;

  return (
    <DashboardLayout
      title="Manager Dashboard"
      role="Manager"
      roleBadgeColor="bg-blue-100 text-blue-800"
      stats={statsList}
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      notification={notification}
      setNotification={setNotification}
      confirmData={confirmData}
      setConfirmData={setConfirmData}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default ManagerDashboard;
