import { SiteSetting } from "../models/index.js";

// Get all settings (public)
export const getSettings = async (req, res) => {
  try {
    const { type } = req.query;

    const where = {};
    if (type) {
      where.type = type;
    }

    const settings = await SiteSetting.findAll({ where });

    // Convert to key-value object
    const settingsObj = {};
    settings.forEach((setting) => {
      settingsObj[setting.key] = setting.value;
    });

    res.status(200).json(settingsObj);
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ message: "Lỗi khi lấy settings" });
  }
};

// Get all settings as array (admin)
export const getAllSettingsAdmin = async (req, res) => {
  try {
    const settings = await SiteSetting.findAll({
      order: [
        ["type", "ASC"],
        ["key", "ASC"],
      ],
    });

    res.status(200).json(settings);
  } catch (error) {
    console.error("Get all settings error:", error);
    res.status(500).json({ message: "Lỗi khi lấy settings" });
  }
};

// Update or create setting (admin only)
export const upsertSetting = async (req, res) => {
  try {
    const { key, value, type } = req.body;

    if (!key) {
      return res.status(400).json({ message: "Key là bắt buộc" });
    }

    const [setting, created] = await SiteSetting.upsert(
      {
        key,
        value,
        type: type || "general",
      },
      {
        returning: true,
      }
    );

    res.status(created ? 201 : 200).json(setting);
  } catch (error) {
    console.error("Upsert setting error:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật setting" });
  }
};

// Delete setting (admin only)
export const deleteSetting = async (req, res) => {
  try {
    const { id } = req.params;

    const setting = await SiteSetting.findByPk(id);
    if (!setting) {
      return res.status(404).json({ message: "Không tìm thấy setting" });
    }

    await setting.destroy();
    res.status(200).json({ message: "Xóa setting thành công" });
  } catch (error) {
    console.error("Delete setting error:", error);
    res.status(500).json({ message: "Lỗi khi xóa setting" });
  }
};
