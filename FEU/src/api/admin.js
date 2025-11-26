import apiClient from "./apiClient";

// Banner APIs
export const getBannersAPI = async (position) => {
  const params = position ? { position } : {};
  const res = await apiClient.get("/banners", { params });
  return res.data;
};

export const getAllBannersAdminAPI = async () => {
  const res = await apiClient.get("/banners/admin/all");
  return res.data;
};

export const createBannerAPI = async (bannerData) => {
  const res = await apiClient.post("/banners/admin", bannerData);
  return res.data;
};

export const updateBannerAPI = async (id, bannerData) => {
  const res = await apiClient.put(`/banners/admin/${id}`, bannerData);
  return res.data;
};

export const deleteBannerAPI = async (id) => {
  const res = await apiClient.delete(`/banners/admin/${id}`);
  return res.data;
};

// Site Settings APIs
export const getSettingsAPI = async (type) => {
  const params = type ? { type } : {};
  const res = await apiClient.get("/site-settings", { params });
  return res.data;
};

export const getAllSettingsAdminAPI = async () => {
  const res = await apiClient.get("/site-settings/admin/all");
  return res.data;
};

export const upsertSettingAPI = async (settingData) => {
  const res = await apiClient.post("/site-settings/admin", settingData);
  return res.data;
};

export const deleteSettingAPI = async (id) => {
  const res = await apiClient.delete(`/site-settings/admin/${id}`);
  return res.data;
};

// Product Template Management APIs
export const createProductTemplateAPI = async (data) => {
  const res = await apiClient.post("/admin/product-templates", data);
  return res.data;
};

export const getAllProductTemplatesAPI = async (params) => {
  const res = await apiClient.get("/admin/product-templates", { params });
  return res.data;
};

export const updateProductTemplateAPI = async (id, data) => {
  const res = await apiClient.put(`/admin/product-templates/${id}`, data);
  return res.data;
};

export const deleteProductTemplateAPI = async (id) => {
  const res = await apiClient.delete(`/admin/product-templates/${id}`);
  return res.data;
};

// Store Inventory Management APIs
export const addProductToStoreAPI = async (data) => {
  const res = await apiClient.post("/admin/add-to-store", data);
  return res.data;
};

export const getStoreInventoryAPI = async (storeId) => {
  const res = await apiClient.get("/admin/store-inventory", {
    params: { storeId },
  });
  return res.data;
};

export const updateStoreProductQuantityAPI = async (
  storeProductId,
  quantity
) => {
  const res = await apiClient.put(`/admin/update-quantity/${storeProductId}`, {
    quantity,
  });
  return res.data;
};

// Admin Analytics APIs
export const getStoreRevenueAPI = async (params) => {
  const res = await apiClient.get("/admin/store-revenue", { params });
  return res.data;
};

export const getAllProductsAdminAPI = async (params) => {
  const res = await apiClient.get("/admin/all-products", { params });
  return res.data;
};
