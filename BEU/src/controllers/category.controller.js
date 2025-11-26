import { Category } from "../models/index.js";

// Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 10;
    const offset = page * size;

    const { count, rows } = await Category.findAndCountAll({
      limit: size,
      offset: offset,
      order: [["id", "ASC"]],
    });

    res.set(
      "Content-Range",
      `categories ${offset}-${offset + rows.length}/${count}`
    );
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get category by ID
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create new category
export const createCategory = async (req, res) => {
  try {
    const { name, description, slug } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const existing = await Category.findOne({ where: { name } });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await Category.create({
      name,
      description,
      slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { name, description, slug } = req.body;
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await category.update({
      name: name || category.name,
      description:
        description !== undefined ? description : category.description,
      slug: slug || category.slug,
    });

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await category.destroy();
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
