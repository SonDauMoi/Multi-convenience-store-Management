// src/routes/store.routes.js
import express from "express";
import {
  createStore,
  getAllStores,
  getStoreById,
  updateStore,
  deleteStore,
} from "../controllers/store.controller.js";
import { authenticateToken, checkAdmin } from "../middleware.js";

const router = express.Router();

// Public route to get all stores
router.get("/", getAllStores);
router.get("/:id", getStoreById);

// Admin-only routes for managing stores
router.post("/", authenticateToken, checkAdmin, createStore);
router.put("/:id", authenticateToken, checkAdmin, updateStore);
router.delete("/:id", authenticateToken, checkAdmin, deleteStore);

export default router;
