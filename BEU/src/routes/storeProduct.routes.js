import express from "express";
import {
  getStoreProducts,
  addProductToStore,
  updateStoreProductQuantity,
  removeProductFromStore,
} from "../controllers/storeProduct.controller.js";
import { authenticateToken, checkManager } from "../middleware.js";

const router = express.Router();

// Lấy danh sách sản phẩm của cửa hàng
router.get("/", authenticateToken, checkManager, getStoreProducts);

// Thêm sản phẩm từ template vào cửa hàng
router.post("/", authenticateToken, checkManager, addProductToStore);

// Cập nhật số lượng
router.patch(
  "/:id/quantity",
  authenticateToken,
  checkManager,
  updateStoreProductQuantity
);

// Xóa sản phẩm khỏi cửa hàng
router.delete("/:id", authenticateToken, checkManager, removeProductFromStore);

export default router;
