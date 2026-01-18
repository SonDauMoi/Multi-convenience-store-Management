// src/controllers/inventory.controller.js
// Inventory controller — Summary:
// - Handles per-store product entries (`StoreProduct`) used by managers and admins.
// - Permission model:
//   * `admin` may target any `storeId` via query/body
//   * `manager` is limited to `user.storeId`
// - Important invariants:
//   * Prevent deleting a product if it's present in any carts (see `deleteProduct`).
//   * Stock updates and deletions check cart/order relationships to avoid data inconsistency.
import { Op } from "sequelize";
import {
  StoreProduct,
  ProductTemplate,
  Cart,
  User,
  Store,
} from "../models/index.js";

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
        message: "You are not allowed to add products",
      });
    }

    // Validate dữ liệu
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: "Product name and price are required",
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than 0",
      });
    }

    // Kiểm tra store tồn tại
    const store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    // Tạo sản phẩm mới
    const newProduct = await StoreProduct.create({
      name,
      quantity: quantity || 0,
      price,
      description,
      preparation_time,
      image,
      store_id: storeId,
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: newProduct,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
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
      whereCondition.store_id = storeId;
    }
    if (search) {
      whereCondition.name = { [Op.iLike]: `%${search}%` };
    }

    const products = await StoreProduct.findAll({
      where: whereCondition,
      order: [["id", "DESC"]],
      raw: true,
    });

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching product list:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
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

    const product = await StoreProduct.findByPk(id, {
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
        message: "Product not found",
      });
    }

    // Kiểm tra quyền truy cập - if user exists, must be authorized for the store
    if (user && user.role !== "admin" && product.store_id !== user.storeId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this product",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
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
    const product = await StoreProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Kiểm tra quyền
    if (user.role !== "admin" && product.store_id !== user.storeId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this product",
      });
    }

    // Validate dữ liệu
    if (price !== undefined && price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than 0",
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
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
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
    const product = await StoreProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Kiểm tra quyền
    if (user.role !== "admin" && product.store_id !== user.storeId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this product",
      });
    }

    // Kiểm tra xem sản phẩm có trong giỏ hàng nào không
    const cartItems = await Cart.findAll({
      where: { storeProductId: id },
    });

    if (cartItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a product that is currently in carts",
      });
    }

    // Xóa sản phẩm
    await product.destroy();

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
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
        message: "Quantity cannot be negative",
      });
    }

    // Tìm sản phẩm
    const product = await StoreProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Kiểm tra quyền
    if (user.role !== "admin" && product.store_id !== user.storeId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update stock for this product",
      });
    }

    // Cập nhật số lượng
    await product.update({ quantity });

    res.json({
      success: true,
      message: "Stock updated successfully",
      data: { id: product.id, quantity: product.quantity },
    });
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
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
        message: "You are not allowed to view stats",
      });
    }

    // Thống kê tổng quan
    const totalProducts = await StoreProduct.count({
      where: { store_id: storeId },
    });

    const lowStockProducts = await StoreProduct.count({
      where: {
        store_id: storeId,
        quantity: { [Op.lt]: 10 }, // Sản phẩm sắp hết hàng (< 10)
      },
    });

    const outOfStockProducts = await StoreProduct.count({
      where: {
        store_id: storeId,
        quantity: 0,
      },
    });

    // Tổng giá trị inventory
    const inventoryValue = await StoreProduct.sum("price", {
      where: { store_id: storeId },
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
    console.error("Error fetching inventory stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
