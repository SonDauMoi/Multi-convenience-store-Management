import { Op } from "sequelize";
import { Cart, Order, OrderDetail, User, Product } from "../models/index.js";
import { sequelize } from "../config/database.js";
import { createGHNOrder } from "../services/ghn.service.js";

// Tạo đơn hàng mới (Người dùng)
export const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { storeId, items, payment_method } = req.body;
    const userId = req.user.userId; // JWT payload has userId not id

    console.log("📦 Create order request:", {
      userId,
      storeId,
      itemsCount: items?.length,
      payment_method,
    });
    console.log("📦 Items:", items);

    if (!storeId || !items?.length || !payment_method) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Cung cấp: storeId, items[], payment_method",
      });
    }

    const total_quantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const total_price = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const discount = 0; // Có thể thêm logic tính discount sau
    const final_price = total_price - discount;

    console.log("💰 Order totals:", {
      total_quantity,
      total_price,
      discount,
      final_price,
    });

    // Kiểm tra stock
    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction });
      if (
        !product ||
        product.quantity < item.quantity ||
        product.storeId !== storeId
      ) {
        await transaction.rollback();
        return res.status(400).json({
          message: `${
            product?.name || item.productId
          }: không đủ số lượng hoặc không có`,
        });
      }
    }

    // Giảm stock
    for (const item of items) {
      await Product.decrement("quantity", {
        by: item.quantity,
        where: { id: item.productId, storeId },
        transaction,
      });
    }

    // Tạo đơn hàng
    const order = await Order.create(
      {
        studentId: userId,
        storeId,
        total_quantity,
        total_price,
        discount,
        final_price,
        payment_method,
        status: "pending",
        order_time: new Date(),
      },
      { transaction }
    );

    const orderDetails = items.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total_price: item.price * item.quantity,
    }));

    await OrderDetail.bulkCreate(orderDetails, { transaction });
    await Cart.destroy({ where: { userId }, transaction });

    await transaction.commit();
    console.log("✅ Order created successfully:", order.id);
    res.status(201).json({ message: "Đặt hàng thành công", order });
  } catch (error) {
    console.error("❌ Create order error:", error);
    console.error("❌ Error stack:", error.stack);
    await transaction.rollback();
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};

// Lấy đơn hàng của người dùng
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId; // JWT payload has userId not id
    const orders = await Order.findAll({
      where: { studentId: userId },
      include: [
        {
          model: OrderDetail,
          as: "orderDetails",
          attributes: ["name", "quantity"],
        },
      ],
      order: [["order_time", "DESC"]],
    });
    res.status(200).json(orders);
  } catch (error) {
    console.error("getUserOrders error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Lấy đơn hàng của quản lý
export const getManagerOrders = async (req, res) => {
  try {
    const managerId = req.user.userId; // JWT payload has userId not id
    const orders = await Order.findAll({
      where: { staffId: managerId, storeId: req.user.storeId },
      include: [
        {
          model: OrderDetail,
          as: "orderDetails",
          attributes: ["name", "quantity"],
        },
      ],
      order: [["order_time", "DESC"]],
    });
    res.status(200).json(orders);
  } catch (error) {
    console.error("getManagerOrders error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Lấy chi tiết đơn hàng
export const getOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByPk(orderId, {
      include: [
        { model: User, as: "user", attributes: ["name", "email"] },
        { model: User, as: "manager", attributes: ["name", "email"] },
        { model: OrderDetail, as: "orderDetails" },
      ],
    });
    if (!order)
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy danh sách đơn hàng đang chờ xử lý
export const getPendingOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { status: "pending", storeId: req.user.storeId },
      include: [
        { model: User, as: "user", attributes: ["name"] },
        { model: OrderDetail, as: "orderDetails" },
      ],
      order: [["order_time", "ASC"]],
    });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Quản lý chấp nhận đơn hàng
export const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const managerId = req.user.id;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }
    if (order.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Đơn hàng không ở trạng thái pending" });
    }
    if (order.storeId !== req.user.storeId) {
      return res.status(403).json({ message: "Không có quyền" });
    }

    order.staffId = managerId;
    order.status = "processing";
    await order.save();

    res.status(200).json({ message: "Chấp nhận đơn hàng", order });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Quản lý từ chối đơn hàng
export const declineOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { orderId } = req.params;
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderDetail, as: "orderDetails" }],
      transaction,
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }
    if (order.status !== "pending") {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: "Chỉ có thể từ chối đơn pending" });
    }
    if (order.storeId !== req.user.storeId) {
      await transaction.rollback();
      return res.status(403).json({ message: "Không có quyền" });
    }

    // Hoàn lại stock
    for (const item of order.orderDetails) {
      await Product.increment("quantity", {
        by: item.quantity,
        where: { id: item.productId, storeId: order.storeId },
        transaction,
      });
    }

    order.status = "declined";
    await order.save({ transaction });

    await transaction.commit();
    res
      .status(200)
      .json({ message: "Từ chối đơn hàng, stock đã được hoàn lại", order });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Quản lý hoàn thành đơn hàng
export const completeOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByPk(orderId);

    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }
    if (order.status !== "shipping") {
      return res
        .status(400)
        .json({ message: "Đơn hàng phải ở trạng thái shipping" });
    }
    if (order.storeId !== req.user.storeId) {
      return res.status(403).json({ message: "Không có quyền" });
    }

    order.status = "delivered";
    await order.save();

    console.log("✅ Order completed:", orderId);
    res.status(200).json({ message: "Hoàn thành đơn hàng", order });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Chuyển đơn sang trạng thái đang giao hàng (không cần GHN API)
export const startShipping = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { shipperName, shipperPhone } = req.body;

    const order = await Order.findByPk(orderId);

    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    if (order.status !== "processing") {
      return res.status(400).json({
        message: "Chỉ có thể giao đơn đang xử lý",
      });
    }

    if (order.storeId !== req.user.storeId) {
      return res.status(403).json({ message: "Không có quyền" });
    }

    // Cập nhật trạng thái và thông tin shipper
    order.status = "shipping";
    order.shipper_name = shipperName || null;
    order.shipper_phone = shipperPhone || null;
    await order.save();

    console.log("📦 Order started shipping:", orderId);

    res.status(200).json({
      message: "Đơn hàng đã chuyển sang đang giao",
      order,
    });
  } catch (error) {
    console.error("❌ Start shipping error:", error);
    res.status(500).json({
      message: "Lỗi server: " + error.message,
    });
  }
};

// Tạo đơn vận chuyển (Manager)
export const createShippingOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      toName,
      toPhone,
      toAddress,
      toWardCode,
      toDistrictId,
      weight,
      codAmount,
    } = req.body;

    console.log("📦 Creating shipping order for:", orderId);

    // Kiểm tra đơn hàng
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderDetail,
          as: "orderDetails",
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    if (order.status !== "processing") {
      return res.status(400).json({
        message: "Chỉ có thể tạo vận đơn cho đơn hàng đang xử lý",
      });
    }

    if (order.storeId !== req.user.storeId) {
      return res.status(403).json({ message: "Không có quyền" });
    }

    // Tạo đơn vận chuyển qua GHN
    const ghnResult = await createGHNOrder({
      toName,
      toPhone,
      toAddress,
      toWardCode,
      toDistrictId,
      codAmount:
        codAmount || (order.payment_method === "COD" ? order.final_price : 0),
      weight: weight || 200,
      items: order.orderDetails.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    });

    if (!ghnResult.success) {
      return res.status(400).json({
        message: "Không thể tạo đơn vận chuyển: " + ghnResult.message,
      });
    }

    // Cập nhật order với thông tin vận chuyển
    order.shipping_partner = "GHN";
    order.shipping_code = ghnResult.orderCode;
    order.shipping_fee = ghnResult.totalFee;
    order.status = "shipping"; // Chuyển sang trạng thái đang giao
    await order.save();

    console.log("✅ Shipping order created:", ghnResult.orderCode);

    res.status(200).json({
      message: "Tạo đơn vận chuyển thành công",
      order,
      shipping: {
        code: ghnResult.orderCode,
        fee: ghnResult.totalFee,
        expectedDelivery: ghnResult.expectedDeliveryTime,
      },
    });
  } catch (error) {
    console.error("❌ Create shipping error:", error);
    res.status(500).json({
      message: "Lỗi tạo đơn vận chuyển: " + error.message,
    });
  }
};
