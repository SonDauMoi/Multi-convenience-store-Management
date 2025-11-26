import express from "express";
import {
  createOrder,
  getUserOrders,
  getManagerOrders,
  getPendingOrders,
  acceptOrder,
  declineOrder,
  completeOrder,
  getOrderDetail,
  createShippingOrder,
} from "../controllers/orders.controller.js";
import { authenticateToken, checkUser, checkManager } from "../middleware.js";

const router = express.Router();

// Manager routes - MUST come before generic /:orderId route
router.get(
  "/manager/pending",
  authenticateToken,
  checkManager,
  getPendingOrders
);
router.get(
  "/manager/assigned",
  authenticateToken,
  checkManager,
  getManagerOrders
);
router.post(
  "/manager/accept/:orderId",
  authenticateToken,
  checkManager,
  acceptOrder
);
router.post(
  "/manager/decline/:orderId",
  authenticateToken,
  checkManager,
  declineOrder
);
router.post(
  "/manager/complete/:orderId",
  authenticateToken,
  checkManager,
  completeOrder
);
router.post(
  "/manager/create-shipping/:orderId",
  authenticateToken,
  checkManager,
  createShippingOrder
);

// User routes - History before generic get
router.get("/history", authenticateToken, checkUser, getUserOrders);

// Generic routes - MUST come last
router.post("/", authenticateToken, checkUser, createOrder);
router.get("/:orderId", authenticateToken, getOrderDetail);

export default router;
