// scripts/recreate-database.js
import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import { connectDb } from "../src/config/database.js";

dotenv.config();

const sequelize = new Sequelize(
  "postgres", // Connect to default postgres database first
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: false,
  }
);

async function recreateDatabase() {
  try {
    console.log("🔄 Đang kết nối đến PostgreSQL...");

    // Test connection
    await sequelize.authenticate();
    console.log("✅ Kết nối thành công");

    // Drop existing database if exists
    console.log("🗑️  Đang xóa database cũ...");
    await sequelize.query(
      `DROP DATABASE IF EXISTS "${process.env.DB_NAME}" WITH (FORCE);`
    );
    console.log("✅ Đã xóa database cũ");

    // Create new database
    console.log("📦 Đang tạo database mới...");
    await sequelize.query(`CREATE DATABASE "${process.env.DB_NAME}";`);
    console.log("✅ Đã tạo database mới");

    // Close connection to postgres database
    await sequelize.close();

    console.log("🎉 Hoàn thành! Database đã được tạo lại.");
    console.log("💡 Bây giờ bạn có thể chạy server để sync schema mới.");
  } catch (error) {
    console.error("❌ Lỗi khi tạo lại database:", error);
    process.exit(1);
  }
}

// Run the script
recreateDatabase();
