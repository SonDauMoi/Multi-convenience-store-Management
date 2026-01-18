import { Banner } from "../models/index.js";

// Get all banners (public)
export const getBanners = async (req, res) => {
  try {
    const { position } = req.query;

    const where = { is_active: true };
    if (position) {
      where.position = position;
    }

    const banners = await Banner.findAll({
      where,
      order: [
        ["order_index", "ASC"],
        ["created_at", "DESC"],
      ],
    });

    res.status(200).json(banners);
  } catch (error) {
    console.error("Get banners error:", error);
    res.status(500).json({ message: "Failed to fetch banners" });
  }
};

// Get all banners (admin - including inactive)
export const getAllBannersAdmin = async (req, res) => {
  try {
    const banners = await Banner.findAll({
      order: [
        ["position", "ASC"],
        ["order_index", "ASC"],
      ],
    });

    res.status(200).json(banners);
  } catch (error) {
    console.error("Get all banners error:", error);
    res.status(500).json({ message: "Failed to fetch banners" });
  }
};

// Create banner (admin only)
export const createBanner = async (req, res) => {
  try {
    const { title, image_url, link_url, position, order_index, is_active } =
      req.body;

    if (!title) {
      return res.status(400).json({ message: "title is required" });
    }

    const banner = await Banner.create({
      title,
      image_url,
      link_url,
      position: position || "home_main",
      order_index: order_index || 0,
      is_active: is_active !== undefined ? is_active : true,
    });

    res.status(201).json(banner);
  } catch (error) {
    console.error("Create banner error:", error);
    res.status(500).json({ message: "Failed to create banner" });
  }
};

// Update banner (admin only)
export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, image_url, link_url, position, order_index, is_active } =
      req.body;

    const banner = await Banner.findByPk(id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    // Chỉ update image_url nếu khác undefined và khác rỗng
    const updateData = {
      title: title || banner.title,
      link_url: link_url !== undefined ? link_url : banner.link_url,
      position: position || banner.position,
      order_index: order_index !== undefined ? order_index : banner.order_index,
      is_active: is_active !== undefined ? is_active : banner.is_active,
    };
    if (image_url !== undefined && image_url !== "") {
      updateData.image_url = image_url;
    }
    await banner.update(updateData);

    res.status(200).json(banner);
  } catch (error) {
    console.error("Update banner error:", error);
    res.status(500).json({ message: "Failed to update banner" });
  }
};

// Delete banner (admin only)
export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findByPk(id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    await banner.destroy();
    res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Delete banner error:", error);
    res.status(500).json({ message: "Failed to delete banner" });
  }
};
