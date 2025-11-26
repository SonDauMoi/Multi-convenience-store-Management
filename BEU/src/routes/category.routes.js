import express from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import { authenticateToken, checkManager } from "../middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

// Manager routes
router.post("/", authenticateToken, checkManager, createCategory);
router.put("/:id", authenticateToken, checkManager, updateCategory);
router.delete("/:id", authenticateToken, checkManager, deleteCategory);

export default router;
