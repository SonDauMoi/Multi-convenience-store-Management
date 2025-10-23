import { Product } from "../models/index.js";

// For all users to view products
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
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
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error getting product", error: error.message });
  }
};

// For managers/admins to manage products
export const createProduct = async (req, res) => {
  try {
    const { name, price, quantity, image, description, category } = req.body;
    const storeId =
      req.user.role === "manager" ? req.user.storeId : req.body.storeId; // Managers use their own storeId, admins can specify

    const newProduct = await Product.create({
      name,
      price,
      quantity,
      image,
      description,
      category,
      storeId,
    });
    res
      .status(201)
      .json({ message: "Product created successfully", product: newProduct });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating product", error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, quantity, image, description, category } = req.body;
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Managers can only update products in their store
    if (req.user.role === "manager" && product.storeId !== req.user.storeId) {
      return res
        .status(403)
        .json({ message: "Access denied. Product not in your store." });
    }

    await product.update({
      name,
      price,
      quantity,
      image,
      description,
      category,
    });
    res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating product", error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Managers can only delete products in their store
    if (req.user.role === "manager" && product.storeId !== req.user.storeId) {
      return res
        .status(403)
        .json({ message: "Access denied. Product not in your store." });
    }

    await product.destroy();
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting product", error: error.message });
  }
};
