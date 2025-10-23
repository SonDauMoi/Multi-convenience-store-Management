// src/controllers/auth.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { User } from "../models/index.js";
import nodemailer from "nodemailer";

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_MAIL,
    pass: process.env.MAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

// User Login
export const Login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, storeId: user.storeId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const userResponse = {
      token: token,
      userId: user.id,
      name: user.name,
      role: user.role,
      storeId: user.storeId,
    };

    res.status(200).json(userResponse);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// User Registration
export const register = async (req, res) => {
  try {
    const { username, password, email, name, role, storeId } = req.body;
    if (!username || !password || !email || !name || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (!["user", "manager", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified." });
    }

    const existing = await User.findOne({
      where: { [Op.or]: [{ username }, { email }] },
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      password: hashedPassword,
      email,
      name,
      role,
      storeId: storeId || null,
    });

    const userResponse = { ...newUser.get({ plain: true }) };
    delete userResponse.password;

    res
      .status(201)
      .json({ message: "User registered successfully", user: userResponse });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Forgot Password - Send OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Email not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 3600_000); // 1 hour expiry

    await user.update({ resetOTP: otp, resetOTPExpiry: expiry });

    await transporter.sendMail({
      from: `"Canteen Management" <${process.env.USER_MAIL}>`,
      to: email,
      subject: "Your OTP for Password Reset",
      text: `Your OTP is ${otp}. It will expire in 1 hour.`,
    });

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Reset Password with OTP
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.resetOTP !== otp || user.resetOTPExpiry < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await user.update({
      password: hashed,
      resetOTP: null,
      resetOTPExpiry: null,
    });

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
