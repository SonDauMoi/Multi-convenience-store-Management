import apiClient from "./apiClient";

// Lấy danh sách đơn hàng chờ duyệt (Manager)
export const getPendingOrdersAPI = () =>
  apiClient.get("/orders/manager/pending").then((res) => res.data);

// Lấy danh sách đơn hàng đã nhận (Manager)
export const getManagerOrdersAPI = () =>
  apiClient.get("/orders/manager/assigned").then((res) => res.data);

// Duyệt đơn hàng
export const acceptOrderAPI = (orderId) =>
  apiClient.post(`/orders/manager/accept/${orderId}`).then((res) => res.data);

// Từ chối đơn hàng
export const declineOrderAPI = (orderId) =>
  apiClient.post(`/orders/manager/decline/${orderId}`).then((res) => res.data);

// Tạo đơn vận chuyển GHN
export const createShippingAPI = (orderId, shippingData) =>
  apiClient
    .post(`/orders/manager/create-shipping/${orderId}`, shippingData)
    .then((res) => res.data);

// Hoàn thành đơn hàng
export const completeOrderAPI = (orderId) =>
  apiClient.post(`/orders/manager/complete/${orderId}`).then((res) => res.data);

// Lấy chi tiết đơn hàng
export const getOrderDetailAPI = (orderId) =>
  apiClient.get(`/orders/${orderId}`).then((res) => res.data);
