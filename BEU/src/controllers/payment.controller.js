import paypal from "@paypal/checkout-server-sdk";
import { Order, OrderDetail, Cart, sequelize } from "../models/index.js";
import { getPaypalClient, getPaypalCurrency } from "../config/paypal.js";

const CheckoutError = class extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
};

const parseAmount = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new CheckoutError("totalAmount must be a positive number");
  }
  return parsed;
};

const checkoutCart = async ({ userId, paymentMethod, totalAmount }) => {
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
    const { user_id, paymentMethod = "cash", totalAmount } = req.body;
    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    const order = await checkoutCart({
      userId: user_id,
      paymentMethod,
      totalAmount,
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
    const { totalAmount, currency, user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
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
    const { orderID, user_id } = req.body;
    if (!orderID || !user_id) {
      return res
        .status(400)
        .json({ message: "orderID and user_id are required" });
    }

    const client = getPaypalClient();
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    const capture = await client.execute(request);

    if (capture.result.status !== "COMPLETED") {
      return res
        .status(400)
        .json({
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

    const order = await checkoutCart({
      userId: user_id,
      paymentMethod: "paypal",
      totalAmount: Number(amount.value),
    });

    res.status(200).json({
      paypalOrderId: capture.result.id,
      paypalStatus: capture.result.status,
      order,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("Error capturing PayPal order:", error);
    res.status(status).json({
      message: error.message || "Unable to capture PayPal order",
    });
  }
};
