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
// Mô tả luồng chính:
// 1) Kiểm tra dữ liệu đầu vào (storeId, items, payment_method)
// 2) Tính tổng số lượng / giá tiền
// 3) Kiểm tra tồn kho (StoreProduct) cho từng item — nếu thiếu -> rollback
// 4) Giảm stock (atomic via transaction) trước khi tạo Order/OrderDetail
// 5) Tạo bản ghi Order và OrderDetail, xóa Cart của user
// Lưu ý quan trọng:
// - Việc giảm stock trước khi tạo Order đảm bảo tránh oversell trong môi trường đồng thời.
// - Transaction bao phủ các thao tác thay đổi stock và tạo order để đảm bảo rollback an toàn khi có lỗi.
export const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { storeId, items, payment_method, shipping_fee, shipping_address } =
      req.body;
    const userId = req.user.userId; // JWT payload has userId not id

    const storeIdNumber = Number(storeId);

    console.log("📦 Create order request:", {
      userId,
      storeId,
      itemsCount: items?.length,
      payment_method,
      shipping_fee,
      shipping_address,
    });
    console.log("📦 Items:", items);

    if (!storeIdNumber || !items?.length || !payment_method) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Required: storeId, items[], payment_method",
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

      const itemStoreId = Number(
        storeProduct?.store_id ?? storeProduct?.storeId
      );
      if (storeProduct && itemStoreId && itemStoreId !== storeIdNumber) {
        await transaction.rollback();
        return res.status(400).json({
          message:
            "You can't place items from multiple stores in a single order. Please check your cart.",
        });
      }

      if (!storeProduct || storeProduct.quantity < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          message: `${
            storeProduct?.productTemplate?.name ||
            item.name ||
            item.storeProductId
          }: not available or insufficient quantity`,
        });
      }
    }

    // Giảm stock trong StoreProduct
    // NOTE: decrement trước khi ghi Order để giữ nhất quán tồn kho trong cạnh tranh cao.
    for (const item of items) {
      await StoreProduct.decrement("quantity", {
        by: item.quantity,
        where: { id: item.storeProductId }, // Use StoreProduct ID directly
        transaction,
      });
    }

    // Tạo đơn hàng
    // Order lưu trạng thái ban đầu là 'pending'. Việc thanh toán/confirm có thể cập nhật sau.
    const order = await Order.create(
      {
        userId,
        storeId: storeIdNumber,
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
    res.status(201).json({ message: "Order placed successfully", order });
  } catch (error) {
    console.error("❌ Create order error:", error);
    console.error("❌ Error stack:", error.stack);
    await transaction.rollback();
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

// Lấy đơn hàng của người dùng
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId; // JWT payload has userId not id
    console.log("📦 getUserOrders called for userId:", userId);

    const orders = await Order.findAll({
      where: { userId },
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

    console.log("📦 Found orders:", orders.length);

    // Format dữ liệu cho frontend
    const formattedOrders = orders.map((order) => {
      console.log(
        "📦 Order:",
        order.id,
        "has orderDetails:",
        order.orderDetails?.length
      );

      return {
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
        orderItemList: (order.orderDetails || []).map((item) => ({
          id: item.id,
          product: {
            name: item.name,
            price: item.price,
            productResources: [],
          },
          quantity: item.quantity,
          totalPrice: item.total_price,
        })),
      };
    });

    console.log("✅ Returning formatted orders:", formattedOrders.length);
    res.status(200).json(formattedOrders);
  } catch (error) {
    console.error("getUserOrders error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Lấy đơn hàng của quản lý
export const getManagerOrders = async (req, res) => {
  try {
    const managerId = req.user.userId; // JWT payload has userId not id
    const orders = await Order.findAll({
      where: { managerId, storeId: req.user.storeId },
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
    res.status(500).json({ message: "Server error", error: error.message });
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
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.status(200).json(order);
  } catch (error) {
    console.error("getOrderDetail error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
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
    console.error("getPendingOrders error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Quản lý chấp nhận đơn hàng
export const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const managerId = req.user.userId;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Order is not in pending status" });
    }
    if (order.storeId !== req.user.storeId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    order.managerId = managerId;
    order.status = "processing";
    await order.save();

    res.status(200).json({ message: "Order accepted", order });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
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
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.status !== "pending") {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: "Only pending orders can be declined" });
    }
    if (order.storeId !== req.user.storeId) {
      await transaction.rollback();
      return res.status(403).json({ message: "Forbidden" });
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
      .json({ message: "Order declined; stock has been restored", order });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: "Server error" });
  }
};

// Quản lý hoàn thành đơn hàng
export const completeOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByPk(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.status !== "shipping") {
      return res
        .status(400)
        .json({ message: "Order must be in shipping status" });
    }
    if (order.storeId !== req.user.storeId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    order.status = "delivered";
    await order.save();

    console.log("✅ Order completed:", orderId);
    res.status(200).json({ message: "Order completed", order });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Hủy đơn hàng (User)
// Luồng hủy:
// - Chỉ chủ sở hữu order có thể hủy.
// - Chỉ cho phép hủy khi status nằm trong `pending` hoặc `processing`.
// - Tự động hoàn kho (restore quantity) cho các OrderDetail.
// - Nếu thanh toán bằng PayPal sẽ cố gắng gọi API refund; nếu thiếu capture_id hoặc refund thất bại
//   sẽ ghi chú vào order và yêu cầu admin can thiệp.
// - Refund policy: full refund nếu order đang 'pending', 50% nếu đang 'processing'.
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
      return res.status(404).json({ message: "Order not found" });
    }

    // Kiểm tra quyền sở hữu
    if (order.userId !== userId) {
      await transaction.rollback();
      return res
        .status(403)
        .json({ message: "You are not allowed to cancel this order" });
    }

    // Chỉ cho phép hủy đơn ở trạng thái pending hoặc processing
    const allowedStatuses = ["pending", "processing"];
    if (!allowedStatuses.includes(order.status)) {
      await transaction.rollback();
      return res.status(400).json({
        message: "You can only cancel orders that are pending or processing",
      });
    }

    // Kiểm tra phương thức thanh toán
    // Nếu PayPal: cố gắng refund tự động thông qua `refundPayPalPayment`.
    // - Nếu refund thành công: ghi `refund_status = completed` và lưu refund_id
    // - Nếu không có capture_id: đánh dấu `pending` để admin xử lý thủ công
    // - Nếu refund thất bại: ghi `failed` và giữ order ở trạng thái cancelled nhưng yêu cầu admin xử lý
    const paymentMethod = order.payment_method?.toLowerCase();
    const isPayPalPayment = paymentMethod === "paypal";

    // Xác định tỷ lệ hoàn tiền dựa trên trạng thái
    // - pending => 100% refund
    // - processing => 50% refund (giả định phí/chi phí đã phát sinh)
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
        order.notes = `Refunded ${refundPercentage}% (${refundAmount.toLocaleString()} VND) - PayPal Refund ID: ${
          refundResult.refundId
        }`;
        console.log("✅ PayPal refund successful:", refundResult.refundId);
      } else {
        order.refund_status = "failed";
        order.notes = `[REFUND ERROR] PayPal refund failed: ${refundResult.error}. Admin action required.`;
        console.error("❌ PayPal refund failed:", refundResult.error);
      }
    } else if (isPayPalPayment && !order.paypal_capture_id) {
      // Không có capture ID, yêu cầu admin xử lý thủ công
      order.refund_status = "pending";
      order.notes = `[REFUND REQUIRED] PayPal paid order - Amount to refund: ${refundAmount.toLocaleString()} VND (${refundPercentage}%)`;
      console.warn("⚠️ Missing PayPal capture_id, manual refund required");
    }

    // Hoàn trả lại số lượng sản phẩm vào kho
    // Thao tác này dùng transaction để đảm bảo giá trị kho được phục hồi đồng bộ nếu rollback.
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
    order.cancel_reason = req.body.reason || "Customer requested cancellation";
    await order.save({ transaction });

    await transaction.commit();
    console.log("✅ Order cancelled successfully:", orderId);

    // Response với thông báo phù hợp
    let responseMessage = "Order cancelled successfully";

    if (isPayPalPayment) {
      if (refundResult?.success) {
        responseMessage = `Order cancelled and refunded ${refundPercentage}% (${refundAmount.toLocaleString()} VND). Funds will return to your PayPal account within 5-7 business days.`;
      } else if (order.refund_status === "failed") {
        responseMessage =
          "Order cancelled, but there was an error processing the refund. Please contact an admin.";
      } else if (order.refund_status === "pending") {
        responseMessage = `Order cancelled. An admin will process a ${refundPercentage}% refund (${refundAmount.toLocaleString()} VND) as soon as possible.`;
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
            estimatedDays: refundResult?.success ? "5-7 days" : null,
          }
        : null,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Cancel order error:", error);
    res.status(500).json({
      message: "Server error: " + error.message,
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
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "processing") {
      return res.status(400).json({
        message: "Only orders in processing status can be shipped",
      });
    }

    if (order.storeId !== req.user.storeId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Cập nhật trạng thái và thông tin shipper
    order.status = "shipping";
    order.shipper_name = shipperName || null;
    order.shipper_phone = shipperPhone || null;
    await order.save();

    console.log("📦 Order started shipping:", orderId);

    res.status(200).json({
      message: "Order moved to shipping",
      order,
    });
  } catch (error) {
    console.error("❌ Start shipping error:", error);
    res.status(500).json({
      message: "Server error: " + error.message,
    });
  }
};
