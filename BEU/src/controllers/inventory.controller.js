// src/controllers/inventory.controller.js
import { Op } from "sequelize";
import { Product, Cart, User, Store } from "../models/index.js";

/**
 * Thêm sản phẩm mới (Manager/Admin)
 * - Manager: Chỉ thêm vào store của mình
 * - Admin: Có thể chỉ định storeId
 */
export const addProduct = async (req, res) => {
  try {
    const {
      name,
      quantity,
      price,
      description,
      preparation_time,
      image,
      storeId: requestedStoreId,
    } = req.body;

    const user = req.user;

    // Xác định storeId
    let storeId;
    if (user.role === "admin") {
      storeId = requestedStoreId || user.storeId;
    } else if (user.role === "manager") {
      storeId = user.storeId;
    } else {
      return res.status(403).json({
        success: false,
        message: "Không có quyền thêm sản phẩm",
      });
    }

    // Validate dữ liệu
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: "Tên sản phẩm và giá là bắt buộc",
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Giá sản phẩm phải lớn hơn 0",
      });
    }

    // Kiểm tra store tồn tại
    const store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Cửa hàng không tồn tại",
      });
    }

    // Tạo sản phẩm mới
    const newProduct = await Product.create({
      name,
      quantity: quantity || 0,
      price,
      description,
      preparation_time,
      image,
      storeId,
    });

    res.status(201).json({
      success: true,
      message: "Thêm sản phẩm thành công",
      data: newProduct,
    });
  } catch (error) {
    console.error("Lỗi thêm sản phẩm:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

/**
 * Lấy danh sách sản phẩm (theo store)
 * - Customer: Xem sản phẩm của store hiện tại
 * - Manager: Xem sản phẩm của store mình quản lý
 * - Admin: Xem tất cả hoặc theo storeId
 */
export const getProducts = async (req, res) => {
  try {
    const { storeId: queryStoreId, search } = req.query;
    const user = req.user; // May be undefined if not authenticated

    // Xác định storeId để lọc
    let storeId;
    if (user) {
      if (user.role === "admin") {
        storeId = queryStoreId || null; // Admin có thể xem tất cả
      } else if (user.role === "manager") {
        storeId = user.storeId; // Manager chỉ xem store của mình
      } else if (user.role === "customer") {
        storeId = user.storeId; // Customer xem store hiện tại
      }
    } else {
      // No user - public access, return all products or filtered by query
      storeId = queryStoreId || null;
    }

    // Build điều kiện tìm kiếm
    const whereCondition = {};
    if (storeId) {
      whereCondition.storeId = storeId;
    }
    if (search) {
      whereCondition.name = { [Op.iLike]: `%${search}%` };
    }

    const products = await Product.findAll({
      where: whereCondition,
      order: [["id", "DESC"]],
      raw: true,
    });

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách sản phẩm:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

/**
 * Lấy chi tiết sản phẩm theo ID
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const product = await Product.findByPk(id, {
      include: [
        {
          model: Store,
          as: "store",
          attributes: ["id", "name", "address"],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại",
      });
    }

    // Kiểm tra quyền truy cập - if user exists, must be authorized for the store
    if (user && user.role !== "admin" && product.storeId !== user.storeId) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền xem sản phẩm này",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết sản phẩm:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

/**
 * Cập nhật sản phẩm (Manager/Admin)
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, quantity, price, description, preparation_time, image } =
      req.body;
    const user = req.user;

    // Tìm sản phẩm
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại",
      });
    }

    // Kiểm tra quyền
    if (user.role !== "admin" && product.storeId !== user.storeId) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền cập nhật sản phẩm này",
      });
    }

    // Validate dữ liệu
    if (price !== undefined && price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Giá sản phẩm phải lớn hơn 0",
      });
    }

    // Cập nhật
    await product.update({
      name,
      quantity,
      price,
      description,
      preparation_time,
      image,
    });

    res.json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      data: product,
    });
  } catch (error) {
    console.error("Lỗi cập nhật sản phẩm:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

/**
 * Xóa sản phẩm (Manager/Admin)
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Tìm sản phẩm
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại",
      });
    }

    // Kiểm tra quyền
    if (user.role !== "admin" && product.storeId !== user.storeId) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền xóa sản phẩm này",
      });
    }

    // Kiểm tra xem sản phẩm có trong giỏ hàng nào không
    const cartItems = await Cart.findAll({
      where: { productId: id },
    });

    if (cartItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa sản phẩm đang có trong giỏ hàng",
      });
    }

    // Xóa sản phẩm
    await product.destroy();

    res.json({
      success: true,
      message: "Xóa sản phẩm thành công",
    });
  } catch (error) {
    console.error("Lỗi xóa sản phẩm:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

/**
 * Cập nhật số lượng tồn kho (Manager/Admin)
 */
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const user = req.user;

    // Validate
    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Số lượng không được âm",
      });
    }

    // Tìm sản phẩm
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại",
      });
    }

    // Kiểm tra quyền
    if (user.role !== "admin" && product.storeId !== user.storeId) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền cập nhật tồn kho sản phẩm này",
      });
    }

    // Cập nhật số lượng
    await product.update({ quantity });

    res.json({
      success: true,
      message: "Cập nhật tồn kho thành công",
      data: { id: product.id, quantity: product.quantity },
    });
  } catch (error) {
    console.error("Lỗi cập nhật tồn kho:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

/**
 * Lấy thống kê inventory theo store (Manager/Admin)
 */
export const getInventoryStats = async (req, res) => {
  try {
    const { storeId: queryStoreId } = req.query;
    const user = req.user;

    // Xác định storeId
    let storeId;
    if (user.role === "admin") {
      storeId = queryStoreId || user.storeId;
    } else if (user.role === "manager") {
      storeId = user.storeId;
    } else {
      return res.status(403).json({
        success: false,
        message: "Không có quyền xem thống kê",
      });
    }

    // Thống kê tổng quan
    const totalProducts = await Product.count({
      where: { storeId },
    });

    const lowStockProducts = await Product.count({
      where: {
        storeId,
        quantity: { [Op.lt]: 10 }, // Sản phẩm sắp hết hàng (< 10)
      },
    });

    const outOfStockProducts = await Product.count({
      where: {
        storeId,
        quantity: 0,
      },
    });

    // Tổng giá trị inventory
    const inventoryValue = await Product.sum("price", {
      where: { storeId },
    });

    res.json({
      success: true,
      data: {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        inventoryValue: inventoryValue || 0,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy thống kê inventory:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};
