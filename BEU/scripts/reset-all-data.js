/**
 * Script xóa TOÀN BỘ dữ liệu (bao gồm cả Users) và seed lại từ đầu
 * CHỈ SỬ DỤNG khi muốn reset hoàn toàn hệ thống
 */

import {
  sequelize,
  User,
  Store,
  Category,
  Product,
  ProductTemplate,
  StoreProduct,
  Order,
  OrderDetail,
  Banner,
  SiteSetting,
  Cart,
} from "../src/models/index.js";

async function resetAll() {
  try {
    console.log("⚠️  WARNING: This will DELETE ALL DATA including USERS!\n");
    console.log("🚀 Starting complete database reset...\n");

    console.log("🗑️  Clearing ALL data (including users)...");

    // PostgreSQL: Drop in correct order to handle foreign keys
    await OrderDetail.destroy({ where: {}, force: true });
    await Order.destroy({ where: {}, force: true });
    await Cart.destroy({ where: {}, force: true });
    await StoreProduct.destroy({ where: {}, force: true });
    await ProductTemplate.destroy({ where: {}, force: true });
    await Product.destroy({ where: {}, force: true });
    await Banner.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true }); // XÓA USERS
    await Store.destroy({ where: {}, force: true });
    await Category.destroy({ where: {}, force: true });
    await SiteSetting.destroy({ where: {}, force: true });

    console.log("✅ All data cleared (including users)\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    process.exit(1);
  }
}

resetAll();
