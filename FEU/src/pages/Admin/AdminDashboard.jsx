import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ProductManagement from "./ProductManagement.jsx";
import BannerManagement from "./BannerManagement.jsx";
import StoreRevenueAnalytics from "./StoreRevenueAnalytics.jsx";
import { API_BASE_URL } from "../../api/constant";
import { getAccessToken, getUserInfo } from "../../utils/jwt-helper";
import { logoutAPI } from "../../api/authencation";

// Fully clean rewritten dashboard. Once verified, replace old AdminDashboard.jsx import with this component.

const AdminDashboardClean = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalManagers: 0,
    totalStores: 0,
    totalOrders: 0,
    totalProducts: 0,
  });
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ type: "", message: "" });

  // User state
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "user",
    storeId: "",
  });
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserData, setEditUserData] = useState({
    name: "",
    email: "",
    phone: "",
    storeId: "",
  });

  // Store state
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [newStore, setNewStore] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [editStoreData, setEditStoreData] = useState({
    name: "",
    address: "",
    phone: "",
  });

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ type: null, id: null });

  // Search
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [managerSearchTerm, setManagerSearchTerm] = useState("");
  const [storeSearchTerm, setStoreSearchTerm] = useState("");

  useEffect(() => {
    const info = getUserInfo();
    if (!info || info.role !== "admin") {
      navigate("/");
      return;
    }
    fetchData();
  }, [navigate]);

  const showNotif = (type, message) => {
    setNotification({ type, message });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2600);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [usersRes, managersRes, storesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/user`, { headers }),
        axios.get(`${API_BASE_URL}/user/managers`, { headers }),
        axios.get(`${API_BASE_URL}/stores`),
      ]);
      setUsers(usersRes.data);
      setManagers(managersRes.data);
      setStores(storesRes.data);
      setStats((prev) => ({
        ...prev,
        totalUsers: usersRes.data.length,
        totalManagers: managersRes.data.length,
        totalStores: storesRes.data.length,
      }));
    } catch (e) {
      console.error(e);
      showNotif("error", "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  // User CRUD
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = getAccessToken();
      await axios.post(`${API_BASE_URL}/user`, newUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotif("success", "Thêm người dùng thành công");
      setShowCreateUser(false);
      setNewUser({
        username: "",
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "user",
        storeId: "",
      });
      fetchData();
    } catch (e) {
      console.error(e);
      showNotif(
        "error",
        e.response?.data?.message || "Không thể thêm người dùng"
      );
    }
  };
  const startEditUser = (u) => {
    setEditingUserId(u.id);
    setEditUserData({
      name: u.name || "",
      email: u.email || "",
      phone: u.phone || "",
      storeId: u.storeId || "",
    });
  };
  const cancelEditUser = () => {
    setEditingUserId(null);
    setEditUserData({ name: "", email: "", phone: "", storeId: "" });
  };
  const saveEditUser = async (id) => {
    try {
      const token = getAccessToken();
      await axios.put(`${API_BASE_URL}/user/${id}`, editUserData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotif("success", "Cập nhật thành công");
      cancelEditUser();
      fetchData();
    } catch (e) {
      console.error(e);
      showNotif("error", e.response?.data?.message || "Không thể cập nhật");
    }
  };
  const confirmDeleteUser = (id) => {
    setDeleteTarget({ type: "user", id });
    setShowDeleteModal(true);
  };
  const deleteUser = async () => {
    if (!deleteTarget.id) return;
    try {
      const token = getAccessToken();
      await axios.delete(`${API_BASE_URL}/user/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotif("success", "Xóa người dùng thành công");
      setShowDeleteModal(false);
      setDeleteTarget({ type: null, id: null });
      fetchData();
    } catch (e) {
      console.error(e);
      showNotif(
        "error",
        e.response?.data?.message || "Không thể xóa người dùng"
      );
    }
  };

  // Store CRUD
  const handleCreateStore = async (e) => {
    e.preventDefault();
    try {
      const token = getAccessToken();
      await axios.post(`${API_BASE_URL}/stores`, newStore, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotif("success", "Thêm cửa hàng thành công");
      setShowCreateStore(false);
      setNewStore({ name: "", address: "", phone: "" });
      fetchData();
    } catch (e) {
      console.error(e);
      showNotif(
        "error",
        e.response?.data?.message || "Không thể thêm cửa hàng"
      );
    }
  };
  const startEditStore = (s) => {
    setEditingStoreId(s.id);
    setEditStoreData({
      name: s.name || "",
      address: s.address || "",
      phone: s.phone || "",
    });
  };
  const cancelEditStore = () => {
    setEditingStoreId(null);
    setEditStoreData({ name: "", address: "", phone: "" });
  };
  const saveEditStore = async (id) => {
    try {
      const token = getAccessToken();
      await axios.put(`${API_BASE_URL}/stores/${id}`, editStoreData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotif("success", "Cập nhật cửa hàng thành công");
      cancelEditStore();
      fetchData();
    } catch (e) {
      console.error(e);
      showNotif(
        "error",
        e.response?.data?.message || "Không thể cập nhật cửa hàng"
      );
    }
  };
  const confirmDeleteStore = (id) => {
    setDeleteTarget({ type: "store", id });
    setShowDeleteModal(true);
  };
  const deleteStore = async () => {
    if (!deleteTarget.id) return;
    try {
      const token = getAccessToken();
      await axios.delete(`${API_BASE_URL}/stores/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotif("success", "Xóa cửa hàng thành công");
      setShowDeleteModal(false);
      setDeleteTarget({ type: null, id: null });
      fetchData();
    } catch (e) {
      console.error(e);
      showNotif("error", e.response?.data?.message || "Không thể xóa cửa hàng");
    }
  };

  const handleLogout = async () => {
    await logoutAPI();
    navigate("/");
  };

  // Filters
  const filteredUsers = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );
  const filteredManagers = managers.filter(
    (m) =>
      m.username?.toLowerCase().includes(managerSearchTerm.toLowerCase()) ||
      m.name?.toLowerCase().includes(managerSearchTerm.toLowerCase()) ||
      m.email?.toLowerCase().includes(managerSearchTerm.toLowerCase())
  );
  const filteredStores = stores.filter(
    (s) =>
      s.name?.toLowerCase().includes(storeSearchTerm.toLowerCase()) ||
      s.address?.toLowerCase().includes(storeSearchTerm.toLowerCase())
  );

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-[#0A68FE] to-[#0052CC] rounded-xl p-8 text-white shadow">
        <h3 className="text-2xl font-bold mb-2">
          Chào mừng đến Admin Dashboard
        </h3>
        <p className="text-blue-100">
          Quản lý hệ thống Multi-Convenience Store Management
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h4 className="text-sm font-medium text-gray-600 mb-1">Tổng Users</h4>
          <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h4 className="text-sm font-medium text-gray-600 mb-1">
            Tổng Managers
          </h4>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalManagers}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h4 className="text-sm font-medium text-gray-600 mb-1">
            Tổng Cửa hàng
          </h4>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalStores}
          </p>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Người dùng ({filteredUsers.length})
        </h3>
        <button
          onClick={() => setShowCreateUser(!showCreateUser)}
          className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-medium"
        >
          + Thêm
        </button>
      </div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, username, email..."
          value={userSearchTerm}
          onChange={(e) => setUserSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
        />
      </div>
      {showCreateUser && (
        <div className="mb-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-semibold mb-4 text-gray-900">
            Thêm người dùng mới
          </h4>
          <form onSubmit={handleCreateUser} className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Username"
              value={newUser.username}
              onChange={(e) =>
                setNewUser({ ...newUser, username: e.target.value })
              }
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              required
            />
            <input
              type="text"
              placeholder="Họ và tên"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              required
            />
            <input
              type="tel"
              placeholder="Số điện thoại"
              value={newUser.phone}
              onChange={(e) =>
                setNewUser({ ...newUser, phone: e.target.value })
              }
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            {newUser.role === "manager" && (
              <select
                value={newUser.storeId}
                onChange={(e) =>
                  setNewUser({ ...newUser, storeId: e.target.value })
                }
                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                required
              >
                <option value="">Chọn cửa hàng</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} - {s.address}
                  </option>
                ))}
              </select>
            )}
            <div className="col-span-2 flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-medium"
              >
                Thêm
              </button>
              <button
                type="button"
                onClick={() => setShowCreateUser(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-black">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  USERNAME
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  TÊN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  EMAIL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  PHONE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  TRẠNG THÁI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  HÀNH ĐỘNG
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Không tìm thấy người dùng
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {u.id}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap font-medium">
                      {u.username}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {editingUserId === u.id ? (
                        <input
                          type="text"
                          value={editUserData.name}
                          onChange={(e) =>
                            setEditUserData({
                              ...editUserData,
                              name: e.target.value,
                            })
                          }
                          className="p-1 border rounded w-full"
                        />
                      ) : (
                        u.name
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {editingUserId === u.id ? (
                        <input
                          type="email"
                          value={editUserData.email}
                          onChange={(e) =>
                            setEditUserData({
                              ...editUserData,
                              email: e.target.value,
                            })
                          }
                          className="p-1 border rounded w-full"
                        />
                      ) : (
                        u.email
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {editingUserId === u.id ? (
                        <input
                          type="tel"
                          value={editUserData.phone}
                          onChange={(e) =>
                            setEditUserData({
                              ...editUserData,
                              phone: e.target.value,
                            })
                          }
                          className="p-1 border rounded w-full"
                        />
                      ) : (
                        u.phone || "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          u.isVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {u.isVerified ? "Đã xác thực" : "Chưa xác thực"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {editingUserId === u.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEditUser(u.id)}
                            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full text-xs font-medium"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={cancelEditUser}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-xs font-medium"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditUser(u)}
                            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full text-xs font-medium"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => confirmDeleteUser(u.id)}
                            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-full text-xs font-medium"
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderManagers = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Quản lý ({filteredManagers.length})
        </h3>
        <button
          onClick={() => {
            setShowCreateUser(true);
            setNewUser({
              username: "",
              name: "",
              email: "",
              password: "",
              phone: "",
              role: "manager",
              storeId: "",
            });
          }}
          className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-medium"
        >
          + Thêm quản lý
        </button>
      </div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, username, email..."
          value={managerSearchTerm}
          onChange={(e) => setManagerSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
        />
      </div>
      {showCreateUser && newUser.role === "manager" && (
        <div className="mb-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-semibold mb-4 text-gray-900">Thêm quản lý mới</h4>
          <form onSubmit={handleCreateUser} className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Username"
              value={newUser.username}
              onChange={(e) =>
                setNewUser({ ...newUser, username: e.target.value })
              }
              className="p-2 border rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="Họ và tên"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="p-2 border rounded-lg"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
              className="p-2 border rounded-lg"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
              className="p-2 border rounded-lg"
              required
            />
            <input
              type="tel"
              placeholder="Số điện thoại"
              value={newUser.phone}
              onChange={(e) =>
                setNewUser({ ...newUser, phone: e.target.value })
              }
              className="p-2 border rounded-lg"
            />
            <select
              value={newUser.storeId}
              onChange={(e) =>
                setNewUser({ ...newUser, storeId: e.target.value })
              }
              className="p-2 border rounded-lg"
              required
            >
              <option value="">Chọn cửa hàng</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - {s.address}
                </option>
              ))}
            </select>
            <div className="col-span-2 flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-medium"
              >
                Thêm
              </button>
              <button
                type="button"
                onClick={() => setShowCreateUser(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-black">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  USERNAME
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  TÊN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  EMAIL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  PHONE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  CỬA HÀNG
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  HÀNH ĐỘNG
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredManagers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Không tìm thấy quản lý
                  </td>
                </tr>
              ) : (
                filteredManagers.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {m.id}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap font-medium">
                      {m.username}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {editingUserId === m.id ? (
                        <input
                          type="text"
                          value={editUserData.name}
                          onChange={(e) =>
                            setEditUserData({
                              ...editUserData,
                              name: e.target.value,
                            })
                          }
                          className="p-1 border rounded w-full"
                        />
                      ) : (
                        m.name
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {editingUserId === m.id ? (
                        <input
                          type="email"
                          value={editUserData.email}
                          onChange={(e) =>
                            setEditUserData({
                              ...editUserData,
                              email: e.target.value,
                            })
                          }
                          className="p-1 border rounded w-full"
                        />
                      ) : (
                        m.email
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {editingUserId === m.id ? (
                        <input
                          type="tel"
                          value={editUserData.phone}
                          onChange={(e) =>
                            setEditUserData({
                              ...editUserData,
                              phone: e.target.value,
                            })
                          }
                          className="p-1 border rounded w-full"
                        />
                      ) : (
                        m.phone || "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {editingUserId === m.id ? (
                        <select
                          value={editUserData.storeId}
                          onChange={(e) =>
                            setEditUserData({
                              ...editUserData,
                              storeId: e.target.value,
                            })
                          }
                          className="p-1 border rounded w-full"
                        >
                          <option value="">Chọn cửa hàng</option>
                          {stores.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {stores.find((s) => s.id === m.storeId)?.name || "-"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {editingUserId === m.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEditUser(m.id)}
                            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full text-xs font-medium"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={cancelEditUser}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-xs font-medium"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditUser(m)}
                            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full text-xs font-medium"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => confirmDeleteUser(m.id)}
                            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-full text-xs font-medium"
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderStores = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Cửa hàng ({filteredStores.length})
        </h3>
        <button
          onClick={() => setShowCreateStore(!showCreateStore)}
          className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-medium"
        >
          + Thêm cửa hàng
        </button>
      </div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, địa chỉ..."
          value={storeSearchTerm}
          onChange={(e) => setStoreSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
        />
      </div>
      {showCreateStore && (
        <div className="mb-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-semibold mb-4 text-gray-900">
            Thêm cửa hàng mới
          </h4>
          <form onSubmit={handleCreateStore} className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Tên cửa hàng"
              value={newStore.name}
              onChange={(e) =>
                setNewStore({ ...newStore, name: e.target.value })
              }
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              required
            />
            <input
              type="text"
              placeholder="Địa chỉ"
              value={newStore.address}
              onChange={(e) =>
                setNewStore({ ...newStore, address: e.target.value })
              }
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              required
            />
            <input
              type="tel"
              placeholder="Số điện thoại"
              value={newStore.phone}
              onChange={(e) =>
                setNewStore({ ...newStore, phone: e.target.value })
              }
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent col-span-2"
            />
            <div className="col-span-2 flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-medium"
              >
                Thêm
              </button>
              <button
                type="button"
                onClick={() => setShowCreateStore(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-black">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Tên cửa hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Địa chỉ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Số điện thoại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStores.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Không tìm thấy cửa hàng
                  </td>
                </tr>
              ) : (
                filteredStores.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {s.id}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {editingStoreId === s.id ? (
                        <input
                          type="text"
                          value={editStoreData.name}
                          onChange={(e) =>
                            setEditStoreData({
                              ...editStoreData,
                              name: e.target.value,
                            })
                          }
                          className="p-1 border rounded w-full"
                        />
                      ) : (
                        <span className="font-medium">{s.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {editingStoreId === s.id ? (
                        <input
                          type="text"
                          value={editStoreData.address}
                          onChange={(e) =>
                            setEditStoreData({
                              ...editStoreData,
                              address: e.target.value,
                            })
                          }
                          className="p-1 border rounded w-full"
                        />
                      ) : (
                        s.address
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {editingStoreId === s.id ? (
                        <input
                          type="tel"
                          value={editStoreData.phone}
                          onChange={(e) =>
                            setEditStoreData({
                              ...editStoreData,
                              phone: e.target.value,
                            })
                          }
                          className="p-1 border rounded w-full"
                        />
                      ) : (
                        s.phone || "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {editingStoreId === s.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEditStore(s.id)}
                            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full text-xs font-medium"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={cancelEditStore}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-xs font-medium"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditStore(s)}
                            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full text-xs font-medium"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => confirmDeleteStore(s.id)}
                            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-full text-xs font-medium"
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "users":
        return renderUsers();
      case "managers":
        return renderManagers();
      case "stores":
        return renderStores();
      case "products":
        return <ProductManagement />;
      case "banners":
        return <BannerManagement />;
      case "revenue":
        return <StoreRevenueAnalytics />;
      default:
        return null;
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A68FE]"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              Administrator
            </span>
          </div>
          <button
            onClick={async () => {
              await handleLogout();
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Tổng người dùng</p>
            <p className="text-3xl font-bold text-gray-900">
              {stats.totalUsers}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Quản lý</p>
            <p className="text-3xl font-bold text-gray-900">
              {stats.totalManagers}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Cửa hàng</p>
            <p className="text-3xl font-bold text-gray-900">
              {stats.totalStores}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Sản phẩm</p>
            <p className="text-3xl font-bold text-gray-900">
              {stats.totalProducts}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex gap-8 px-6 overflow-x-auto" aria-label="Tabs">
              {[
                "overview",
                "users",
                "managers",
                "stores",
                "products",
                "banners",
                "revenue",
              ].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? "border-[#0A68FE] text-[#0A68FE]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab === "overview" && "Tổng quan"}
                  {tab === "users" && "Người dùng"}
                  {tab === "managers" && "Quản lý"}
                  {tab === "stores" && "Cửa hàng"}
                  {tab === "products" && "Sản phẩm"}
                  {tab === "banners" && "Banner"}
                  {tab === "revenue" && "Doanh thu"}
                </button>
              ))}
            </nav>
          </div>
          <div className="p-6">{renderActiveTab()}</div>
        </div>
      </div>
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Xác nhận xóa
            </h4>
            <p className="text-gray-600 mb-6">Bạn có chắc muốn xóa mục này?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget({ type: null, id: null });
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  deleteTarget.type === "store" ? deleteStore() : deleteUser();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
      {showNotification && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
              notification.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => setShowNotification(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardClean;
