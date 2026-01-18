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
import Toast from "../../components/commom/Toast.jsx";
import ConfirmModal from "../../components/commom/ConfirmModal.jsx";

const BannerManagement = () => {
  const dispatch = useDispatch();
  const [banners, setBanners] = useState([]);
  const [loading, setLoadingState] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  
  // Notification & Confirm state
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });
  const [confirmData, setConfirmData] = useState({ show: false, id: null, title: "" });

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
    { value: "home_main", label: "Homepage - Main" },
    { value: "home_secondary", label: "Homepage - Secondary" },
    { value: "category_top", label: "Category Page - Top" },
  ];

  useEffect(() => {
    loadBanners();
  }, []);

  const showNotify = (message, type = "success") => {
    setNotification({ show: true, message, type });
  };

  const loadBanners = async () => {
    try {
      setLoadingState(true);
      const data = await getAllBannersAdminAPI();
      setBanners(data);
    } catch (error) {
      console.error("Failed to load banners:", error);
      showNotify("Unable to load banner list", "error");
    } finally {
      setLoadingState(false);
    }
  };

  const handleOpenModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        image_url: banner.image_url || "",
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
      dispatch(setLoading(true));
      let finalImageUrl = formData.image_url;

      if (imageFile) {
        try {
          const uploadRes = await fileUploadAPI(imageFile);
          if (uploadRes && uploadRes.imageUrl) {
            finalImageUrl = uploadRes.imageUrl;
          }
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
        }
      }

      const bannerData = {
        ...formData,
        image_url: finalImageUrl || null,
        order_index: parseInt(formData.order_index) || 0
      };

      if (editingBanner) {
        await updateBannerAPI(editingBanner.id, bannerData);
        showNotify("Banner updated successfully!");
      } else {
        await createBannerAPI(bannerData);
        showNotify("Banner created successfully!");
      }

      handleCloseModal();
      loadBanners();
    } catch (error) {
      console.error("Failed to save banner:", error);
      showNotify(error.response?.data?.message || "Unable to save banner", "error");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDeleteClick = (id, title) => {
    setConfirmData({ show: true, id, title });
  };

  const executeDelete = async () => {
    if (!confirmData.id) return;
    try {
      await deleteBannerAPI(confirmData.id);
      showNotify("Banner deleted successfully");
      loadBanners();
    } catch (error) {
      console.error("Failed to delete banner:", error);
      showNotify(error.response?.data?.message || "Unable to delete banner", "error");
    } finally {
      setConfirmData({ show: false, id: null, title: "" });
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
      {notification.show && (
        <Toast message={notification.message} type={notification.type} onClose={() => setNotification({ ...notification, show: false })} />
      )}
      <ConfirmModal 
        show={confirmData.show}
        title="Delete Banner"
        message={`Are you sure you want to delete banner "${confirmData.title}"?`}
        onConfirm={executeDelete}
        onCancel={() => setConfirmData({ show: false, id: null, title: "" })}
      />

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-black uppercase tracking-tight">
          Banner Management ({banners.length})
        </h3>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-bold transition-all shadow-md active:scale-95"
        >
          + Create Banner
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-black">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-white uppercase tracking-widest">ID</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-white uppercase tracking-widest">Image</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-white uppercase tracking-widest">Title</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-white uppercase tracking-widest">Position</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-white uppercase tracking-widest">Order</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-white uppercase tracking-widest">Status</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-white uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {banners.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500 font-medium italic">No banners found</td></tr>
                ) : (
                  banners.map((banner) => (
                    <tr key={banner.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold">{banner.id}</td>
                      <td className="px-6 py-4">
                        {banner.image_url ? (
                          <img src={banner.image_url} alt={banner.title} className="w-20 h-12 object-cover rounded shadow-sm border border-gray-100" />
                        ) : (
                          <div className="w-20 h-12 bg-gray-100 rounded flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase">No Image</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-black">{banner.title}</td>
                      <td className="px-6 py-4 text-xs text-gray-600 font-medium">
                        {positions.find((p) => p.value === banner.position)?.label || banner.position}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{banner.order_index}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-[10px] font-black rounded-full uppercase tracking-tighter ${banner.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                          {banner.is_active ? "Visible" : "Hidden"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleOpenModal(banner)} className="p-1.5 border border-black rounded text-black hover:bg-black hover:text-white transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                          <button onClick={() => handleDeleteClick(banner.id, banner.title)} className="p-1.5 border border-black rounded text-black hover:bg-red-600 hover:border-red-600 hover:text-white transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h14"/></svg></button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-black uppercase tracking-tight">
                {editingBanner ? "Edit Banner" : "Create New Banner"}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-black transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-black mb-1">Title *</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required placeholder="Enter banner title" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all" />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-1 text-black">Image (Optional)</label>
                <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-black file:text-white hover:file:bg-gray-800 cursor-pointer transition-all" />
                {formData.image_url && (
                  <div className="mt-3 relative inline-block">
                    <img src={formData.image_url} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-gray-200 shadow-sm" />
                    <button type="button" onClick={() => { setFormData({ ...formData, image_url: "" }); setImageFile(null); }} className="absolute -top-2 -right-2 bg-black text-white p-1.5 rounded-full shadow-lg hover:bg-gray-800 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-1">Link URL (optional)</label>
                <input type="url" name="link_url" value={formData.link_url} onChange={handleInputChange} placeholder="https://example.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Position *</label>
                  <select name="position" value={formData.position} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all">
                    {positions.map((pos) => (<option key={pos.value} value={pos.value}>{pos.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Display order</label>
                  <input type="number" name="order_index" value={formData.order_index} onChange={handleInputChange} min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all" />
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="w-5 h-5 text-black border-gray-300 rounded focus:ring-black transition-all cursor-pointer" />
                <label htmlFor="is_active" className="text-sm font-black text-black uppercase tracking-tight cursor-pointer">Show banner live</label>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button type="button" onClick={handleCloseModal} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold transition-all">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-bold shadow-md transition-all active:scale-95">
                  {editingBanner ? "Save Changes" : "Create Banner"}
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
