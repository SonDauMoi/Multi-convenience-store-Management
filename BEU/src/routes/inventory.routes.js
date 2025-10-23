import express from "express";
import {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateStock,
  getInventoryStats,
} from "../controllers/inventory.controller.js";
import { authenticateToken, checkManager } from "../middleware.js";

const router = express.Router();

// Specific routes - MUST come before generic /:id route
router.post("/add", authenticateToken, checkManager, addProduct);
router.patch("/:id/stock", authenticateToken, checkManager, updateStock);
router.get("/stats", authenticateToken, checkManager, getInventoryStats);

// Public routes - Get products (anyone can view)
router.get("/", getProducts);

// Generic routes - MUST come last
router.get("/:id", getProductById);
router.put("/:id", authenticateToken, checkManager, updateProduct);
router.delete("/:id", authenticateToken, checkManager, deleteProduct);

export default router;
