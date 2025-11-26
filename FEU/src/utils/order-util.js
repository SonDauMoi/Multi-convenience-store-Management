export const createOrderRequest = (cartItems, userId, addressId) => {
  // Lấy storeId từ sản phẩm đầu tiên (giả sử tất cả sản phẩm cùng store)
  // Fallback to 1 if storeId không tồn tại
  const storeId = cartItems[0]?.storeId || 1;

  const items = cartItems.map((item) => ({
    productId: item.productId,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
  }));

  const request = {
    storeId,
    items,
    payment_method: "COD", // Mặc định: COD, manager sẽ duyệt
  };

  return request;
};

export const getStepCount = {
  PENDING: 1,
  IN_PROGRESS: 2,
  SHIPPED: 3,
  DELIVERED: 4,
};
