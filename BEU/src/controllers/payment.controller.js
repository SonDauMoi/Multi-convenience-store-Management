// src/controllers/order.controller.js
import { Order, OrderDetail, Cart, User, sequelize } from "../models/index.js";

export const addCartToOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { user_id, paymentMethod, totalAmount } = req.body;

    // Lấy các items đánh dấu buyNow
    const cartItems = await Cart.findAll({
      where: { userId: user_id, buyNow: true },
      transaction: t,
    });
    if (cartItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "No items selected for order" });
    }

    // Tính tổng
    const totalQuantity = cartItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = cartItems.reduce((sum, i) => sum + i.total, 0);
    const discount = totalPrice - totalAmount;

    // Tạo order
    const newOrder = await Order.create(
      {
        studentId: user_id,
        staffId: null,
        total_quantity: totalQuantity,
        total_price: totalPrice,
        discount,
        final_price: totalAmount,
        payment_method: paymentMethod,
      },
      { transaction: t }
    );

    // Tạo order details
    const details = cartItems.map((item) => ({
      orderId: newOrder.id,
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total_price: item.total,
    }));
    await OrderDetail.bulkCreate(details, { transaction: t });

    // Xóa items khỏi cart
    await Cart.destroy({
      where: { userId: user_id, buyNow: true },
      transaction: t,
    });

    await t.commit();
    const result = await Order.findByPk(newOrder.id, {
      include: [{ model: OrderDetail }],
    });
    res.status(200).json({ order: result });
  } catch (error) {
    await t.rollback();
    console.error("Error processing order:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
