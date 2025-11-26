import express from "express";
import {
  getUserInfo,
  getUserProfile,
  editProfile,
  deleteUser,
  getAllUsers,
  getAllManagers,
  createUser,
  uploadAvatar,
} from "../controllers/users.controller.js";
import { authenticateToken, checkAdmin, checkUser } from "../middleware.js";

const router = express.Router();

// Routes for all authenticated users
router.get("/profile", authenticateToken, getUserProfile);
router.post("/avatar", authenticateToken, uploadAvatar);

// Routes for 'admin' role - must be before /:id route
router.get("/managers", authenticateToken, checkAdmin, getAllManagers);
router.get("/", authenticateToken, checkAdmin, getAllUsers);
router.post("/", authenticateToken, checkAdmin, createUser);
router.delete("/:id", authenticateToken, checkAdmin, deleteUser);

// Routes for specific user (must be after /managers)
router.get("/:id", authenticateToken, getUserInfo);
router.put("/:id", authenticateToken, editProfile);

export default router;
