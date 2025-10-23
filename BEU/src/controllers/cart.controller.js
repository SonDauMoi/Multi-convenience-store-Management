import { Cart, Product } from "../models/index.js";

// Lấy giỏ hàng của người dùng
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItems = await Cart.findAll({ where: { userId } });
    res.status(200).json(cartItems);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Tăng số lượng sản phẩm trong giỏ hàng
export const addProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    const cartItem = await Cart.findOne({ where: { productId, userId } });
    if (!cartItem) {
      return res
        .status(404)
        .json({ message: "Sản phẩm không có trong giỏ hàng" });
    }

    cartItem.quantity += 1;
    cartItem.total = cartItem.price * cartItem.quantity;
    await cartItem.save();

    res.status(200).json(cartItem);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Giảm số lượng sản phẩm trong giỏ hàng
export const minusProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    const cartItem = await Cart.findOne({ where: { productId, userId } });
    if (!cartItem) {
      return res
        .status(404)
        .json({ message: "Sản phẩm không có trong giỏ hàng" });
    }

    cartItem.quantity -= 1;
    if (cartItem.quantity <= 0) {
      await cartItem.destroy();
      return res.status(200).json({ message: "Xóa sản phẩm khỏi giỏ hàng" });
    }

    cartItem.total = cartItem.price * cartItem.quantity;
    await cartItem.save();
    res.status(200).json(cartItem);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Xóa sản phẩm khỏi giỏ hàng
export const removeProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    const deletedCount = await Cart.destroy({ where: { productId, userId } });
    if (deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "Sản phẩm không có trong giỏ hàng" });
    }

    res.status(200).json({ message: "Xóa sản phẩm khỏi giỏ hàng" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Thêm sản phẩm vào giỏ hàng (tự động lấy info từ database)
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    if (!productId || !quantity || quantity <= 0) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập productId và quantity > 0" });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({
        message: `Không đủ số lượng. Kho có ${product.quantity}, yêu cầu ${quantity}`,
      });
    }

    let cartItem = await Cart.findOne({ where: { productId, userId } });

    if (cartItem) {
      const newQuantity = cartItem.quantity + quantity;
      if (product.quantity < newQuantity) {
        return res.status(400).json({
          message: `Không đủ số lượng. Kho có ${product.quantity}, yêu cầu ${newQuantity}`,
        });
      }

      cartItem.quantity = newQuantity;
      cartItem.total = cartItem.price * cartItem.quantity;
      await cartItem.save();

      res.status(200).json({ message: "Cập nhật giỏ hàng", cartItem });
    } else {
      cartItem = await Cart.create({
        userId,
        productId,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity,
        total: product.price * quantity,
      });

      res.status(201).json({ message: "Thêm vào giỏ hàng", cartItem });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
