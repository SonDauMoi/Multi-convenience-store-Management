import { Op } from "sequelize";
import {
  Cart,
  Order,
  OrderDetail,
  User,
  StoreProduct,
  ProductTemplate,
} from "../models/index.js";
import { sequelize } from "../config/database.js";
import { refundPayPalPayment } from "./payment.controller.js";

// Tạo đơn hàng mới (Người dùng)
export const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { storeId, items, payment_method, shipping_fee, shipping_address } =
      req.body;
    const userId = req.user.userId; // JWT payload has userId not id

    console.log("📦 Create order request:", {
      userId,
      storeId,
      itemsCount: items?.length,
      payment_method,
      shipping_fee,
      shipping_address,
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
    const shippingFee = shipping_fee || 0;
    const final_price = total_price - discount + shippingFee;

    console.log("💰 Order totals:", {
      total_quantity,
      total_price,
      discount,
      shipping_fee: shippingFee,
      final_price,
    });

    // Kiểm tra stock trong StoreProduct
    for (const item of items) {
      const storeProduct = await StoreProduct.findOne({
        where: {
          id: item.storeProductId, // Use StoreProduct ID directly
        },
        include: [{ model: ProductTemplate, as: "productTemplate" }],
        transaction,
      });

      if (!storeProduct || storeProduct.quantity < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          message: `${
            storeProduct?.productTemplate?.name ||
            item.name ||
            item.storeProductId
          }: không đủ số lượng hoặc không có`,
        });
      }
    }

    // Giảm stock trong StoreProduct
    for (const item of items) {
      await StoreProduct.decrement("quantity", {
        by: item.quantity,
        where: { id: item.storeProductId }, // Use StoreProduct ID directly
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
        shipping_fee: shippingFee,
        final_price,
        payment_method,
        status: "pending",
        order_time: new Date(),
        receiver_name: shipping_address?.name,
        receiver_phone: shipping_address?.phone,
        delivery_address: shipping_address?.address,
        province_id: shipping_address?.provinceId,
        district_id: shipping_address?.districtId,
        ward_id: shipping_address?.wardId,
      },
      { transaction }
    );

    const orderDetails = items.map((item) => ({
      orderId: order.id,
      storeProductId: item.storeProductId, // Changed from store_product_id to match model
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
          attributes: [
            "id",
            "name",
            "quantity",
            "price",
            "total_price",
            "storeProductId",
          ],
        },
      ],
      order: [["order_time", "DESC"]],
    });

    // Format dữ liệu cho frontend
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      orderDisplayCode: `ORD${String(order.id).padStart(6, "0")}`,
      orderDate: order.order_time,
      orderStatus: order.status ? order.status.toUpperCase() : "PENDING",
      totalAmount: order.final_price,
      shippingFee: order.shipping_fee || 0,
      paymentMethod: order.payment_method,
      address: {
        name: order.receiver_name,
        phoneNumber: order.receiver_phone,
        street: order.delivery_address,
        provinceId: order.province_id,
        districtId: order.district_id,
        wardId: order.ward_id,
      },
      orderItemList: order.orderDetails.map((item) => ({
        id: item.id,
        product: {
          name: item.name,
          price: item.price,
          productResources: [],
        },
        quantity: item.quantity,
        totalPrice: item.total_price,
      })),
    }));

    res.status(200).json(formattedOrders);
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
      await StoreProduct.increment("quantity", {
        by: item.quantity,
        where: { id: item.storeProductId },
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

// Hủy đơn hàng (User)
export const cancelOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    console.log("🚫 Cancel order request:", { orderId, userId });

    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderDetail, as: "orderDetails" }],
      transaction,
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    // Kiểm tra quyền sở hữu
    if (order.studentId !== userId) {
      await transaction.rollback();
      return res
        .status(403)
        .json({ message: "Không có quyền hủy đơn hàng này" });
    }

    // Chỉ cho phép hủy đơn ở trạng thái pending hoặc processing
    const allowedStatuses = ["pending", "processing"];
    if (!allowedStatuses.includes(order.status)) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Chỉ có thể hủy đơn hàng đang chờ xử lý hoặc đang chuẩn bị",
      });
    }

    // Kiểm tra phương thức thanh toán
    const paymentMethod = order.payment_method?.toLowerCase();
    const isPayPalPayment = paymentMethod === "paypal";

    // Xác định tỷ lệ hoàn tiền dựa trên trạng thái
    const refundPercentage = order.status === "pending" ? 100 : 50;
    const refundAmount = (order.final_price * refundPercentage) / 100;

    console.log(
      "💳 Payment method:",
      paymentMethod,
      "| Status:",
      order.status,
      "| Refund:",
      refundPercentage + "%"
    );

    // Xử lý hoàn tiền PayPal nếu cần
    let refundResult = null;
    if (isPayPalPayment && order.paypal_capture_id) {
      console.log("[Cancel Order] Processing PayPal refund...");

      // Gọi PayPal Refund API
      refundResult = await refundPayPalPayment(
        order.paypal_capture_id,
        refundPercentage === 100 ? null : refundAmount // null = full refund
      );

      if (refundResult.success) {
        order.refund_status = "completed";
        order.refund_amount = parseFloat(refundResult.amount);
        order.refund_time = new Date();
        order.refund_id = refundResult.refundId;
        order.notes = `Đã hoàn ${refundPercentage}% số tiền (${refundAmount.toLocaleString()} VND) - PayPal Refund ID: ${
          refundResult.refundId
        }`;
        console.log("✅ PayPal refund successful:", refundResult.refundId);
      } else {
        order.refund_status = "failed";
        order.notes = `[LỖI HOÀN TIỀN] PayPal refund failed: ${refundResult.error}. Admin cần xử lý thủ công.`;
        console.error("❌ PayPal refund failed:", refundResult.error);
      }
    } else if (isPayPalPayment && !order.paypal_capture_id) {
      // Không có capture ID, yêu cầu admin xử lý thủ công
      order.refund_status = "pending";
      order.notes = `[CẦN HOÀN TIỀN] Đơn hàng đã thanh toán PayPal - Số tiền cần hoàn: ${refundAmount.toLocaleString()} VND (${refundPercentage}%)`;
      console.warn("⚠️ Missing PayPal capture_id, manual refund required");
    }

    // Hoàn trả lại số lượng sản phẩm vào kho
    if (order.orderDetails && order.orderDetails.length > 0) {
      for (const detail of order.orderDetails) {
        if (detail.storeProductId) {
          await StoreProduct.increment("quantity", {
            by: detail.quantity,
            where: { id: detail.storeProductId },
            transaction,
          });
          console.log(
            `✅ Restored ${detail.quantity} items to StoreProduct ID: ${detail.storeProductId}`
          );
        }
      }
    }

    // Cập nhật trạng thái đơn hàng
    order.status = "cancelled";
    order.cancel_time = new Date();
    order.cancel_reason = req.body.reason || "Khách hàng yêu cầu hủy";
    await order.save({ transaction });

    await transaction.commit();
    console.log("✅ Order cancelled successfully:", orderId);

    // Response với thông báo phù hợp
    let responseMessage = "Đơn hàng đã được hủy thành công";

    if (isPayPalPayment) {
      if (refundResult?.success) {
        responseMessage = `Đơn hàng đã được hủy và hoàn ${refundPercentage}% số tiền (${refundAmount.toLocaleString()} VND). Tiền sẽ về tài khoản PayPal trong 5-7 ngày làm việc.`;
      } else if (order.refund_status === "failed") {
        responseMessage = `Đơn hàng đã được hủy nhưng gặp lỗi khi hoàn tiền. Vui lòng liên hệ admin để xử lý.`;
      } else if (order.refund_status === "pending") {
        responseMessage = `Đơn hàng đã được hủy. Admin sẽ xử lý hoàn ${refundPercentage}% số tiền (${refundAmount.toLocaleString()} VND) trong thời gian sớm nhất.`;
      }
    }

    res.status(200).json({
      message: responseMessage,
      order,
      refundInfo: isPayPalPayment
        ? {
            refundPercentage,
            refundAmount,
            refundStatus: order.refund_status,
            refundId: order.refund_id,
            estimatedDays: refundResult?.success ? "5-7 ngày" : null,
          }
        : null,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Cancel order error:", error);
    res.status(500).json({
      message: "Lỗi server: " + error.message,
    });
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
