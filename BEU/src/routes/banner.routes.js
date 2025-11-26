import express from "express";
import {
  getBanners,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
} from "../controllers/banner.controller.js";
import { authenticateToken, checkAdmin } from "../middleware.js";

const router = express.Router();

// Public routes
router.get("/", getBanners);

// Admin routes
router.get("/admin/all", authenticateToken, checkAdmin, getAllBannersAdmin);
router.post("/admin", authenticateToken, checkAdmin, createBanner);
router.put("/admin/:id", authenticateToken, checkAdmin, updateBanner);
router.delete("/admin/:id", authenticateToken, checkAdmin, deleteBanner);

export default router;
