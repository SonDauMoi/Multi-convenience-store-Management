// src/controllers/store.controller.js
import { Store, User } from "../models/index.js";
import { Op } from "sequelize";

// Create a new store (Admin only)
export const createStore = async (req, res) => {
  try {
    const { name, address } = req.body;
    if (!name || !address) {
      return res
        .status(400)
        .json({ message: "Name and address are required." });
    }
    const newStore = await Store.create({ name, address });
    res.status(201).json(newStore);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get all stores
export const getAllStores = async (req, res) => {
  try {
    const stores = await Store.findAll();
    res.status(200).json(stores);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get a single store by ID
export const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await Store.findByPk(id);
    if (!store) {
      return res.status(404).json({ message: "Store not found." });
    }
    res.status(200).json(store);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update a store (Admin only)
export const updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address } = req.body;
    const [updated] = await Store.update({ name, address }, { where: { id } });
    if (!updated) {
      return res.status(404).json({ message: "Store not found." });
    }
    const updatedStore = await Store.findByPk(id);
    res.status(200).json(updatedStore);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Delete a store (Admin only)
export const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if any manager is assigned to this store
    const managerExists = await User.findOne({
      where: { storeId: id, role: "manager" },
    });
    if (managerExists) {
      return res
        .status(400)
        .json({ message: "Cannot delete store. Reassign managers first." });
    }

    const deleted = await Store.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: "Store not found." });
    }
    res.status(204).send(); // No Content
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
