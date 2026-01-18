import { sequelize } from "./src/models/index.js";

(async () => {
  try {
    // Check current structure
    const [columns] = await sequelize.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'order_details' 
      ORDER BY ordinal_position;
    `);

    console.log("📊 Current order_details columns:");
    console.log(JSON.stringify(columns, null, 2));

    // Try to make productId nullable (note: camelCase)
    try {
      await sequelize.query(
        'ALTER TABLE order_details ALTER COLUMN "productId" DROP NOT NULL;'
      );
      console.log("✅ productId is now nullable");
    } catch (e) {
      console.log("⚠️  productId:", e.message);
    }

    // Check again
    const [columnsAfter] = await sequelize.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'order_details' AND column_name = 'productId';
    `);
    console.log("📊 After change:", columnsAfter);

    // Check all constraints on order_details table
    const [constraints] = await sequelize.query(`
      SELECT 
        con.conname AS constraint_name,
        con.contype AS constraint_type,
        pg_get_constraintdef(con.oid) AS definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'order_details';
    `);
    console.log("\n📋 Constraints on order_details:");
    console.log(JSON.stringify(constraints, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
})();
