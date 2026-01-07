import apiClient from "./apiClient";

/**
 * Lấy tất cả stores
 */
export const getStoresAPI = async () => {
  const response = await apiClient.get("/store");
  return response.data;
};

/**
 * Lấy thông tin store theo ID
 */
export const getStoreByIdAPI = async (storeId) => {
  const response = await apiClient.get(`/store/${storeId}`);
  return response.data;
};

/**
 * Tạo store mới (Admin only)
 */
export const createStoreAPI = async (storeData) => {
  const response = await apiClient.post("/store", storeData);
  return response.data;
};

/**
 * Cập nhật store (Admin only)
 */
export const updateStoreAPI = async (storeId, storeData) => {
  const response = await apiClient.put(`/store/${storeId}`, storeData);
  return response.data;
};

/**
 * Xóa store (Admin only)
 */
export const deleteStoreAPI = async (storeId) => {
  const response = await apiClient.delete(`/store/${storeId}`);
  return response.data;
};
