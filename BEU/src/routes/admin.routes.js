import express from "express";
import {
  createProductTemplate,
  getAllProductTemplates,
  updateProductTemplate,
  deleteProductTemplate,
  addProductToStore,
  getStoreInventory,
  getAllProductsAdmin,
  updateStoreProductQuantity,
  getStoreRevenue,
} from "../controllers/admin.controller.js";
import {
  authenticateToken,
  checkAdmin,
  checkAdminOrManager,
} from "../middleware.js";

const router = express.Router();

// Product Template Management (Admin/Manager)
router.post(
  "/product-templates",
  authenticateToken,
  checkAdminOrManager,
  createProductTemplate
);
router.get(
  "/product-templates",
  authenticateToken,
  checkAdminOrManager,
  getAllProductTemplates
);
router.put(
  "/product-templates/:id",
  authenticateToken,
  checkAdminOrManager,
  updateProductTemplate
);
router.delete(
  "/product-templates/:id",
  authenticateToken,
  checkAdminOrManager,
  deleteProductTemplate
);

// Store Inventory Management (Admin/Manager)
router.post(
  "/add-to-store",
  authenticateToken,
  checkAdminOrManager,
  addProductToStore
);
router.get(
  "/store-inventory",
  authenticateToken,
  checkAdminOrManager,
  getStoreInventory
);
router.put(
  "/update-quantity/:storeProductId",
  authenticateToken,
  checkAdminOrManager,
  updateStoreProductQuantity
);

// Admin only - Revenue & Analytics
router.get("/store-revenue", authenticateToken, checkAdmin, getStoreRevenue);
router.get("/all-products", authenticateToken, checkAdmin, getAllProductsAdmin);

export default router;
