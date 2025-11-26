import { useState, useEffect } from "react";
import {
  getAllProductTemplatesAPI,
  createProductTemplateAPI,
  updateProductTemplateAPI,
  deleteProductTemplateAPI,
} from "../../api/admin.js";
import { fileUploadAPI } from "../../api/fileUploadAPI.js";

const ProductTemplateManagement = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "food",
    image: "",
    images: [],
  });
  const [mainImageFile, setMainImageFile] = useState(null);
  const [detailImageFiles, setDetailImageFiles] = useState([]);

  const categories = [
    { value: "", label: "Tất cả danh mục" },
    { value: "food", label: "Đồ ăn" },
    { value: "drink", label: "Đồ uống" },
    { value: "household", label: "Đồ gia dụng" },
    { value: "personal", label: "Đồ dùng cá nhân" },
  ];

  useEffect(() => {
    loadTemplates();
  }, [searchTerm, categoryFilter]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;
      const data = await getAllProductTemplatesAPI(params);
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Failed to load templates:", error);
      alert("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description || "",
        price: template.price,
        category: template.category,
        image: template.image || "",
        images: template.images || [],
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "food",
        image: "",
        images: [],
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setMainImageFile(null);
    setDetailImageFiles([]);
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "food",
      image: "",
      images: [],
    });
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMainImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDetailImagesChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setDetailImageFiles(files);

    const readers = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((results) => {
      setFormData((prev) => ({ ...prev, images: results }));
    });
  };

  const removeDetailImage = (index) => {
    setDetailImageFiles((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = formData.image;
      let imageUrls = [...formData.images];

      // Upload main image if new file selected
      if (mainImageFile) {
        const uploadRes = await fileUploadAPI(mainImageFile);
        imageUrl = uploadRes.imageUrl;
      }

      // Upload detail images if new files selected
      if (detailImageFiles.length > 0) {
        const uploadPromises = detailImageFiles.map(async (file) => {
          const uploadRes = await fileUploadAPI(file);
          return uploadRes.imageUrl;
        });
        imageUrls = await Promise.all(uploadPromises);
      }

      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        image: imageUrl,
        images: imageUrls,
      };

      if (editingTemplate) {
        await updateProductTemplateAPI(editingTemplate.id, payload);
        alert("Cập nhật mẫu sản phẩm thành công");
      } else {
        await createProductTemplateAPI(payload);
        alert("Tạo mẫu sản phẩm thành công");
      }

      handleCloseModal();
      loadTemplates();
    } catch (error) {
      console.error("Failed to save template:", error);
      alert(error.response?.data?.message || "Không thể lưu mẫu sản phẩm");
    }
  };

  const handleDelete = async (id) => {
    if (
      !confirm(
        "Bạn có chắc chắn muốn xóa mẫu sản phẩm này? Sẽ thất bại nếu có cửa hàng đang sử dụng."
      )
    ) {
      return;
    }

    try {
      await deleteProductTemplateAPI(id);
      alert("Xóa mẫu sản phẩm thành công");
      loadTemplates();
    } catch (error) {
      console.error("Failed to delete template:", error);
      alert(error.response?.data?.message || "Không thể xóa mẫu sản phẩm");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Quản lý Sản phẩm Mẫu ({templates.length})
        </h3>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors font-medium"
        >
          + Tạo Sản phẩm Mẫu
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
                    Ảnh chi tiết
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Người tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Không tìm thấy sản phẩm mẫu
                    </td>
                  </tr>
                ) : (
                  templates.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {template.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {template.image ? (
                          <img
                            src={template.image}
                            alt={template.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                            Không có
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1">
                          {template.images && template.images.length > 0 ? (
                            template.images
                              .slice(0, 5)
                              .map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`${template.name} ${idx + 1}`}
                                  className="w-8 h-8 object-cover rounded"
                                />
                              ))
                          ) : (
                            <span className="text-xs text-gray-500">
                              Không có
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {template.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {categories.find((c) => c.value === template.category)
                          ?.label || template.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {template.price.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {template.description || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        ID #{template.created_by}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal(template)}
                            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(template.id)}
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
                {editingTemplate
                  ? "Chỉnh sửa Sản phẩm Mẫu"
                  : "Tạo Sản phẩm Mẫu"}
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
                {formData.image && (
                  <img
                    src={formData.image}
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
                {formData.images && formData.images.length > 0 && (
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={img}
                          alt={`Detail ${idx + 1}`}
                          className="w-full h-20 object-cover rounded border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => removeDetailImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Đã chọn: {formData.images.length}/5 ảnh
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
                  {editingTemplate ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTemplateManagement;
