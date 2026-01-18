// Fix provider ENUM type conflict
// This script properly recreates the enum_users_provider type

import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: console.log,
  }
);

async function fixEnum() {
  try {
    console.log("🔧 Fixing provider ENUM type...");

    // Step 1: Drop the default constraint temporarily
    console.log("Step 1: Removing default constraint...");
    await sequelize.query(`
      ALTER TABLE "users" ALTER COLUMN "provider" DROP DEFAULT;
    `);

    // Step 2: Convert column to VARCHAR temporarily
    console.log("Step 2: Converting to VARCHAR...");
    await sequelize.query(`
      ALTER TABLE "users" ALTER COLUMN "provider" TYPE VARCHAR(50);
    `);

    // Step 3: Drop the old ENUM type
    console.log("Step 3: Dropping old ENUM type...");
    await sequelize.query(`
      DROP TYPE IF EXISTS "public"."enum_users_provider" CASCADE;
    `);

    // Step 4: Create new ENUM type with all values
    console.log("Step 4: Creating new ENUM type...");
    await sequelize.query(`
      CREATE TYPE "public"."enum_users_provider" AS ENUM('local', 'github', 'facebook');
    `);

    // Step 5: Convert column back to ENUM
    console.log("Step 5: Converting back to ENUM...");
    await sequelize.query(`
      ALTER TABLE "users" 
      ALTER COLUMN "provider" TYPE "public"."enum_users_provider" 
      USING ("provider"::"public"."enum_users_provider");
    `);

    // Step 6: Re-add default value
    console.log("Step 6: Re-adding default value...");
    await sequelize.query(`
      ALTER TABLE "users" ALTER COLUMN "provider" SET DEFAULT 'local';
    `);

    // Step 7: Make column NOT NULL
    console.log("Step 7: Setting NOT NULL constraint...");
    await sequelize.query(`
      ALTER TABLE "users" ALTER COLUMN "provider" SET NOT NULL;
    `);

    console.log("\n✅ ENUM type fixed successfully!");
    console.log("Provider column now supports: 'local', 'github', 'facebook'");
  } catch (error) {
    console.error("❌ Error fixing ENUM:", error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

fixEnum();
