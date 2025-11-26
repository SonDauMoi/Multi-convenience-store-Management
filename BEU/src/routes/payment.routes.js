import express from "express";
import {
  addCartToOrder,
  createPaypalOrder,
  capturePaypalOrder,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/", addCartToOrder);
router.post("/paypal/create-order", createPaypalOrder);
router.post("/paypal/capture-order", capturePaypalOrder);

export default router;
