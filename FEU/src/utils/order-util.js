export const createOrderRequest = (cartItems) => {
  const storeIds = Array.from(
    new Set((cartItems || []).map((item) => Number(item?.storeId || 1)))
  );

  if (storeIds.length > 1) {
    throw new Error(
      "Your cart contains items from multiple stores. Please use the Checkout page so the system can split orders and calculate shipping fees per store."
    );
  }

  const storeId = storeIds[0] || 1;

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
