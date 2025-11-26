import { ProductTemplate, StoreProduct, Store } from "../models/index.js";

/**
 * Lấy danh sách sản phẩm của cửa hàng (Manager)
 * Trả về ProductTemplate kèm số lượng từ StoreProduct
 */
export const getStoreProducts = async (req, res) => {
  try {
    const user = req.user;
    let storeId;

    if (user.role === "admin" && req.query.storeId) {
      storeId = parseInt(req.query.storeId);
    } else {
      storeId = user.storeId;
    }

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Không xác định được cửa hàng",
      });
    }

    const storeProducts = await StoreProduct.findAll({
      where: { store_id: storeId },
      include: [
        {
          model: ProductTemplate,
          as: "productTemplate",
          attributes: [
            "id",
            "name",
            "description",
            "price",
            "category",
            "image",
            "images",
          ],
        },
      ],
    });

    const products = storeProducts.map((sp) => ({
      id: sp.id,
      productTemplateId: sp.product_template_id,
      storeId: sp.store_id,
      quantity: sp.quantity,
      sold: sp.sold,
      inStock: sp.in_stock,
      name: sp.productTemplate?.name,
      description: sp.productTemplate?.description,
      price: sp.productTemplate?.price,
      category: sp.productTemplate?.category,
      image: sp.productTemplate?.image,
      images: sp.productTemplate?.images,
    }));

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Error getting store products:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

/**
 * Thêm sản phẩm từ template vào cửa hàng (Manager)
 * Body: { productTemplateId, quantity }
 */
export const addProductToStore = async (req, res) => {
  try {
    const { productTemplateId, quantity } = req.body;
    const user = req.user;
    const storeId = user.storeId;

    if (!productTemplateId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin sản phẩm hoặc số lượng",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số lượng phải lớn hơn 0",
      });
    }

    // Kiểm tra template có tồn tại
    const template = await ProductTemplate.findByPk(productTemplateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm mẫu không tồn tại",
      });
    }

    // Kiểm tra xem sản phẩm đã có trong store chưa
    const existingProduct = await StoreProduct.findOne({
      where: {
        product_template_id: productTemplateId,
        store_id: storeId,
      },
    });

    if (existingProduct) {
      // Cập nhật số lượng
      existingProduct.quantity += parseInt(quantity);
      existingProduct.in_stock = true;
      await existingProduct.save();

      return res.json({
        success: true,
        message: "Đã cập nhật số lượng sản phẩm",
        data: existingProduct,
      });
    }

    // Tạo mới
    const newStoreProduct = await StoreProduct.create({
      product_template_id: productTemplateId,
      store_id: storeId,
      quantity: parseInt(quantity),
      sold: 0,
      in_stock: true,
    });

    res.status(201).json({
      success: true,
      message: "Thêm sản phẩm vào cửa hàng thành công",
      data: newStoreProduct,
    });
  } catch (error) {
    console.error("Error adding product to store:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

/**
 * Cập nhật số lượng sản phẩm trong cửa hàng (Manager)
 */
export const updateStoreProductQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const user = req.user;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Số lượng không hợp lệ",
      });
    }

    const storeProduct = await StoreProduct.findByPk(id);
    if (!storeProduct) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    // Kiểm tra quyền (manager chỉ được sửa sản phẩm của store mình)
    if (user.role === "manager" && storeProduct.store_id !== user.storeId) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền chỉnh sửa sản phẩm này",
      });
    }

    storeProduct.quantity = parseInt(quantity);
    storeProduct.in_stock = quantity > 0;
    await storeProduct.save();

    res.json({
      success: true,
      message: "Cập nhật số lượng thành công",
      data: storeProduct,
    });
  } catch (error) {
    console.error("Error updating quantity:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

/**
 * Xóa sản phẩm khỏi cửa hàng (Manager)
 */
export const removeProductFromStore = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const storeProduct = await StoreProduct.findByPk(id);
    if (!storeProduct) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    // Kiểm tra quyền
    if (user.role === "manager" && storeProduct.store_id !== user.storeId) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền xóa sản phẩm này",
      });
    }

    await storeProduct.destroy();

    res.json({
      success: true,
      message: "Xóa sản phẩm khỏi cửa hàng thành công",
    });
  } catch (error) {
    console.error("Error removing product:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};
