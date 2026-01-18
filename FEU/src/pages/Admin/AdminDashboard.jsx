import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ProductManagement from "./ProductManagement.jsx";
import BannerManagement from "./BannerManagement.jsx";
import StoreRevenueAnalytics from "./StoreRevenueAnalytics.jsx";
import { API_BASE_URL } from "../../api/constant";
import { getAccessToken, getUserInfo } from "../../utils/jwt-helper";
import DashboardLayout from "../../components/commom/DashboardLayout.jsx";

const AdminDashboardClean = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalManagers: 0,
    totalStores: 0,
    totalProducts: 0,
  });
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });
  const [confirmData, setConfirmData] = useState({ show: false, title: "", message: "", onConfirm: () => {}, type: "danger" });

  const showNotify = (message, type = "success") => {
    setNotification({ show: true, message, type });
  };

  // State for Create/Edit Modals (integrated into tabs for simplicity or could be separate modals)
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", name: "", email: "", password: "", phone: "", role: "user", storeId: "" });
  const [editingUser, setEditingUser] = useState(null);

  const [showStoreForm, setShowStoreForm] = useState(false);
  const [newStore, setNewStore] = useState({ name: "", address: "", phone: "" });
  const [editingStore, setEditingStore] = useState(null);

  useEffect(() => {
    const info = getUserInfo();
    if (!info || info.role !== "admin") {
      navigate("/");
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [usersRes, managersRes, storesRes, productsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/user`, { headers }),
        axios.get(`${API_BASE_URL}/user/managers`, { headers }),
        axios.get(`${API_BASE_URL}/stores`),
        axios.get(`${API_BASE_URL}/admin/product-templates`, { headers }),
      ]);
      setUsers(usersRes.data);
      setManagers(managersRes.data);
      setStores(storesRes.data);
      setStats({
        totalUsers: usersRes.data.length,
        totalManagers: managersRes.data.length,
        totalStores: storesRes.data.length,
        totalProducts: productsRes.data.length,
      });
    } catch (e) {
      showNotify("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- USER ACTIONS ---
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = getAccessToken();
      if (editingUser) {
        await axios.put(`${API_BASE_URL}/user/${editingUser.id}`, editingUser, { headers: { Authorization: `Bearer ${token}` } });
        showNotify("User updated successfully");
      } else {
        await axios.post(`${API_BASE_URL}/user`, newUser, { headers: { Authorization: `Bearer ${token}` } });
        showNotify("User created successfully");
      }
      setShowUserForm(false);
      setEditingUser(null);
      setNewUser({ username: "", name: "", email: "", password: "", phone: "", role: "user", storeId: "" });
      fetchData();
    } catch (e) {
      showNotify(e.response?.data?.message || "Action failed", "error");
    }
  };

  const deleteUser = (id, name) => {
    setConfirmData({
      show: true,
      title: "Delete Account",
      message: `Are you sure you want to delete "${name}"?`,
      onConfirm: async () => {
        try {
          const token = getAccessToken();
          await axios.delete(`${API_BASE_URL}/user/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          showNotify("User deleted");
          fetchData();
        } catch (e) { showNotify("Delete failed", "error"); }
        finally { setConfirmData(prev => ({ ...prev, show: false })); }
      }
    });
  };

  // --- STORE ACTIONS ---
  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = getAccessToken();
      if (editingStore) {
        await axios.put(`${API_BASE_URL}/stores/${editingStore.id}`, editingStore, { headers: { Authorization: `Bearer ${token}` } });
        showNotify("Store updated");
      } else {
        await axios.post(`${API_BASE_URL}/stores`, newStore, { headers: { Authorization: `Bearer ${token}` } });
        showNotify("Store added");
      }
      setShowStoreForm(false);
      setEditingStore(null);
      setNewStore({ name: "", address: "", phone: "" });
      fetchData();
    } catch (e) { showNotify("Action failed", "error"); }
  };

  const deleteStore = (id, name) => {
    setConfirmData({
      show: true,
      title: "Delete Store",
      message: `Are you sure you want to delete store "${name}"?`,
      onConfirm: async () => {
        try {
          const token = getAccessToken();
          await axios.delete(`${API_BASE_URL}/stores/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          showNotify("Store deleted");
          fetchData();
        } catch (e) { showNotify("Delete failed", "error"); }
        finally { setConfirmData(prev => ({ ...prev, show: false })); }
      }
    });
  };

  const renderActiveTabContent = () => {
    const tableHeaderClass = "px-6 py-3 text-left text-[10px] font-black text-white uppercase tracking-widest";
    const rowTextClass = "px-6 py-4 text-sm font-medium text-gray-700";
    const actionBtnClass = "p-1.5 border border-black rounded text-black hover:bg-black hover:text-white transition-all";

    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-gradient-to-r from-[#0A68FE] to-[#0052CC] rounded-xl p-8 text-white shadow">
              <h3 className="text-2xl font-bold mb-2">Welcome to the Admin Dashboard</h3>
              <p className="text-blue-100">System management overview and quick statistics.</p>
            </div>
          </div>
        );

      case "users":
      case "managers":
        const isManagerTab = activeTab === "managers";
        const displayData = isManagerTab ? managers : users;
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-black uppercase tracking-tight">{activeTab} ({displayData.length})</h3>
              <button onClick={() => { setShowUserForm(true); setEditingUser(null); }} className="px-4 py-2 bg-black text-white rounded-lg font-bold transition-all shadow-md active:scale-95 text-xs">+ Create User</button>
            </div>

            {showUserForm && (
              <div className="mb-6 p-6 bg-gray-50 border rounded-xl animate-fadeIn">
                <form onSubmit={handleUserSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Username" value={editingUser ? editingUser.username : newUser.username} onChange={(e) => editingUser ? setEditingUser({...editingUser, username: e.target.value}) : setNewUser({ ...newUser, username: e.target.value })} className="p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none" required />
                  <input type="text" placeholder="Full Name" value={editingUser ? editingUser.name : newUser.name} onChange={(e) => editingUser ? setEditingUser({...editingUser, name: e.target.value}) : setNewUser({ ...newUser, name: e.target.value })} className="p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none" required />
                  <input type="email" placeholder="Email" value={editingUser ? editingUser.email : newUser.email} onChange={(e) => editingUser ? setEditingUser({...editingUser, email: e.target.value}) : setNewUser({ ...newUser, email: e.target.value })} className="p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none" required />
                  <input type="tel" placeholder="Phone" value={editingUser ? editingUser.phone : newUser.phone} onChange={(e) => editingUser ? setEditingUser({...editingUser, phone: e.target.value}) : setNewUser({ ...newUser, phone: e.target.value })} className="p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none" />
                  {!editingUser && <input type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none" required />}
                  <select value={editingUser ? editingUser.role : newUser.role} onChange={(e) => editingUser ? setEditingUser({...editingUser, role: e.target.value}) : setNewUser({ ...newUser, role: e.target.value })} className="p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none">
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  <div className="col-span-1 md:col-span-2 flex gap-3">
                    <button type="submit" className="px-6 py-2 bg-black text-white rounded-lg font-bold">{editingUser ? "Update" : "Save"}</button>
                    <button type="button" onClick={() => { setShowUserForm(false); setEditingUser(null); }} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-black">
                    <tr>
                      <th className={tableHeaderClass}>ID</th>
                      <th className={tableHeaderClass}>Username</th>
                      <th className={tableHeaderClass}>Name</th>
                      <th className={tableHeaderClass}>Email</th>
                      <th className={tableHeaderClass}>Phone</th>
                      {isManagerTab && <th className={tableHeaderClass}>Store</th>}
                      <th className={tableHeaderClass}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayData.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className={rowTextClass}>{u.id}</td>
                        <td className={rowTextClass}>{u.username}</td>
                        <td className={rowTextClass}>{u.name}</td>
                        <td className={rowTextClass}>{u.email}</td>
                        <td className={rowTextClass}>{u.phone || "-"}</td>
                        {isManagerTab && <td className={rowTextClass}><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase">{stores.find(s => s.id === u.storeId)?.name || "Unassigned"}</span></td>}
                        <td className="px-6 py-4 flex gap-2">
                          <button onClick={() => { setEditingUser(u); setShowUserForm(true); }} className={actionBtnClass}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                          <button onClick={() => deleteUser(u.id, u.username)} className={`${actionBtnClass} hover:bg-red-600 hover:border-red-600 hover:text-white`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h14"/></svg></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "stores":
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-black uppercase tracking-tight">Branches ({stores.length})</h3>
              <button onClick={() => { setShowStoreForm(true); setEditingStore(null); }} className="px-4 py-2 bg-black text-white rounded-lg font-bold text-xs">+ Add Store</button>
            </div>

            {showStoreForm && (
              <div className="mb-6 p-6 bg-gray-50 border rounded-xl animate-fadeIn">
                <form onSubmit={handleStoreSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Store Name" value={editingStore ? editingStore.name : newStore.name} onChange={(e) => editingStore ? setEditingStore({...editingStore, name: e.target.value}) : setNewStore({ ...newStore, name: e.target.value })} className="p-2 border rounded-lg" required />
                  <input type="text" placeholder="Address" value={editingStore ? editingStore.address : newStore.address} onChange={(e) => editingStore ? setEditingStore({...editingStore, address: e.target.value}) : setNewStore({ ...newStore, address: e.target.value })} className="p-2 border rounded-lg" required />
                  <input type="tel" placeholder="Phone" value={editingStore ? editingStore.phone : newStore.phone} onChange={(e) => editingStore ? setEditingStore({...editingStore, phone: e.target.value}) : setNewStore({ ...newStore, phone: e.target.value })} className="p-2 border rounded-lg" />
                  <div className="col-span-1 md:col-span-2 flex gap-3">
                    <button type="submit" className="px-6 py-2 bg-black text-white rounded-lg font-bold">{editingStore ? "Update" : "Save"}</button>
                    <button type="button" onClick={() => { setShowStoreForm(false); setEditingStore(null); }} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-black">
                  <tr>
                    <th className={tableHeaderClass}>ID</th>
                    <th className={tableHeaderClass}>Store Name</th>
                    <th className={tableHeaderClass}>Address</th>
                    <th className={tableHeaderClass}>Phone</th>
                    <th className={tableHeaderClass}>Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stores.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className={rowTextClass}>{s.id}</td>
                      <td className={rowTextClass}>{s.name}</td>
                      <td className={rowTextClass}>{s.address}</td>
                      <td className={rowTextClass}>{s.phone || "-"}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <button onClick={() => { setEditingStore(s); setShowStoreForm(true); }} className={actionBtnClass}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                        <button onClick={() => deleteStore(s.id, s.name)} className={`${actionBtnClass} hover:bg-red-600 hover:border-red-600 hover:text-white`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h14"/></svg></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "products": return <ProductManagement />;
      case "banners": return <BannerManagement />;
      case "revenue": return <StoreRevenueAnalytics />;
      default: return null;
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users" },
    { id: "managers", label: "Managers" },
    { id: "stores", label: "Stores" },
    { id: "products", label: "Products" },
    { id: "banners", label: "Banners" },
    { id: "revenue", label: "Revenue" },
  ];

  const statsList = [
    { label: "Total Users", value: stats.totalUsers },
    { label: "Managers", value: stats.totalManagers },
    { label: "Stores", value: stats.totalStores },
    { label: "Products", value: stats.totalProducts },
  ];

  return (
    <DashboardLayout
      title="Admin Dashboard"
      role="Administrator"
      stats={statsList}
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      notification={notification}
      setNotification={setNotification}
      confirmData={confirmData}
      setConfirmData={setConfirmData}
    >
      {renderActiveTabContent()}
    </DashboardLayout>
  );
};

export default AdminDashboardClean;
