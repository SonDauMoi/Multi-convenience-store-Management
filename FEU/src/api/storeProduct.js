import apiClient from "./apiClient";

/**
 * Lấy danh sách cửa hàng có sản phẩm cụ thể
 * @param {number} productTemplateId - ID của product template
 */
export const getStoresWithProductAPI = async (productTemplateId) => {
  const response = await apiClient.get(
    `/store-products/availability/${productTemplateId}`
  );
  return response.data;
};

/**
 * Lấy danh sách sản phẩm của cửa hàng (Manager only)
 */
export const getStoreProductsAPI = async () => {
  const response = await apiClient.get("/store-products");
  return response.data;
};
