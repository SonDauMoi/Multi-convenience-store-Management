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
    console.log("🔐 Login attempt:", {
      username,
      passwordLength: password?.length,
    });

    if (!username || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      console.log("❌ User not found:", username);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("👤 User found:", {
      id: user.id,
      username: user.username,
      provider: user.provider,
      isVerified: user.isVerified,
      hasPassword: !!user.password,
    });

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔑 Password match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if email is verified (only for local users)
    if (user.provider === "local" && !user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
        needsVerification: true,
        email: user.email,
      });
    }

    // Tạo access token (1h)
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        storeId: user.storeId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Tạo refresh token (7 ngày)
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      token,
      refreshToken,
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      storeId: user.storeId,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// User Registration
export const register = async (req, res) => {
  try {
    const { username, password, email, name, phone, role, storeId } = req.body;

    // Validate required fields (role defaults to 'user' for public registration)
    if (!username || !password || !email || !name) {
      return res
        .status(400)
        .json({ message: "Username, email, password, and name are required." });
    }

    // Role validation - default to 'user' for public registration
    const userRole = role || "user";
    if (!["user", "manager", "admin"].includes(userRole)) {
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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 3600_000); // 1 hour expiry

    const newUser = await User.create({
      username,
      password: hashedPassword,
      email,
      name,
      phone: phone || null,
      role: userRole,
      storeId: storeId || null,
      provider: "local", // Explicitly set provider for local registration
      verificationOTP: otp,
      verificationOTPExpiry: otpExpiry,
      isVerified: false,
    });

    // Send verification email
    try {
      await transporter.sendMail({
        from: `"Convenience Store" <${process.env.USER_MAIL}>`,
        to: email,
        subject: "Xác thực tài khoản của bạn",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Xin chào ${name}!</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại Convenience Store.</p>
            <p>Mã xác thực OTP của bạn là:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #666;">Mã này sẽ hết hạn sau 1 giờ.</p>
            <p style="color: #666;">Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        `,
        text: `Xin chào ${name}! Mã OTP xác thực của bạn là: ${otp}. Mã này sẽ hết hạn sau 1 giờ.`,
      });
      console.log(`✅ Verification email sent to ${email}`);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Không throw error, vẫn cho phép user đăng ký thành công
    }

    const userResponse = { ...newUser.get({ plain: true }) };
    delete userResponse.password;
    delete userResponse.verificationOTP;

    res.status(201).json({
      message: "User created successfully. Please verify your email.",
      user: userResponse,
    });
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

// Refresh Token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    // Xác thực refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Tạo access token mới với payload thống nhất
    const newToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        storeId: user.storeId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Tạo refresh token mới
    const newRefreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Refresh token expired" });
    }
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

// Verify Email with OTP
export const verifyEmail = async (req, res) => {
  try {
    const { userName, code } = req.body; // userName can be username or email

    if (!userName || !code) {
      return res
        .status(400)
        .json({ message: "Username/email and verification code are required" });
    }

    // Find user by username or email
    const user = await User.findOne({
      where: {
        [Op.or]: [{ username: userName }, { email: userName }],
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    if (!user.verificationOTP || user.verificationOTP !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    if (user.verificationOTPExpiry < new Date()) {
      return res.status(400).json({ message: "Verification code expired" });
    }

    // Update user as verified
    await user.update({
      isVerified: true,
      verificationOTP: null,
      verificationOTPExpiry: null,
    });

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Resend Verification OTP
export const resendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 3600_000); // 1 hour

    await user.update({
      verificationOTP: otp,
      verificationOTPExpiry: otpExpiry,
    });

    // Send email
    await transporter.sendMail({
      from: `"Convenience Store" <${process.env.USER_MAIL}>`,
      to: email,
      subject: "Mã xác thực mới",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Xin chào ${user.name}!</h2>
          <p>Bạn đã yêu cầu gửi lại mã xác thực.</p>
          <p>Mã OTP mới của bạn là:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666;">Mã này sẽ hết hạn sau 1 giờ.</p>
        </div>
      `,
      text: `Mã OTP mới của bạn là: ${otp}`,
    });

    res.status(200).json({ message: "Verification code resent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    // Hiện tại chỉ clear token ở client, backend không lưu blacklist
    // Nếu cần blacklist token, thêm logic vào đây
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
