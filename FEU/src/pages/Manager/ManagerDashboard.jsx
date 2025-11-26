import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo } from "../../utils/jwt-helper";
import { logoutAPI } from "../../api/authencation";
import axios from "axios";
import { API_BASE_URL } from "../../api/constant";
import { getAccessToken } from "../../utils/jwt-helper";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const userInfo = getUserInfo();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalOrders: 0,
  });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productTemplates, setProductTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createMode, setCreateMode] = useState("manual"); // "manual" or "template"
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  });
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryData, setEditCategoryData] = useState({
    name: "",
    description: "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    category: "household",
    image: "",
  });
  const [editProductData, setEditProductData] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    category: "",
    image: "",
    detailImages: [],
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [detailImagesPreview, setDetailImagesPreview] = useState([]);
  const [productToDelete, setProductToDelete] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [orderFilter, setOrderFilter] = useState("all"); // all, pending, processing, completed

  useEffect(() => {
    const userInfo = getUserInfo();
    if (!userInfo || userInfo.role !== "manager") {
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

      const [
        storeProductsRes,
        categoriesRes,
        pendingOrdersRes,
        assignedOrdersRes,
        templatesRes,
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/store-products`, { headers }),
        axios.get(`${API_BASE_URL}/category`, { headers }),
        axios.get(`${API_BASE_URL}/orders/manager/pending`, { headers }),
        axios.get(`${API_BASE_URL}/orders/manager/assigned`, { headers }),
        axios.get(`${API_BASE_URL}/admin/product-templates`, { headers }),
      ]);

      const allOrders = [...pendingOrdersRes.data, ...assignedOrdersRes.data];
      setProducts(storeProductsRes.data.products || []);
      setCategories(categoriesRes.data);
      setOrders(allOrders);
      setProductTemplates(templatesRes.data || []);
      setStats({
        totalProducts: (storeProductsRes.data.products || []).length,
        totalCategories: categoriesRes.data.length,
        totalOrders: allOrders.length,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const showNotif = (type, message) => {
    setNotification({ type, message });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Order management functions
  const handleViewOrderDetail = async (orderId) => {
    try {
      const token = getAccessToken();
      const response = await axios.get(`${API_BASE_URL}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedOrder(response.data);
      setShowOrderDetail(true);
    } catch (error) {
      showNotif("error", "Không thể tải chi tiết đơn hàng!");
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const token = getAccessToken();
      await axios.post(
        `${API_BASE_URL}/orders/manager/accept/${orderId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      showNotif("success", "Đã chấp nhận đơn hàng!");
      setShowOrderDetail(false);
      fetchData();
    } catch (error) {
      showNotif(
        "error",
        error.response?.data?.message || "Chấp nhận thất bại!"
      );
    }
  };

  const handleDeclineOrder = async (orderId) => {
    try {
      const token = getAccessToken();
      await axios.post(
        `${API_BASE_URL}/orders/manager/decline/${orderId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      showNotif("success", "Đã từ chối đơn hàng!");
      setShowOrderDetail(false);
      fetchData();
    } catch (error) {
      showNotif("error", error.response?.data?.message || "Từ chối thất bại!");
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      const token = getAccessToken();
      await axios.post(
        `${API_BASE_URL}/orders/manager/complete/${orderId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      showNotif("success", "Đã hoàn thành đơn hàng!");
      setShowOrderDetail(false);
      fetchData();
    } catch (error) {
      showNotif(
        "error",
        error.response?.data?.message || "Hoàn thành thất bại!"
      );
    }
  };

  const getFilteredOrders = () => {
    if (orderFilter === "all") return orders;
    return orders.filter((order) => order.status === orderFilter);
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800",
    };
    const statusText = {
      pending: "Chờ xử lý",
      processing: "Đang xử lý",
      completed: "Hoàn thành",
      declined: "Đã hủy",
    };
    return (
      <span
        className={`px-3 py-1 ${
          statusStyles[status] || statusStyles.pending
        } rounded-full text-xs font-medium`}
      >
        {statusText[status] || statusText.pending}
      </span>
    );
  };

  const handleLogout = async () => {
    await logoutAPI();
    navigate("/v1/login");
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const token = getAccessToken();
      await axios.post(`${API_BASE_URL}/category`, newCategory, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotif("success", "Thêm danh mục thành công!");
      setShowCreateCategory(false);
      setNewCategory({ name: "", description: "" });
      fetchData();
    } catch (error) {
      showNotif(
        "error",
        error.response?.data?.message || "Thêm danh mục thất bại!"
      );
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category.id);
    setEditCategoryData({
      name: category.name,
      description: category.description || "",
    });
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setEditCategoryData({ name: "", description: "" });
  };

  const handleSaveEditCategory = async (categoryId) => {
    try {
      const token = getAccessToken();
      await axios.put(
        `${API_BASE_URL}/category/${categoryId}`,
        editCategoryData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      showNotif("success", "Cập nhật danh mục thành công!");
      setEditingCategory(null);
      fetchData();
    } catch (error) {
      showNotif("error", error.response?.data?.message || "Cập nhật thất bại!");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      const token = getAccessToken();
      await axios.delete(`${API_BASE_URL}/category/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotif("success", "Xóa danh mục thành công!");
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      fetchData();
    } catch (error) {
      showNotif(
        "error",
        error.response?.data?.message || "Xóa danh mục thất bại!"
      );
    }
  };

  const confirmDeleteCategory = (categoryId) => {
    setCategoryToDelete(categoryId);
    setShowDeleteModal(true);
  };

  // Product management functions
  const handleImageUpload = async (file, isEdit = false) => {
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

      const base64 = await base64Promise;

      const token = getAccessToken();
      const response = await axios.post(
        `${API_BASE_URL}/file-upload`,
        { base64 },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const imageUrl = response.data.imageUrl;
      if (isEdit) {
        setEditProductData({ ...editProductData, image: imageUrl });
      } else {
        setNewProduct({ ...newProduct, image: imageUrl });
      }
      return imageUrl;
    } catch (error) {
      showNotif("error", "Upload ảnh thất bại!");
      return null;
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const token = getAccessToken();

      if (createMode === "template") {
        // Thêm sản phẩm từ template
        if (!selectedTemplateId) {
          showNotif("error", "Vui lòng chọn sản phẩm mẫu!");
          return;
        }

        await axios.post(
          `${API_BASE_URL}/store-products`,
          {
            productTemplateId: parseInt(selectedTemplateId),
            quantity: parseInt(newProduct.quantity),
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        showNotif("success", "Thêm sản phẩm vào cửa hàng thành công!");
      } else {
        // Tạo sản phẩm thủ công (legacy - giữ lại để tương thích)
        const productData = {
          ...newProduct,
          price: parseFloat(newProduct.price),
          quantity: parseInt(newProduct.quantity),
          storeId: userInfo.storeId,
        };

        await axios.post(`${API_BASE_URL}/products`, productData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        showNotif("success", "Thêm sản phẩm thành công!");
      }

      setShowCreateProduct(false);
      setNewProduct({
        name: "",
        description: "",
        price: "",
        quantity: "",
        category: "household",
        image: "",
      });
      setImagePreview(null);
      setCreateMode("manual");
      setSelectedTemplateId("");
      fetchData();
    } catch (error) {
      showNotif(
        "error",
        error.response?.data?.message || "Thêm sản phẩm thất bại!"
      );
    }
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setNewProduct({
        name: "",
        description: "",
        price: "",
        quantity: "",
        category: "household",
        image: "",
      });
      setImagePreview(null);
      return;
    }

    const template = productTemplates.find(
      (t) => t.id === parseInt(templateId)
    );
    if (template) {
      setNewProduct({
        name: template.name,
        description: template.description || "",
        price: template.price.toString(),
        quantity: "",
        category: template.category,
        image: template.image || "",
      });
      setImagePreview(template.image || null);
    }
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setEditProductData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      category: product.category,
      image: product.image || "",
      detailImages: [],
    });
    setImagePreview(product.image);
    setDetailImagesPreview([]);
    setShowEditModal(true);
  };

  const handleCancelEditProduct = () => {
    setShowEditModal(false);
    setSelectedProduct(null);
    setEditProductData({
      name: "",
      description: "",
      price: "",
      quantity: "",
      category: "",
      image: "",
      detailImages: [],
    });
    setImagePreview(null);
    setDetailImagesPreview([]);
  };

  const handleUploadDetailImage = async (file) => {
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

      const base64 = await base64Promise;

      const token = getAccessToken();
      const response = await axios.post(
        `${API_BASE_URL}/file-upload`,
        { base64 },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const imageUrl = response.data.imageUrl;
      return imageUrl;
    } catch (error) {
      showNotif("error", "Upload ảnh thất bại!");
      return null;
    }
  };

  const handleAddDetailImage = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = await handleUploadDetailImage(file);
      if (imageUrl) {
        setEditProductData({
          ...editProductData,
          detailImages: [...editProductData.detailImages, imageUrl],
        });

        const reader = new FileReader();
        reader.onloadend = () => {
          setDetailImagesPreview([...detailImagesPreview, reader.result]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRemoveDetailImage = (index) => {
    const newDetailImages = editProductData.detailImages.filter(
      (_, i) => i !== index
    );
    const newPreviews = detailImagesPreview.filter((_, i) => i !== index);
    setEditProductData({ ...editProductData, detailImages: newDetailImages });
    setDetailImagesPreview(newPreviews);
  };

  const handleSaveEditProduct = async () => {
    try {
      const token = getAccessToken();
      const productData = {
        ...editProductData,
        price: parseFloat(editProductData.price),
        quantity: parseInt(editProductData.quantity),
      };

      await axios.put(
        `${API_BASE_URL}/products/${selectedProduct.id}`,
        productData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showNotif("success", "Cập nhật sản phẩm thành công!");
      handleCancelEditProduct();
      fetchData();
    } catch (error) {
      showNotif("error", error.response?.data?.message || "Cập nhật thất bại!");
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const token = getAccessToken();
      await axios.delete(`${API_BASE_URL}/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotif("success", "Xóa sản phẩm thành công!");
      setShowDeleteModal(false);
      setProductToDelete(null);
      fetchData();
    } catch (error) {
      showNotif(
        "error",
        error.response?.data?.message || "Xóa sản phẩm thất bại!"
      );
    }
  };

  const confirmDeleteProduct = (productId) => {
    setProductToDelete(productId);
    setShowDeleteModal(true);
  };

  const tabs = [
    { id: "overview", label: "Tổng quan" },
    { id: "products", label: "Sản phẩm" },
    { id: "categories", label: "Danh mục" },
    { id: "orders", label: "Đơn hàng" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#0A68FE] mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg fixed h-full z-50">
        {/* Logo */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-[#0A68FE] to-[#0052CC] rounded-lg">
              <svg
                className="w-6 h-6 text-white"
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
            <div>
              <h1 className="font-bold text-gray-900">Manager</h1>
              <p className="text-xs text-gray-500">
                Store #{userInfo?.storeId}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                activeTab === tab.id
                  ? "bg-blue-50 text-[#0A68FE] font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 w-full p-4 border-t bg-white">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900">
              {userInfo?.name}
            </p>
            <p className="text-xs text-gray-500">{userInfo?.username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="px-8 py-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h2>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#0A68FE] to-[#0052CC] rounded-xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-2">
                  Chào mừng, {userInfo?.name}!
                </h3>
                <p className="text-blue-100">
                  Quản lý cửa hàng #{userInfo?.storeId} - Multi-Convenience
                  Store
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500 rounded-lg">
                      <svg
                        className="w-8 h-8 text-white"
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
                  </div>
                  <h4 className="text-sm font-medium text-blue-600 mb-1">
                    Sản phẩm
                  </h4>
                  <p className="text-3xl font-bold text-blue-900">
                    {stats.totalProducts}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-500 rounded-lg">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h4 className="text-sm font-medium text-purple-600 mb-1">
                    Danh mục
                  </h4>
                  <p className="text-3xl font-bold text-purple-900">
                    {stats.totalCategories}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-500 rounded-lg">
                      <svg
                        className="w-8 h-8 text-white"
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
                  </div>
                  <h4 className="text-sm font-medium text-green-600 mb-1">
                    Đơn hàng
                  </h4>
                  <p className="text-3xl font-bold text-green-900">
                    {stats.totalOrders}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Thông tin cá nhân
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Tên:</span>
                      <span className="font-medium text-gray-900">
                        {userInfo?.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Username:</span>
                      <span className="font-medium text-gray-900">
                        {userInfo?.username}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Cửa hàng:</span>
                      <span className="font-medium text-blue-600">
                        #{userInfo?.storeId}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#0A68FE] to-[#0052CC] rounded-xl p-6 text-white shadow-sm">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <span>⚡</span> Truy cập nhanh
                  </h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab("products")}
                      className="w-full text-left px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-3"
                    >
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
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                      <span>Quản lý sản phẩm</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("categories")}
                      className="w-full text-left px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-3"
                    >
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
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      <span>Quản lý danh mục</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Danh sách sản phẩm ({products.length})
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreateProduct(!showCreateProduct)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    + Thêm sản phẩm
                  </button>
                  <button
                    onClick={() => navigate("/manager/products")}
                    className="px-4 py-2 bg-[#0A68FE] hover:bg-[#0052CC] text-white rounded-lg transition-colors"
                  >
                    Quản lý chi tiết →
                  </button>
                </div>
              </div>

              {/* Create Product Form */}
              {showCreateProduct && (
                <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold mb-4">Thêm sản phẩm mới</h4>

                  {/* Mode Selection */}
                  <div className="mb-4 flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setCreateMode("manual");
                        setSelectedTemplateId("");
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        createMode === "manual"
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Tạo thủ công
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateMode("template")}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        createMode === "template"
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Chọn từ mẫu có sẵn
                    </button>
                  </div>

                  {/* Template Selection */}
                  {createMode === "template" && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn sản phẩm mẫu
                      </label>
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => handleTemplateSelect(e.target.value)}
                        className="w-full p-2 border rounded-lg"
                        required
                      >
                        <option value="">-- Chọn sản phẩm mẫu --</option>
                        {productTemplates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name} -{" "}
                            {template.price.toLocaleString("vi-VN")}đ (
                            {template.category})
                          </option>
                        ))}
                      </select>
                      {selectedTemplateId && (
                        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                          <h5 className="font-medium mb-2">
                            Thông tin sản phẩm:
                          </h5>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Tên:</span>
                              <p className="font-medium">{newProduct.name}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Giá:</span>
                              <p className="font-medium">
                                {parseFloat(newProduct.price).toLocaleString(
                                  "vi-VN"
                                )}
                                đ
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Danh mục:</span>
                              <p className="font-medium">
                                {newProduct.category}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Mô tả:</span>
                              <p className="font-medium">
                                {newProduct.description || "Không có"}
                              </p>
                            </div>
                          </div>
                          {newProduct.image && (
                            <div className="mt-3">
                              <span className="text-gray-600 text-sm">
                                Ảnh sản phẩm:
                              </span>
                              <img
                                src={newProduct.image}
                                alt="Preview"
                                className="mt-2 h-32 object-cover rounded border"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleCreateProduct} className="space-y-4">
                    {createMode === "template" ? (
                      // Template mode - chỉ nhập số lượng
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Số lượng nhập kho *
                        </label>
                        <input
                          type="number"
                          placeholder="Nhập số lượng"
                          value={newProduct.quantity}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              quantity: e.target.value,
                            })
                          }
                          className="w-full p-3 border rounded-lg text-lg"
                          required
                          min="1"
                          disabled={!selectedTemplateId}
                        />
                        {!selectedTemplateId && (
                          <p className="mt-2 text-sm text-gray-500">
                            Vui lòng chọn sản phẩm mẫu trước
                          </p>
                        )}
                      </div>
                    ) : (
                      // Manual mode - nhập đầy đủ thông tin
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Tên sản phẩm"
                          value={newProduct.name}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              name: e.target.value,
                            })
                          }
                          className="p-2 border rounded-lg col-span-2"
                          required
                        />
                        <textarea
                          placeholder="Mô tả"
                          value={newProduct.description}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              description: e.target.value,
                            })
                          }
                          className="p-2 border rounded-lg col-span-2"
                          rows="3"
                        />
                        <input
                          type="number"
                          placeholder="Giá"
                          value={newProduct.price}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              price: e.target.value,
                            })
                          }
                          className="p-2 border rounded-lg"
                          required
                        />
                        <input
                          type="number"
                          placeholder="Số lượng"
                          value={newProduct.quantity}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              quantity: e.target.value,
                            })
                          }
                          className="p-2 border rounded-lg"
                          required
                        />
                        <select
                          value={newProduct.category}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              category: e.target.value,
                            })
                          }
                          className="p-2 border rounded-lg"
                        >
                          <option value="household">Household</option>
                          <option value="food">Food</option>
                          <option value="drink">Drink</option>
                          <option value="personal">Personal</option>
                        </select>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ảnh sản phẩm
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                handleImageUpload(file, false);
                                const reader = new FileReader();
                                reader.onloadend = () =>
                                  setImagePreview(reader.result);
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="p-2 border rounded-lg w-full"
                          />
                          {imagePreview && (
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="mt-2 h-32 object-cover rounded"
                            />
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                      >
                        Thêm
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateProduct(false);
                          setImagePreview(null);
                          setCreateMode("manual");
                          setSelectedTemplateId("");
                          setNewProduct({
                            name: "",
                            description: "",
                            price: "",
                            quantity: "",
                            category: "household",
                            image: "",
                          });
                        }}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Ảnh
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tên sản phẩm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Giá
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Số lượng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Danh mục
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {product.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-16 w-16 object-cover rounded"
                            />
                          ) : (
                            <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-gray-400 text-xs">
                                No image
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="font-medium">{product.name}</span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {product.price?.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {product.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded transition-colors"
                              title="Sửa"
                            >
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
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => confirmDeleteProduct(product.id)}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors"
                              title="Xóa"
                            >
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === "categories" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Danh sách danh mục ({categories.length})
                </h3>
                <button
                  onClick={() => setShowCreateCategory(!showCreateCategory)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  + Thêm danh mục
                </button>
              </div>

              {showCreateCategory && (
                <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold mb-4">Thêm danh mục mới</h4>
                  <form
                    onSubmit={handleCreateCategory}
                    className="grid grid-cols-2 gap-4"
                  >
                    <input
                      type="text"
                      placeholder="Tên danh mục"
                      value={newCategory.name}
                      onChange={(e) =>
                        setNewCategory({
                          ...newCategory,
                          name: e.target.value,
                        })
                      }
                      className="p-2 border rounded-lg col-span-2"
                      required
                    />
                    <textarea
                      placeholder="Mô tả (tùy chọn)"
                      value={newCategory.description}
                      onChange={(e) =>
                        setNewCategory({
                          ...newCategory,
                          description: e.target.value,
                        })
                      }
                      className="p-2 border rounded-lg col-span-2"
                      rows="3"
                    />
                    <div className="col-span-2 flex gap-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                      >
                        Thêm
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateCategory(false)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tên danh mục
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Mô tả
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {category.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {editingCategory === category.id ? (
                            <input
                              type="text"
                              value={editCategoryData.name}
                              onChange={(e) =>
                                setEditCategoryData({
                                  ...editCategoryData,
                                  name: e.target.value,
                                })
                              }
                              className="p-1 border rounded w-full"
                            />
                          ) : (
                            <span className="font-medium">{category.name}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {editingCategory === category.id ? (
                            <input
                              type="text"
                              value={editCategoryData.description}
                              onChange={(e) =>
                                setEditCategoryData({
                                  ...editCategoryData,
                                  description: e.target.value,
                                })
                              }
                              className="p-1 border rounded w-full"
                            />
                          ) : (
                            category.description || "-"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {editingCategory === category.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleSaveEditCategory(category.id)
                                }
                                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors"
                              >
                                Lưu
                              </button>
                              <button
                                onClick={handleCancelEditCategory}
                                className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium transition-colors"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditCategory(category)}
                                className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded transition-colors"
                                title="Sửa"
                              >
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
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() =>
                                  confirmDeleteCategory(category.id)
                                }
                                className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors"
                                title="Xóa"
                              >
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
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Quản lý đơn hàng ({getFilteredOrders().length})
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOrderFilter("all")}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      orderFilter === "all"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setOrderFilter("pending")}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      orderFilter === "pending"
                        ? "bg-yellow-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Chờ xử lý
                  </button>
                  <button
                    onClick={() => setOrderFilter("processing")}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      orderFilter === "processing"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Đang xử lý
                  </button>
                  <button
                    onClick={() => setOrderFilter("completed")}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      orderFilter === "completed"
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Hoàn thành
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã đơn
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Khách hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thời gian
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tổng tiền
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredOrders().map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {order.user?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.order_time).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.total_price?.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleViewOrderDetail(order.id)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Chi tiết đơn hàng #{selectedOrder.id}
              </h2>
              <button
                onClick={() => setShowOrderDetail(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-500"
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

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Khách hàng
                  </label>
                  <p className="text-gray-900 font-medium">
                    {selectedOrder.user?.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Thời gian đặt
                  </label>
                  <p className="text-gray-900">
                    {new Date(selectedOrder.order_time).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Trạng thái
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Phương thức thanh toán
                  </label>
                  <p className="text-gray-900 uppercase">
                    {selectedOrder.payment_method}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Sản phẩm</h3>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.orderDetails?.map((item, index) => (
                    <div key={index} className="px-4 py-3 flex justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          Số lượng: {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium text-gray-900">
                        {item.total_price?.toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-blue-600">
                    {selectedOrder.total_price?.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              {selectedOrder.status === "pending" && (
                <>
                  <button
                    onClick={() => handleDeclineOrder(selectedOrder.id)}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => handleAcceptOrder(selectedOrder.id)}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Chấp nhận
                  </button>
                </>
              )}
              {selectedOrder.status === "processing" && (
                <button
                  onClick={() => handleCompleteOrder(selectedOrder.id)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Hoàn thành
                </button>
              )}
              <button
                onClick={() => setShowOrderDetail(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Xác nhận xóa
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa{" "}
              {productToDelete
                ? "sản phẩm"
                : categoryToDelete
                ? "danh mục"
                : "mục"}{" "}
              này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCategoryToDelete(null);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() =>
                  productToDelete
                    ? handleDeleteProduct(productToDelete)
                    : handleDeleteCategory(categoryToDelete)
                }
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div
            className={`rounded-lg p-4 shadow-lg ${
              notification.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {notification.type === "success" ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                )}
              </svg>
              <p className="font-medium">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Chỉnh sửa sản phẩm
              </h2>
              <button
                onClick={handleCancelEditProduct}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-500"
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

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editProductData.name}
                  onChange={(e) =>
                    setEditProductData({
                      ...editProductData,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập tên sản phẩm"
                />
              </div>

              {/* Price and Quantity Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={editProductData.price}
                    onChange={(e) =>
                      setEditProductData({
                        ...editProductData,
                        price: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số lượng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={editProductData.quantity}
                    onChange={(e) =>
                      setEditProductData({
                        ...editProductData,
                        quantity: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <select
                  value={editProductData.category}
                  onChange={(e) =>
                    setEditProductData({
                      ...editProductData,
                      category: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="household">Đồ gia dụng</option>
                  <option value="food">Thực phẩm</option>
                  <option value="drink">Đồ uống</option>
                  <option value="personal">Đồ dùng cá nhân</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả sản phẩm
                </label>
                <textarea
                  value={editProductData.description || ""}
                  onChange={(e) =>
                    setEditProductData({
                      ...editProductData,
                      description: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Nhập mô tả chi tiết về sản phẩm..."
                />
              </div>

              {/* Main Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh chính
                </label>
                <div className="flex items-start gap-4">
                  {(imagePreview || editProductData.image) && (
                    <div className="relative">
                      <img
                        src={imagePreview || editProductData.image}
                        alt="Main product"
                        className="h-32 w-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleImageUpload(file, true);
                          const reader = new FileReader();
                          reader.onloadend = () =>
                            setImagePreview(reader.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="main-image-upload"
                    />
                    <label
                      htmlFor="main-image-upload"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Chọn hình ảnh
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Khuyến nghị: 500x500px, PNG hoặc JPG
                    </p>
                  </div>
                </div>
              </div>

              {/* Detail Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh chi tiết
                </label>
                <div className="space-y-4">
                  {/* Image Gallery */}
                  {detailImagesPreview.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {detailImagesPreview.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Detail ${index + 1}`}
                            className="h-24 w-24 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            onClick={() => handleRemoveDetailImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Xóa"
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
                      ))}
                    </div>
                  )}

                  {/* Add Image Button */}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAddDetailImage}
                      className="hidden"
                      id="detail-images-upload"
                    />
                    <label
                      htmlFor="detail-images-upload"
                      className="inline-flex items-center px-4 py-2 border-2 border-dashed border-gray-300 hover:border-blue-500 text-gray-600 hover:text-blue-600 rounded-lg cursor-pointer transition-colors"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Thêm hình ảnh chi tiết
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Có thể chọn nhiều hình ảnh cùng lúc
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              <button
                onClick={handleCancelEditProduct}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEditProduct}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div
            className={`px-6 py-4 rounded-lg shadow-lg ${
              notification.type === "success" ? "bg-green-500" : "bg-red-500"
            } text-white flex items-center gap-3`}
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
                strokeWidth={2}
                d={
                  notification.type === "success"
                    ? "M5 13l4 4L19 7"
                    : "M6 18L18 6M6 6l12 12"
                }
              />
            </svg>
            <p className="font-medium">{notification.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
