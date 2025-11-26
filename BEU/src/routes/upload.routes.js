import express from "express";
import multer from "multer";
import { uploadFile } from "../controllers/upload.controller.js";
import { authenticateToken, checkManager } from "../middleware.js";

const router = express.Router();

// Sử dụng memory storage vì ảnh xử lý tiếp (convert base64, gửi CDN...)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Hỗ trợ: multipart (field name 'file'), JSON base64, hoặc URL string
router.post(
  "/",
  authenticateToken,
  checkManager,
  upload.single("file"),
  uploadFile
);

export default router;
