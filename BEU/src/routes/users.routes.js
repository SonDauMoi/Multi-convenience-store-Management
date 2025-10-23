import express from "express";
import {
  getUserInfo,
  editProfile,
  deleteUser,
  getAllUsers,
  getAllManagers,
  createUser,
} from "../controllers/users.controller.js";
import { authenticateToken, checkAdmin, checkUser } from "../middleware.js";

const router = express.Router();

// Routes for all authenticated users
router.get("/:id", authenticateToken, getUserInfo);
router.put("/:id", authenticateToken, editProfile);

// Routes for 'admin' role
router.get("/", authenticateToken, checkAdmin, getAllUsers);
router.get("/managers", authenticateToken, checkAdmin, getAllManagers);
router.post("/", authenticateToken, checkAdmin, createUser);
router.delete("/:id", authenticateToken, checkAdmin, deleteUser);

export default router;
