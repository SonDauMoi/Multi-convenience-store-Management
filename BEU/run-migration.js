import { connectDb } from "./src/config/database.js";
import migrateProductsToTemplates from "./migrations/migrate-products-to-templates.js";

async function runMigration() {
  try {
    console.log("🔗 Kết nối database...");
    await connectDb();

    console.log("🚀 Chạy migration...");
    const result = await migrateProductsToTemplates();

    console.log("\n✅ Migration hoàn tất!");
    console.log("📊 Kết quả:", result);

    console.log("\n⚠️  Lưu ý:");
    console.log("1. Kiểm tra dữ liệu trong ProductTemplate và StoreProduct");
    console.log("2. Cập nhật frontend để sử dụng API mới (/store-products)");
    console.log(
      "3. Sau khi xác nhận OK, có thể xóa bảng Products cũ (tùy chọn)"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration thất bại:", error);
    process.exit(1);
  }
}

runMigration();
