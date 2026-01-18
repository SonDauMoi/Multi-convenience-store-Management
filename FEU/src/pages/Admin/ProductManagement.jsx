import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../api/constant";
import { getAccessToken, getUserInfo } from "../../utils/jwt-helper";
import { fetchCategories } from "../../api/fetchCategories.js";
import { fileUploadAPI } from "../../api/fileUploadAPI.js";
import Toast from "../../components/commom/Toast.jsx";
import ConfirmModal from "../../components/commom/ConfirmModal.jsx";
import Pagination from "../../components/commom/Pagination.jsx";

const ProductManagement = () => {
  const userInfo = getUserInfo();
  const isManager = userInfo?.role === "manager";
  
  const [products, setProducts] = useState([]);
  const [templates, setTemplates] = useState([]); 
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [formData, setFormData] = useState({
    templateId: "",
    name: "",
    description: "",
    price: "",
    categoryId: "",
    image: "", 
    quantity: 0,
  });

  const [mainImageFile, setMainImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    loadData();
    loadCategories();
    if (isManager) loadTemplates();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, categoryFilter]);

  const showNotify = (message, type = "success") => {
    setNotification({ show: true, message, type });
  };

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setDbCategories(data || []);
    } catch (error) { console.error(error); }
  };

  const loadTemplates = async () => {
    try {
      const token = getAccessToken();
      const res = await axios.get(`${API_BASE_URL}/admin/product-templates`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setTemplates(res.data || []);
    } catch (error) { console.error(error); }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      const url = isManager ? `${API_BASE_URL}/store-products` : `${API_BASE_URL}/admin/product-templates`;
      const res = await axios.get(url, { headers });
      
      const data = isManager ? (res.data.products || []) : (res.data || []);
      setProducts(data);
    } catch (error) {
      showNotify("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setSelectedProduct(item);
      if (isManager) {
        // item is StoreProduct
        setFormData({
          templateId: item.productTemplateId,
          name: item.name || "",
          description: item.description || "",
          price: (item.price || 0).toString(),
          categoryId: item.categoryId || "",
          image: item.image || "",
          quantity: item.quantity || 0
        });
        setImagePreview(item.image);
      } else {
        // item is ProductTemplate
        setFormData({
          templateId: "",
          name: item.name || "",
          description: item.description || "",
          price: (item.price || 0).toString(),
          categoryId: item.categoryId || "",
          image: item.image || "",
          quantity: 0
        });
        setImagePreview(item.image);
      }
    } else {
      setSelectedProduct(null);
      setFormData({ templateId: "", name: "", description: "", price: "", categoryId: dbCategories[0]?.id || "", image: "", quantity: 0 });
      setImagePreview(null);
    }
    setMainImageFile(null);
    setShowModal(true);
  };

  const handleTemplateSelect = (e) => {
    const tid = e.target.value;
    const template = templates.find(t => t.id === parseInt(tid));
    if (template) {
      setFormData({
        ...formData,
        templateId: tid,
        name: template.name,
        description: template.description,
        price: template.price,
        categoryId: template.categoryId,
        image: template.image
      });
      setImagePreview(template.image);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      if (isManager) {
        if (selectedProduct) {
          // Update Quantity: PATCH /store-products/:id/quantity
          await axios.patch(`${API_BASE_URL}/store-products/${selectedProduct.id}/quantity`, 
            { quantity: parseInt(formData.quantity) }, { headers });
        } else {
          // Add Template to Store: POST /store-products
          await axios.post(`${API_BASE_URL}/store-products`, {
            productTemplateId: parseInt(formData.templateId),
            quantity: parseInt(formData.quantity)
          }, { headers });
        }
        showNotify("Inventory updated!");
      } else {
        let finalImage = formData.image;
        if (mainImageFile) {
          const res = await fileUploadAPI(mainImageFile);
          finalImage = res.imageUrl;
        }
        const payload = { ...formData, image: finalImage, price: parseFloat(formData.price), categoryId: parseInt(formData.categoryId) };
        if (selectedProduct) {
          await axios.put(`${API_BASE_URL}/admin/product-templates/${selectedProduct.id}`, payload, { headers });
        } else {
          await axios.post(`${API_BASE_URL}/admin/product-templates`, payload, { headers });
        }
        showNotify("Template saved!");
      }
      
      setShowModal(false);
      loadData();
    } catch (error) {
      showNotify(error.response?.data?.message || "Operation failed", "error");
    }
  };

  const executeDelete = async () => {
    try {
      const token = getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };
      const url = isManager ? `${API_BASE_URL}/store-products/${productToDelete.id}` : `${API_BASE_URL}/admin/product-templates/${productToDelete.id}`;
      await axios.delete(url, { headers });
      showNotify("Removed successfully");
      loadData();
    } catch (error) { showNotify("Delete failed", "error"); }
    finally { setShowDeleteConfirm(false); setProductToDelete(null); }
  };

  const filteredProducts = products.filter((p) => {
    const name = isManager ? p.name : p.name;
    const catId = isManager ? p.categoryId : p.categoryId;
    const matchSearch = !searchTerm || name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = !categoryFilter || catId === parseInt(categoryFilter);
    return matchSearch && matchCategory;
  });

  const currentItems = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="relative">
      {notification.show && <Toast message={notification.message} type={notification.type} onClose={() => setNotification({ ...notification, show: false })} />}
      <ConfirmModal show={showDeleteConfirm} title="Confirm" message="Are you sure?" onConfirm={executeDelete} onCancel={() => setShowDeleteConfirm(false)} />

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">{isManager ? "Store Inventory" : "Product Templates"} ({filteredProducts.length})</h3>
        <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-black text-white rounded-lg font-medium shadow-sm active:scale-95 text-xs">+ {isManager ? "Stock Product" : "New Template"}</button>
      </div>

      <div className="flex gap-4 mb-6">
        <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none" />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg outline-none">
          <option value="">All categories</option>
          {dbCategories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-black">
              <tr>
                <th className="px-6 py-3 text-left text-[10px] font-medium text-white uppercase tracking-widest">ID</th>
                <th className="px-6 py-3 text-left text-[10px] font-medium text-white uppercase tracking-widest">Image</th>
                <th className="px-6 py-3 text-left text-[10px] font-medium text-white uppercase tracking-widest">Name</th>
                <th className="px-6 py-3 text-left text-[10px] font-medium text-white uppercase tracking-widest">Price</th>
                {isManager && <th className="px-6 py-3 text-left text-[10px] font-medium text-white uppercase tracking-widest">Stock</th>}
                <th className="px-6 py-3 text-left text-[10px] font-medium text-white uppercase tracking-widest">Category</th>
                <th className="px-6 py-3 text-left text-[10px] font-medium text-white uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-medium text-gray-500">{item.id}</td>
                  <td className="px-6 py-4"><img src={item.image} className="w-10 h-10 object-cover rounded border" /></td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.name}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.price?.toLocaleString()}đ</td>
                  {isManager && <td className="px-6 py-4 text-sm font-black text-blue-600">{item.quantity}</td>}
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-medium uppercase">{dbCategories.find(c => c.id === item.categoryId)?.name || "Other"}</span></td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => handleOpenModal(item)} className="p-1.5 border border-black rounded text-black hover:bg-black hover:text-white transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                    <button onClick={() => {setProductToDelete(item); setShowDeleteConfirm(true);}} className="p-1.5 border border-black rounded text-black hover:bg-red-600 hover:border-red-600 hover:text-white transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h14"/></svg></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination totalItems={filteredProducts.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-xl font-medium text-black uppercase tracking-tight">{isManager ? (selectedProduct ? "Update Stock" : "Stock New Product") : "Product Template"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {isManager && !selectedProduct && (
                <div className="bg-gray-50 p-4 rounded-lg border border-black/5">
                  <label className="block text-xs font-bold mb-2 uppercase text-gray-400">Step 1: Select Template from Admin</label>
                  <select required value={formData.templateId} onChange={handleTemplateSelect} className="w-full px-4 py-2 border-2 border-black rounded-lg outline-none font-medium">
                    <option value="">-- Choose a product template --</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({dbCategories.find(c => c.id === t.categoryId)?.name})</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium mb-1">Product Name</label><input type="text" readOnly={isManager} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg bg-gray-50 outline-none" /></div>
                <div><label className="block text-sm font-medium mb-1">Stock Quantity *</label><input type="number" required min="0" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} className="w-full px-4 py-2 border-2 border-black rounded-lg outline-none font-bold" /></div>
              </div>

              {!isManager && (
                <>
                  <div><label className="block text-sm font-medium mb-1">Price (VNĐ)</label><input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium mb-1">Category</label><select value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    {dbCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select></div>
                </>
              )}

              {imagePreview && <div className="pt-4 border-t flex justify-center"><img src={imagePreview} className="h-40 w-40 object-cover rounded-xl border-2 border-gray-100 shadow-sm" /></div>}

              <div className="pt-6 border-t flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-black text-white rounded-lg font-bold shadow-md active:scale-95">{selectedProduct ? "Update Stock" : "Add to Stock"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
