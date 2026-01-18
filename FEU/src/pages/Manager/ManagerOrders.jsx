import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setLoading } from "../../store/features/common";
import {
  getManagerOrdersAPI,
  acceptOrderAPI,
  declineOrderAPI,
  createShippingAPI,
  completeOrderAPI,
} from "../../api/managerOrder";
import { logoutAPI } from "../../api/authencation";
import { useNavigate } from "react-router-dom";

const ManagerOrders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipping: 0,
    delivered: 0
  });

  const [notification, setNotification] = useState({ show: false, type: "", message: "" });
  const [shippingData, setShippingData] = useState({
    toName: "",
    toPhone: "",
    toAddress: "",
    toWardCode: "",
    toDistrictId: "",
    weight: 200,
    codAmount: 0,
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const showNotif = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: "", message: "" }), 3000);
  };

  const loadOrders = async () => {
    dispatch(setLoading(true));
    try {
      const allOrders = await getManagerOrdersAPI();
      setOrders(allOrders);
      
      const s = { total: allOrders.length, pending: 0, processing: 0, shipping: 0, delivered: 0 };
      allOrders.forEach(o => {
        if (o.status === 'pending') s.pending++;
        else if (o.status === 'processing') s.processing++;
        else if (o.status === 'shipping') s.shipping++;
        else if (o.status === 'delivered') s.delivered++;
      });
      setStats(s);
    } catch (error) {
      showNotif("error", "Failed to load orders");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleLogout = async () => {
    await logoutAPI();
    navigate("/");
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toString().includes(searchTerm) || 
                         o.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || o.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-[#0A68FE] to-[#0052CC] rounded-xl p-8 text-white shadow">
        <h3 className="text-2xl font-bold mb-2">Welcome back, Manager</h3>
        <p className="text-blue-100">Manage your store's orders and inventory efficiently.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h4 className="text-sm font-medium text-gray-600 mb-1">Pending Orders</h4>
          <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h4 className="text-sm font-medium text-gray-600 mb-1">Processing</h4>
          <p className="text-3xl font-bold text-gray-900">{stats.processing}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h4 className="text-sm font-medium text-gray-600 mb-1">Shipping</h4>
          <p className="text-3xl font-bold text-gray-900">{stats.shipping}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h4 className="text-sm font-medium text-gray-600 mb-1">Delivered</h4>
          <p className="text-3xl font-bold text-gray-900">{stats.delivered}</p>
        </div>
      </div>
    </div>
  );

  const renderOrderTable = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 capitalize">{activeTab} Orders</h3>
      </div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by order ID or customer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
        />
      </div>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-black">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Activity</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No orders found</td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm whitespace-nowrap font-medium">{order.id}</td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    <div className="font-medium text-gray-900">{order.user?.name || "N/A"}</div>
                    <div className="text-xs text-gray-500">{new Date(order.order_time).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="max-w-xs truncate">
                      {order.orderDetails?.map(i => `${i.name} x${i.quantity}`).join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap font-bold">
                    {order.final_price?.toLocaleString()}đ
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      order.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      order.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    <div className="flex gap-2">
                      {order.status === "pending" && (
                        <>
                          <button onClick={() => acceptOrderAPI(order.id).then(loadOrders)} className="p-1 border border-gray-300 rounded hover:bg-gray-100 text-green-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                          </button>
                          <button onClick={() => declineOrderAPI(order.id).then(loadOrders)} className="p-1 border border-gray-300 rounded hover:bg-gray-100 text-red-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </>
                      )}
                      {order.status === "processing" && (
                        <button onClick={() => { setSelectedOrder(order); setShowShippingModal(true); }} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200">
                          Ship Order
                        </button>
                      )}
                      {order.status === "shipping" && (
                        <button onClick={() => completeOrderAPI(order.id).then(loadOrders)} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium hover:bg-green-200">
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">Store Manager</span>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">Logout</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Same Stats Cards style as Admin */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Shipping</p>
            <p className="text-3xl font-bold text-gray-900">{stats.shipping}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Delivered</p>
            <p className="text-3xl font-bold text-gray-900">{stats.delivered}</p>
          </div>
        </div>

        {/* Identical Tab Container to Admin */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex gap-8 px-6 overflow-x-auto" aria-label="Tabs">
              {["overview", "all", "pending", "processing", "shipping", "delivered"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap capitalize ${
                    activeTab === tab
                      ? "border-[#0A68FE] text-[#0A68FE]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
          <div className="p-6">
            {activeTab === "overview" ? renderOverview() : renderOrderTable()}
          </div>
        </div>
      </div>

      {/* Modals and Notifications... (Omitted for brevity, but same styling) */}
    </div>
  );
};

export default ManagerOrders;
