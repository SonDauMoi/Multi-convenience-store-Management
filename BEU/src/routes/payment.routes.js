import express from "express";
import {
  addCartToOrder,
  createPaypalOrder,
  capturePaypalOrder,
  createStripePaymentIntent,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/", addCartToOrder);
router.post("/paypal/create-order", createPaypalOrder);
router.post("/paypal/capture-order", capturePaypalOrder);
router.post("/stripe/create-intent", createStripePaymentIntent);

export default router;
