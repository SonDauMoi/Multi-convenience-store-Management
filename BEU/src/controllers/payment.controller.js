import paypal from "@paypal/checkout-server-sdk";
import { Order, OrderDetail, Cart, sequelize } from "../models/index.js";
import { getPaypalClient, getPaypalCurrency } from "../config/paypal.js";
import Stripe from "stripe";

const CheckoutError = class extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
};

// Helper function to refund PayPal payment
export const refundPayPalPayment = async (captureId, amount = null) => {
  try {
    const client = getPaypalClient();
    const request = new paypal.payments.CapturesRefundRequest(captureId);
    request.requestBody({
      ...(amount
        ? { amount: { currency_code: "USD", value: amount.toFixed(2) } }
        : {}),
    });

    console.log(
      "[PayPal Refund] Requesting refund for capture:",
      captureId,
      "Amount:",
      amount || "Full"
    );
    const refund = await client.execute(request);

    console.log("[PayPal Refund] Refund successful:", {
      refundId: refund.result.id,
      status: refund.result.status,
      amount: refund.result.amount,
    });

    return {
      success: true,
      refundId: refund.result.id,
      status: refund.result.status,
      amount: refund.result.amount?.value,
      currency: refund.result.amount?.currency_code,
    };
  } catch (error) {
    console.error("[PayPal Refund] Error:", error);
    return {
      success: false,
      error: error.message,
      details: error.response?.data || error,
    };
  }
};

const parseAmount = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new CheckoutError("totalAmount must be a positive number");
  }
  return parsed;
};

const checkoutCart = async ({
  userId,
  paymentMethod,
  totalAmount,
  storeId,
}) => {
  const amount = parseAmount(totalAmount);
  const t = await sequelize.transaction();
  try {
    const cartItems = await Cart.findAll({
      where: { userId, buyNow: true },
      transaction: t,
    });

    if (!cartItems.length) {
      throw new CheckoutError("No items selected for order");
    }

    const totalQuantity = cartItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const totalPrice = cartItems.reduce((sum, item) => sum + item.total, 0);
    const discount = totalPrice - amount;

    const newOrder = await Order.create(
      {
        studentId: userId,
        storeId: storeId || 1, // Use provided storeId or default to 1
        staffId: null,
        total_quantity: totalQuantity,
        total_price: totalPrice,
        discount,
        final_price: amount,
        payment_method: paymentMethod,
      },
      { transaction: t }
    );

    const details = cartItems.map((item) => ({
      orderId: newOrder.id,
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total_price: item.total,
    }));
    await OrderDetail.bulkCreate(details, { transaction: t });

    await Cart.destroy({ where: { userId, buyNow: true }, transaction: t });

    await t.commit();
    return await Order.findByPk(newOrder.id, {
      include: [{ model: OrderDetail }],
    });
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const addCartToOrder = async (req, res) => {
  try {
    const { user_id, paymentMethod = "cash", totalAmount, storeId } = req.body;
    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    const order = await checkoutCart({
      userId: user_id,
      paymentMethod,
      totalAmount,
      storeId,
    });

    res.status(200).json({ order });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("Error processing order:", error);
    res
      .status(status)
      .json({ message: error.message || "Internal server error" });
  }
};

export const createPaypalOrder = async (req, res) => {
  try {
    const { totalAmount, currency, user_id, returnUrl, cancelUrl } = req.body;
    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    const normalizeBaseUrl = (value) => {
      if (!value || typeof value !== "string") return null;
      return value.endsWith("/") ? value.slice(0, -1) : value;
    };

    const inferredFrontendUrl = (() => {
      const fromEnv = normalizeBaseUrl(process.env.FRONTEND_URL);
      if (fromEnv) return fromEnv;

      const origin = normalizeBaseUrl(req.get("origin"));
      if (origin) return origin;

      const referer = req.get("referer");
      if (referer) {
        try {
          return normalizeBaseUrl(new URL(referer).origin);
        } catch {
          return null;
        }
      }
      return null;
    })();

    const finalReturnUrl =
      returnUrl ||
      (inferredFrontendUrl
        ? `${inferredFrontendUrl}/payment/paypal-success`
        : null);
    const finalCancelUrl =
      cancelUrl ||
      (inferredFrontendUrl ? `${inferredFrontendUrl}/checkout` : null);

    if (!finalReturnUrl || !finalCancelUrl) {
      return res.status(500).json({
        message:
          "Missing PayPal redirect URLs. Set FRONTEND_URL in BEU env or pass returnUrl/cancelUrl.",
      });
    }

    const client = getPaypalClient();
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: `${user_id}`,
          amount: {
            currency_code: (currency || getPaypalCurrency()).toUpperCase(),
            value: parseAmount(totalAmount).toFixed(2),
          },
        },
      ],
      application_context: {
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: finalReturnUrl,
        cancel_url: finalCancelUrl,
      },
    });

    const response = await client.execute(request);
    res.status(200).json({
      id: response.result.id,
      status: response.result.status,
      links: response.result.links,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("Error creating PayPal order:", error);
    res.status(status).json({
      message: error.message || "Unable to create PayPal order",
    });
  }
};

export const capturePaypalOrder = async (req, res) => {
  try {
    const { orderID, user_id, storeId, orderData } = req.body;
    console.log("[PayPal Capture] Request body:", {
      orderID,
      user_id,
      storeId,
      hasOrderData: !!orderData,
    });

    if (!orderID) {
      return res.status(400).json({ message: "orderID is required" });
    }

    const client = getPaypalClient();
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    const capture = await client.execute(request);

    console.log("[PayPal Capture] PayPal status:", capture.result.status);

    if (capture.result.status !== "COMPLETED") {
      return res.status(400).json({
        message: "PayPal order not completed",
        status: capture.result.status,
      });
    }

    const amount =
      capture.result?.purchase_units?.[0]?.payments?.captures?.[0]?.amount;
    if (!amount?.value) {
      return res
        .status(400)
        .json({ message: "Unable to determine captured amount" });
    }

    const userIdFromPayPal = Number(
      capture.result?.purchase_units?.[0]?.reference_id
    );
    const resolvedUserId = Number(user_id) || userIdFromPayPal;
    console.log("[PayPal Capture] Resolved userId:", resolvedUserId);

    if (!resolvedUserId || Number.isNaN(resolvedUserId)) {
      return res.status(400).json({
        message:
          "Unable to determine user_id for this PayPal order. Ensure create-order was called with user_id.",
      });
    }

    // Create order from orderData (not from cart)
    let order;
    if (orderData && orderData.items && orderData.items.length > 0) {
      // Use orderData from frontend (saved before PayPal redirect)
      console.log(
        "[PayPal Capture] Creating order from orderData, items count:",
        orderData.items.length
      );
      const t = await sequelize.transaction();
      try {
        const { items, shipping_fee, shipping_address } = orderData;
        const total_quantity = items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        const total_price = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        const discount = 0;
        const shippingFee = shipping_fee || 0;
        const final_price = total_price - discount + shippingFee;

        const newOrder = await Order.create(
          {
            studentId: resolvedUserId,
            storeId: storeId || orderData.storeId || 1,
            staffId: null,
            total_quantity,
            total_price,
            discount,
            shipping_fee: shippingFee,
            final_price,
            payment_method: "paypal",
            status: "pending",
            order_time: new Date(),
            receiver_name: shipping_address?.name,
            receiver_phone: shipping_address?.phone,
            delivery_address: shipping_address?.address,
            province_id: shipping_address?.provinceId,
            district_id: shipping_address?.districtId,
            ward_id: shipping_address?.wardId,
            // Lưu PayPal transaction IDs để refund sau này
            paypal_order_id: capture.result.id,
            paypal_capture_id:
              capture.result?.purchase_units?.[0]?.payments?.captures?.[0]?.id,
            refund_status: "none",
          },
          { transaction: t }
        );

        console.log("[PayPal Capture] Order created with ID:", newOrder.id);

        const orderDetails = items.map((item) => ({
          orderId: newOrder.id,
          store_product_id: item.storeProductId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total_price: item.price * item.quantity,
        }));

        await OrderDetail.bulkCreate(orderDetails, { transaction: t });
        console.log(
          "[PayPal Capture] OrderDetails created:",
          orderDetails.length
        );

        // Xóa giỏ hàng sau khi tạo đơn thành công - sử dụng đúng tên field
        const deletedCount = await Cart.destroy({
          where: { userId: resolvedUserId },
          transaction: t,
        });
        console.log("[PayPal Capture] Cart items deleted:", deletedCount);

        await t.commit();
        console.log("[PayPal Capture] Transaction committed successfully");

        order = await Order.findByPk(newOrder.id, {
          include: [{ model: OrderDetail, as: "orderDetails" }],
        });

        if (!order) {
          console.error("[PayPal Capture] Failed to fetch created order");
          throw new Error("Failed to retrieve created order");
        }
        console.log("[PayPal Capture] Order fetched with details:", {
          orderId: order.id,
          detailsCount: order.orderDetails?.length,
        });
      } catch (error) {
        await t.rollback();
        console.error("[PayPal Capture] Transaction error:", error);
        throw error;
      }
    } else {
      console.log(
        "[PayPal Capture] No orderData provided, using fallback cart method"
      );
      // Fallback to old cart-based method
      order = await checkoutCart({
        userId: resolvedUserId,
        paymentMethod: "paypal",
        totalAmount: Number(amount.value),
        storeId,
      });
    }

    console.log("[PayPal Capture] Success, returning order:", {
      orderId: order?.id,
      status: capture.result.status,
    });

    res.status(200).json({
      paypalOrderId: capture.result.id,
      paypalStatus: capture.result.status,
      capturedAmount: amount.value,
      capturedCurrency: amount.currency_code,
      order,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("[PayPal Capture] Error:", {
      message: error.message,
      stack: error.stack,
      statusCode: status,
    });
    res.status(status).json({
      message: error.message || "Unable to capture PayPal order",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// -------------------- STRIPE PAYMENT --------------------
const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new CheckoutError("Missing STRIPE_SECRET_KEY in environment", 500);
  }
  return new Stripe(key);
};

export const createStripePaymentIntent = async (req, res) => {
  try {
    const { totalAmount, currency = "USD", user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }
    const amount = parseAmount(totalAmount);
    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata: { user_id: String(user_id) },
      // Chỉ bật thẻ (card) cho dự án này
      payment_method_types: ["card"],
      // Không dùng automatic_payment_methods để tránh hiển thị các phương thức khác
      // automatic_payment_methods: { enabled: true },
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("Error creating Stripe PaymentIntent:", error);
    res.status(status).json({ message: error.message || "Stripe error" });
  }
};
