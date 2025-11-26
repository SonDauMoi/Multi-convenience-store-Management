import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../api/constant";
import { getAccessToken } from "../../utils/jwt-helper";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [stores, setStores] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    category: "food",
    image: "",
    detailImages: [],
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [detailImagesPreview, setDetailImagesPreview] = useState([]);

  const categories = [
    { value: "", label: "Tất cả danh mục" },
    { value: "food", label: "Đồ ăn" },
    { value: "drink", label: "Đồ uống" },
    { value: "household", label: "Đồ gia dụng" },
    { value: "personal", label: "Đồ dùng cá nhân" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [productsRes, storesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/products`, { headers }),
        axios.get(`${API_BASE_URL}/stores`, { headers }),
      ]);

      setProducts(productsRes.data || []);
      setStores(storesRes.data || []);
    } catch (error) {
      console.error("Failed to load data:", error);
      alert("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setSelectedProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price.toString(),
        quantity: product.quantity.toString(),
        category: product.category,
        image: product.image || "",
        detailImages: product.detailImages || [],
      });
      setImagePreview(product.image);
      setDetailImagesPreview(product.detailImages || []);
    } else {
      setSelectedProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        quantity: "",
        category: "food",
        image: "",
        detailImages: [],
      });
      setImagePreview(null);
      setDetailImagesPreview([]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      quantity: "",
      category: "food",
      image: "",
      detailImages: [],
    });
    setImagePreview(null);
    setDetailImagesPreview([]);
  };

  const handleImageUpload = async (file) => {
    try {
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

      return response.data.imageUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload ảnh thất bại!");
      return null;
    }
  };

  const handleMainImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = await handleImageUpload(file);
      if (imageUrl) {
        setFormData((prev) => ({ ...prev, image: imageUrl }));
        setImagePreview(imageUrl);
      }
    }
  };

  const handleDetailImagesChange = async (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    const uploadPromises = files.map((file) => handleImageUpload(file));
    const uploadedUrls = await Promise.all(uploadPromises);
    const validUrls = uploadedUrls.filter((url) => url !== null);

    if (validUrls.length > 0) {
      setFormData((prev) => ({
        ...prev,
        detailImages: [...prev.detailImages, ...validUrls].slice(0, 5),
      }));
      setDetailImagesPreview((prev) => [...prev, ...validUrls].slice(0, 5));
    }
  };

  const handleRemoveDetailImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      detailImages: prev.detailImages.filter((_, i) => i !== index),
    }));
    setDetailImagesPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = getAccessToken();
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
      };

      if (selectedProduct) {
        await axios.put(
          `${API_BASE_URL}/products/${selectedProduct.id}`,
          productData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Cập nhật sản phẩm thành công!");
      } else {
        await axios.post(`${API_BASE_URL}/products`, productData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Thêm sản phẩm thành công!");
      }

      handleCloseModal();
      loadData();
    } catch (error) {
      console.error("Failed to save product:", error);
      alert(error.response?.data?.message || "Không thể lưu sản phẩm");
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      return;
    }

    try {
      const token = getAccessToken();
      await axios.delete(`${API_BASE_URL}/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Xóa sản phẩm thành công!");
      loadData();
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert(error.response?.data?.message || "Không thể xóa sản phẩm");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const filteredProducts = products.filter((product) => {
    const matchSearch =
      !searchTerm ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory =
      !categoryFilter || product.category === categoryFilter;
    const matchStore =
      !storeFilter || product.storeId === parseInt(storeFilter);
    return matchSearch && matchCategory && matchStore;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Quản lý Sản phẩm ({filteredProducts.length})
        </h3>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors font-medium"
        >
          + Tạo Sản phẩm
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
        >
          <option value="">Tất cả cửa hàng</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-black">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Hình ảnh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Tên sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Số lượng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Cửa hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Không tìm thấy sản phẩm
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                            Không có
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.price?.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {categories.find((c) => c.value === product.category)
                          ?.label || product.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {stores.find((s) => s.id === product.storeId)?.name ||
                          `ID #${product.storeId}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal(product)}
                            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedProduct ? "Chỉnh sửa Sản phẩm" : "Tạo Sản phẩm"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên sản phẩm *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Nhập tên sản phẩm"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Nhập mô tả sản phẩm"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    step="1000"
                    min="0"
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số lượng *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                    min="0"
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Danh mục *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  {categories
                    .filter((cat) => cat.value !== "")
                    .map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hình ảnh chính *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mt-2 w-full h-40 object-cover rounded border border-gray-300"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ảnh chi tiết (tối đa 5 ảnh)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleDetailImagesChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
                {detailImagesPreview.length > 0 && (
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {detailImagesPreview.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={img}
                          alt={`Detail ${idx + 1}`}
                          className="w-full h-20 object-cover rounded border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveDetailImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Đã chọn: {detailImagesPreview.length}/5 ảnh
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
                >
                  {selectedProduct ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
