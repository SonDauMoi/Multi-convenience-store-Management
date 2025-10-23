// src/controllers/user.controller.js
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { User, Order, Cart } from "../models/index.js";

// Get user info by ID
export const getUserInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Edit user profile
export const editProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.email) {
      const existedEmail = await User.findOne({
        where: { email: updates.email, id: { [Op.ne]: id } },
      });
      if (existedEmail) {
        return res.status(400).json({ message: "Email already exists." });
      }
    }

    if (updates.username) {
      const existed = await User.findOne({
        where: { username: updates.username, id: { [Op.ne]: id } },
      });
      if (existed) {
        return res.status(401).json({ message: "Username already exists." });
      }
    }

    const [affected] = await User.update(updates, { where: { id } });
    if (!affected) {
      return res.status(404).json({ message: "User not found" });
    }
    const updated = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
    res.status(200).json(updated);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Delete a user (manager or user)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete the user
    const assignedOrder = await Order.findOne({
      where: { staffId: id, status: "processing" },
    });
    if (assignedOrder) {
      return res
        .status(400)
        .json({ message: "Cannot delete manager with orders in process." });
    }

    // Delete related data
    await Order.destroy({
      where: { [Op.or]: [{ staffId: id }, { studentId: id }] },
    });
    await Cart.destroy({ where: { userId: id } });
    await user.destroy();

    res
      .status(200)
      .json({ message: "User and related data deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all users (for admin)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: "user" },
      attributes: { exclude: ["password"] },
    });
    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get all managers (for admin)
export const getAllManagers = async (req, res) => {
  try {
    const managers = await User.findAll({
      where: { role: "manager" },
      attributes: { exclude: ["password"] },
    });
    res.status(200).json(managers);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Create a new user (user, manager, or admin)
export const createUser = async (req, res) => {
  try {
    const { username, name, email, password, role, storeId } = req.body;
    if (!username || !name || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    if (role === "manager" && !storeId) {
      return res
        .status(400)
        .json({ message: "storeId is required for manager role" });
    }

    const existing = await User.findOne({
      where: { [Op.or]: [{ email }, { username }] },
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: "User with this email or username already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      name,
      email,
      password: hashed,
      role,
      storeId: role === "manager" ? storeId : null,
    });

    const userResponse = { ...newUser.get({ plain: true }) };
    delete userResponse.password;

    res
      .status(201)
      .json({ message: "User created successfully", user: userResponse });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
