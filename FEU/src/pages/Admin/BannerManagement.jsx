import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setLoading } from "../../store/features/common.jsx";
import {
  getAllBannersAdminAPI,
  createBannerAPI,
  updateBannerAPI,
  deleteBannerAPI,
} from "../../api/admin.js";
import { fileUploadAPI } from "../../api/fileUploadAPI.js";

const BannerManagement = () => {
  const dispatch = useDispatch();
  const [banners, setBanners] = useState([]);
  const [loading, setLoadingState] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
    link_url: "",
    position: "home_main",
    order_index: 0,
    is_active: true,
  });
  const [imageFile, setImageFile] = useState(null);

  const positions = [
    { value: "home_main", label: "Trang chủ - Chính" },
    { value: "home_secondary", label: "Trang chủ - Phụ" },
    { value: "category_top", label: "Đầu trang danh mục" },
  ];

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoadingState(true);
      const data = await getAllBannersAdminAPI();
      setBanners(data);
    } catch (error) {
      console.error("Failed to load banners:", error);
      alert("Không thể tải danh sách banner");
    } finally {
      setLoadingState(false);
    }
  };

  const handleOpenModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        image_url: banner.image_url,
        link_url: banner.link_url || "",
        position: banner.position,
        order_index: banner.order_index,
        is_active: banner.is_active,
      });
    } else {
      setEditingBanner(null);
      setFormData({
        title: "",
        image_url: "",
        link_url: "",
        position: "home_main",
        order_index: 0,
        is_active: true,
      });
      setImageFile(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    setImageFile(null);
    setFormData({
      title: "",
      image_url: "",
      link_url: "",
      position: "home_main",
      order_index: 0,
      is_active: true,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = formData.image_url;

      if (imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", imageFile);
        const uploadRes = await fileUploadAPI(formDataUpload);
        imageUrl = uploadRes.imageUrl;
      }

      const bannerData = {
        ...formData,
        image_url: imageUrl,
      };

      if (editingBanner) {
        await updateBannerAPI(editingBanner.id, bannerData);
        alert("Cập nhật banner thành công");
      } else {
        await createBannerAPI(bannerData);
        alert("Tạo banner thành công");
      }

      handleCloseModal();
      loadBanners();
    } catch (error) {
      console.error("Failed to save banner:", error);
      alert(error.response?.data?.message || "Không thể lưu banner");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa banner này?")) {
      return;
    }

    try {
      await deleteBannerAPI(id);
      alert("Xóa banner thành công");
      loadBanners();
    } catch (error) {
      console.error("Failed to delete banner:", error);
      alert(error.response?.data?.message || "Không thể xóa banner");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Quản lý Banner ({banners.length})
        </h3>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors font-medium"
        >
          + Tạo Banner
        </button>
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
                    Tiêu đề
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Vị trí
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Thứ tự
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {banners.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      Không tìm thấy banner
                    </td>
                  </tr>
                ) : (
                  banners.map((banner) => (
                    <tr key={banner.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {banner.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="w-20 h-12 object-cover rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {banner.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {positions.find((p) => p.value === banner.position)?.label || banner.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {banner.order_index}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            banner.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {banner.is_active ? "Hiển thị" : "Ẩn"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal(banner)}
                            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(banner.id)}
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
                {editingBanner ? "Chỉnh sửa Banner" : "Tạo Banner"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Nhập tiêu đề banner"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hình ảnh *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="mt-2 w-full h-40 object-cover rounded border border-gray-300"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link URL (tùy chọn)
                </label>
                <input
                  type="url"
                  name="link_url"
                  value={formData.link_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vị trí *
                </label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  {positions.map((pos) => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thứ tự hiển thị
                </label>
                <input
                  type="number"
                  name="order_index"
                  value={formData.order_index}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Hiển thị banner
                </label>
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
                  {editingBanner ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerManagement;
