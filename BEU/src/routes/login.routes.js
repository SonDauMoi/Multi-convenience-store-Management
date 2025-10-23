import express from "express";
import {
  Login,
  register,
  forgotPassword,
  resetPassword,
} from "../controllers/login.controller.js";

const router = express.Router();

// Route cho login
router.post("/login", Login);
router.post("/register", register);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
