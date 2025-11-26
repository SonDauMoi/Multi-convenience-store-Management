import express from "express";
import {
  Login,
  register,
  verifyEmail,
  resendVerificationOTP,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
} from "../controllers/login.controller.js";

const router = express.Router();

// Route cho login
router.post("/login", Login);
router.post("/register", register);
router.post("/verify", verifyEmail);
router.post("/resend-verification", resendVerificationOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

export default router;
