import { ProductTemplate, StoreProduct, Store } from "../models/index.js";
import { Op } from "sequelize";
import { sequelize } from "../config/database.js";

// Products controller — Notes:
// - This controller operates on `ProductTemplate` which is the shared product catalog
//   (canonical product definitions used across stores).
// - Per-store inventory (quantity, in_stock) is stored in `StoreProduct` and
//   exposed via store-specific endpoints (`storeProduct.controller.js`).
// - Some endpoints here are deprecated in favor of admin routes that manage
//   product templates centrally. Keep this separation in mind when tracing bugs.

// For all users to view products (from ProductTemplate)
export const getAllProducts = async (req, res) => {
  try {
    const {
      category,
      categoryId,
      name,
      slug,
      id,
      page = 0,
      size = 12,
    } = req.query;
    const offset = parseInt(page) * parseInt(size);

    const where = {};
    // Skip category filter if it's "all", "other", or undefined
    if (category && category !== "all" && category !== "other") {
      where.category = category;
    }
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (name) {
      // Use ILIKE for case-insensitive search in PostgreSQL
      where.name = sequelize.where(
        sequelize.fn("LOWER", sequelize.col("name")),
        Op.like,
        `%${name.toLowerCase()}%`
      );
    }

    // If id is provided, search by exact ID (for single product queries)
    if (id) {
      where.id = parseInt(id);
    }

    // If slug is provided, search by name (using slug as product identifier)
    // Slug format is usually the product name with dashes instead of spaces
    if (slug && !id) {
      // Convert slug back to name pattern (e.g., "coca-cola" -> "coca cola")
      const nameFromSlug = slug.replace(/-/g, " ");
      where.name = { [Op.like]: `%${nameFromSlug}%` };
    }

    const { count, rows } = await ProductTemplate.findAndCountAll({
      where,
      limit: parseInt(size),
      offset: offset,
      order: [["id", "DESC"]],
    });

    // Map image to thumbnail for frontend compatibility
    const products = rows.map((product) => {
      const productData = product.toJSON();
      return {
        ...productData,
        thumbnail: productData.image, // Add thumbnail alias for frontend
      };
    });

    res.set(
      "Content-Range",
      `products ${offset}-${offset + rows.length}/${count}`
    );
    res.status(200).json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error getting products", error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await ProductTemplate.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Add thumbnail alias for frontend compatibility
    const productData = product.toJSON();
    res.status(200).json({
      ...productData,
      thumbnail: productData.image,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error getting product", error: error.message });
  }
};

// DEPRECATED - Use admin.createProductTemplate instead
export const createProduct = async (req, res) => {
  return res.status(400).json({
    message: "Please use /admin/product-templates to create products",
    deprecated: true,
  });
};

// DEPRECATED - Use admin.updateProductTemplate instead
export const updateProduct = async (req, res) => {
  return res.status(400).json({
    message: "Please use /admin/product-templates/:id to update products",
    deprecated: true,
  });
};

// DEPRECATED - Use admin.deleteProductTemplate instead
export const deleteProduct = async (req, res) => {
  return res.status(400).json({
    message: "Please use /admin/product-templates/:id to delete products",
    deprecated: true,
  });
};
