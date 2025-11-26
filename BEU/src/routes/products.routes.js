import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/products.controller.js";
import { getAllCategories } from "../controllers/category.controller.js";
import { authenticateToken, checkManager } from "../middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllProducts);
router.get("/categories", getAllCategories); // For compatibility
router.get("/:id", getProductById);

// Manager/Admin routes
router.post("/", authenticateToken, checkManager, createProduct);
router.put("/:id", authenticateToken, checkManager, updateProduct);
router.delete("/:id", authenticateToken, checkManager, deleteProduct);

export default router;
