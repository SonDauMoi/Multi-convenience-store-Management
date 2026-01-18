// scripts/sync-database.js
import dotenv from "dotenv";
import { sequelize } from "../src/config/database.js";
import {
  User,
  Store,
  Order,
  OrderDetail,
  Cart,
  Category,
  Banner,
  SiteSetting,
  ProductTemplate,
  StoreProduct,
} from "../src/models/index.js";

dotenv.config();

async function syncDatabase() {
  try {
    console.log("🔄 Syncing database schema...");

    // Sync all models (alter: true will update tables without dropping data)
    await sequelize.sync({ alter: true });

    console.log("✅ Database schema synced successfully!");
    console.log("📊 Tables created/updated:");
    console.log("  - users");
    console.log("  - stores");
    console.log("  - orders");
    console.log("  - order_details");
    console.log("  - carts");
    console.log("  - categories");
    console.log("  - banners");
    console.log("  - site_settings");
    console.log("  - product_templates");
    console.log("  - store_products");

    // Close connection
    await sequelize.close();

    console.log("🎉 Done! You can start the server now.");
  } catch (error) {
    console.error("❌ Error while syncing database:", error);
    process.exit(1);
  }
}

// Run the script
syncDatabase();
