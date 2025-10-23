import express from "express";
import {
  addProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getAllProducts,
  addToCart,
} from "../controllers/inventory.controller.js";

const router = express.Router();

router.post("/add", addProduct);
router.put("/update/:id", updateProduct);
router.delete("/delete/:id", deleteProduct);
router.get("/search/:name", searchProducts);
router.get("/all", getAllProducts);
router.post("/add-cart", addToCart);

export default router;
