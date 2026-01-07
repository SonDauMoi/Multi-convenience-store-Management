import { Cart, StoreProduct, Store } from "../models/index.js";

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
    const { storeProductId } = req.body;
    const userId = req.user.id;

    const cartItem = await Cart.findOne({ where: { storeProductId, userId } });
    if (!cartItem) {
      return res
        .status(404)
        .json({ message: "Sản phẩm không có trong giỏ hàng" });
    }

    // Kiểm tra tồn kho từ StoreProduct
    const storeProduct = await StoreProduct.findByPk(storeProductId);
    if (!storeProduct || storeProduct.quantity < cartItem.quantity + 1) {
      return res.status(400).json({ message: "Không đủ số lượng trong kho" });
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
    const { storeProductId } = req.body;
    const userId = req.user.id;

    const cartItem = await Cart.findOne({ where: { storeProductId, userId } });
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
    const { storeProductId } = req.body;
    const userId = req.user.id;

    const deletedCount = await Cart.destroy({
      where: { storeProductId, userId },
    });
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
    const { storeProductId, quantity } = req.body;
    const userId = req.user.id;

    if (!storeProductId || !quantity || quantity <= 0) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập storeProductId và quantity > 0" });
    }

    // Lấy thông tin sản phẩm từ StoreProduct (kèm ProductTemplate và Store)
    const storeProduct = await StoreProduct.findByPk(storeProductId, {
      include: [{ association: "productTemplate" }, { association: "store" }],
    });

    if (!storeProduct) {
      return res
        .status(404)
        .json({ message: "Sản phẩm không tồn tại trong cửa hàng" });
    }

    // Kiểm tra tồn kho
    if (storeProduct.quantity < quantity) {
      return res.status(400).json({
        message: `Không đủ số lượng. Kho có ${storeProduct.quantity}, yêu cầu ${quantity}`,
      });
    }

    let cartItem = await Cart.findOne({ where: { storeProductId, userId } });

    if (cartItem) {
      const newQuantity = cartItem.quantity + quantity;
      if (storeProduct.quantity < newQuantity) {
        return res.status(400).json({
          message: `Không đủ số lượng. Kho có ${storeProduct.quantity}, yêu cầu ${newQuantity}`,
        });
      }

      cartItem.quantity = newQuantity;
      cartItem.total = cartItem.price * cartItem.quantity;
      await cartItem.save();

      res.status(200).json({ message: "Cập nhật giỏ hàng", cartItem });
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

      res.status(201).json({ message: "Thêm vào giỏ hàng", cartItem });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
