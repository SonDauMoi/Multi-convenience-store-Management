import { Cart, StoreProduct, Store } from "../models/index.js";

// Lấy giỏ hàng của người dùng
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItems = await Cart.findAll({ where: { userId } });
    res.status(200).json(cartItems);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Tăng số lượng sản phẩm trong giỏ hàng
export const addProduct = async (req, res) => {
  try {
    const { storeProductId } = req.body;
    const userId = req.user.id;

    const cartItem = await Cart.findOne({ where: { storeProductId, userId } });
    if (!cartItem) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Kiểm tra tồn kho từ StoreProduct
    const storeProduct = await StoreProduct.findByPk(storeProductId);
    if (!storeProduct || storeProduct.quantity < cartItem.quantity + 1) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    cartItem.quantity += 1;
    cartItem.total = cartItem.price * cartItem.quantity;
    await cartItem.save();

    res.status(200).json(cartItem);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Giảm số lượng sản phẩm trong giỏ hàng
export const minusProduct = async (req, res) => {
  try {
    const { storeProductId } = req.body;
    const userId = req.user.id;

    const cartItem = await Cart.findOne({ where: { storeProductId, userId } });
    if (!cartItem) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    cartItem.quantity -= 1;
    if (cartItem.quantity <= 0) {
      await cartItem.destroy();
      return res.status(200).json({ message: "Removed product from cart" });
    }

    cartItem.total = cartItem.price * cartItem.quantity;
    await cartItem.save();
    res.status(200).json(cartItem);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Xóa sản phẩm khỏi giỏ hàng
export const removeProduct = async (req, res) => {
  try {
    const { storeProductId } = req.body;
    const userId = req.user.id;

    const deletedCount = await Cart.destroy({
      where: { storeProductId, userId },
    });
    if (deletedCount === 0) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    res.status(200).json({ message: "Removed product from cart" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Thêm sản phẩm vào giỏ hàng (tự động lấy info từ database)
export const addToCart = async (req, res) => {
  try {
    const { storeProductId, quantity } = req.body;
    const userId = req.user.id;

    if (!storeProductId || !quantity || quantity <= 0) {
      return res
        .status(400)
        .json({ message: "Please provide storeProductId and quantity > 0" });
    }

    // Lấy thông tin sản phẩm từ StoreProduct (kèm ProductTemplate và Store)
    const storeProduct = await StoreProduct.findByPk(storeProductId, {
      include: [{ association: "productTemplate" }, { association: "store" }],
    });

    if (!storeProduct) {
      return res.status(404).json({ message: "Product not found in store" });
    }

    // Kiểm tra tồn kho
    if (storeProduct.quantity < quantity) {
      return res.status(400).json({
        message: `Insufficient stock. Available ${storeProduct.quantity}, requested ${quantity}`,
      });
    }

    let cartItem = await Cart.findOne({ where: { storeProductId, userId } });

    if (cartItem) {
      const newQuantity = cartItem.quantity + quantity;
      if (storeProduct.quantity < newQuantity) {
        return res.status(400).json({
          message: `Insufficient stock. Available ${storeProduct.quantity}, requested ${newQuantity}`,
        });
      }

      cartItem.quantity = newQuantity;
      cartItem.total = cartItem.price * cartItem.quantity;
      await cartItem.save();

      res.status(200).json({ message: "Cart updated", cartItem });
    } else {
      cartItem = await Cart.create({
        userId,
        storeProductId,
        storeId: storeProduct.storeId,
        storeName: storeProduct.store?.name || "N/A",
        name: storeProduct.productTemplate?.name || "N/A",
        image: storeProduct.productTemplate?.image || null,
        price: storeProduct.productTemplate?.price || 0,
        quantity,
        total: (storeProduct.productTemplate?.price || 0) * quantity,
      });

      res.status(201).json({ message: "Added to cart", cartItem });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
