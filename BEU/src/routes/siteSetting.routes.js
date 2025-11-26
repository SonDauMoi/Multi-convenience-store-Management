import express from "express";
import {
  getSettings,
  getAllSettingsAdmin,
  upsertSetting,
  deleteSetting,
} from "../controllers/siteSetting.controller.js";
import { authenticateToken, checkAdmin } from "../middleware.js";

const router = express.Router();

// Public routes
router.get("/", getSettings);

// Admin routes
router.get("/admin/all", authenticateToken, checkAdmin, getAllSettingsAdmin);
router.post("/admin", authenticateToken, checkAdmin, upsertSetting);
router.delete("/admin/:id", authenticateToken, checkAdmin, deleteSetting);

export default router;
