// scripts/link-category-fk.js
// Adds product_templates.category_id FK -> categories(id) and seeds core categories.

import dotenv from "dotenv";
import { sequelize } from "../src/config/database.js";

dotenv.config();

async function linkCategoryFk() {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Connected!");

    const [categoryColumns] = await sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'categories'"
    );
    const categoryColumnNames = new Set(
      categoryColumns.map((c) => c.column_name)
    );

    const createdAtColumn = categoryColumnNames.has("created_at")
      ? "created_at"
      : categoryColumnNames.has("createdAt")
      ? "createdAt"
      : null;

    const updatedAtColumn = categoryColumnNames.has("updated_at")
      ? "updated_at"
      : categoryColumnNames.has("updatedAt")
      ? "updatedAt"
      : null;

    console.log("🔄 Ensuring categories.slug unique index...");
    await sequelize.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_unique" ON "categories" ("slug")'
    );

    console.log("🔄 Seeding core categories...");
    if (!createdAtColumn || !updatedAtColumn) {
      throw new Error(
        `categories table is missing timestamp columns. Expected created_at/updated_at or createdAt/updatedAt but found: ${[
          ...categoryColumnNames,
        ].join(", ")}`
      );
    }

    await sequelize.query(`
      INSERT INTO "categories" ("name", "slug", "description", "${createdAtColumn}", "${updatedAtColumn}")
      VALUES
        ('Groceries', 'grocery', 'Grocery category', NOW(), NOW()),
        ('Snacks', 'snack', 'Snack category', NOW(), NOW()),
        ('Beverages', 'beverage', 'Beverage category', NOW(), NOW()),
        ('Household', 'household', 'Household category', NOW(), NOW()),
        ('Personal Care', 'personal_care', 'Personal care category', NOW(), NOW()),
        ('Other', 'other', 'Other category', NOW(), NOW())
      ON CONFLICT DO NOTHING;
    `);

    console.log("🔄 Ensuring product_templates.category_id column...");
    await sequelize.query(
      'ALTER TABLE "product_templates" ADD COLUMN IF NOT EXISTS "category_id" INTEGER'
    );

    console.log(
      "🔄 Ensuring FK constraint product_templates.category_id -> categories.id..."
    );
    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'product_templates_category_id_fkey'
        ) THEN
          ALTER TABLE "product_templates"
          ADD CONSTRAINT "product_templates_category_id_fkey"
          FOREIGN KEY ("category_id")
          REFERENCES "categories"("id")
          ON UPDATE CASCADE
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    console.log(
      "🔄 Backfilling product_templates.category_id from product_templates.category (slug match)..."
    );
    await sequelize.query(`
      UPDATE "product_templates" pt
      SET "category_id" = c."id"
      FROM "categories" c
      WHERE pt."category_id" IS NULL
        AND c."slug" IS NOT NULL
        AND c."slug" = pt."category"::text;
    `);

    console.log("✅ Done. categories ↔ product_templates are linked.");
  } catch (error) {
    console.error("❌ link-category-fk failed:", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

linkCategoryFk();
