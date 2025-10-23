import express from "express";
import {
  getCart,
  addProduct,
  minusProduct,
  removeProduct,
  addToCart,
} from "../controllers/cart.controller.js";
import { authenticateToken, checkUser } from "../middleware.js";

const router = express.Router();

// All cart routes should be protected and only accessible by the 'user' role.
// The user ID will be taken from the token, not the URL parameter for security.
router.use(authenticateToken, checkUser);

router.get("/", getCart); // Gets cart for the logged-in user
router.post("/add", addProduct);
router.post("/minus", minusProduct);
router.post("/remove", removeProduct);
router.post("/addtocart", addToCart); // Mới: Chỉ cần productId và quantity

export default router;
