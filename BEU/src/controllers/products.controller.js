import { ProductTemplate, StoreProduct, Store } from "../models/index.js";
import { Op } from "sequelize";

// For all users to view products (from ProductTemplate)
export const getAllProducts = async (req, res) => {
  try {
    const { category, name, slug, id, page = 0, size = 12 } = req.query;
    const offset = parseInt(page) * parseInt(size);

    const where = {};
    if (category) where.category = category;
    if (name) where.name = { [Op.like]: `%${name}%` };

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
