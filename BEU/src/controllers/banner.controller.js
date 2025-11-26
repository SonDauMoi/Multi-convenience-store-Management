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
    res.status(500).json({ message: "Lỗi khi lấy banners" });
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
    res.status(500).json({ message: "Lỗi khi lấy banners" });
  }
};

// Create banner (admin only)
export const createBanner = async (req, res) => {
  try {
    const { title, image_url, link_url, position, order_index, is_active } =
      req.body;

    if (!title || !image_url) {
      return res
        .status(400)
        .json({ message: "Title và image_url là bắt buộc" });
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
    res.status(500).json({ message: "Lỗi khi tạo banner" });
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
      return res.status(404).json({ message: "Không tìm thấy banner" });
    }

    await banner.update({
      title: title || banner.title,
      image_url: image_url || banner.image_url,
      link_url: link_url !== undefined ? link_url : banner.link_url,
      position: position || banner.position,
      order_index: order_index !== undefined ? order_index : banner.order_index,
      is_active: is_active !== undefined ? is_active : banner.is_active,
    });

    res.status(200).json(banner);
  } catch (error) {
    console.error("Update banner error:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật banner" });
  }
};

// Delete banner (admin only)
export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findByPk(id);
    if (!banner) {
      return res.status(404).json({ message: "Không tìm thấy banner" });
    }

    await banner.destroy();
    res.status(200).json({ message: "Xóa banner thành công" });
  } catch (error) {
    console.error("Delete banner error:", error);
    res.status(500).json({ message: "Lỗi khi xóa banner" });
  }
};
