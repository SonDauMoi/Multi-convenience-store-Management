// scripts/rename-order-user-manager-columns.js
// Renames legacy orders columns: studentId -> userId, staffId -> managerId
// Safe to run multiple times.

import dotenv from "dotenv";
import { sequelize } from "../src/config/database.js";

dotenv.config();

const hasColumn = async (tableName, columnName) => {
  const qi = sequelize.getQueryInterface();
  const table = await qi.describeTable(tableName);
  return Object.prototype.hasOwnProperty.call(table, columnName);
};

async function renameColumns() {
  try {
    console.log("🔄 Checking orders table columns...");
    const qi = sequelize.getQueryInterface();

    const hasStudentId = await hasColumn("orders", "studentId");
    const hasUserId = await hasColumn("orders", "userId");

    if (hasStudentId && !hasUserId) {
      console.log("✏️  Renaming orders.studentId -> orders.userId");
      await qi.renameColumn("orders", "studentId", "userId");
    } else {
      console.log(
        `ℹ️  Skip studentId->userId (studentId=${hasStudentId}, userId=${hasUserId})`
      );
    }

    const hasStaffId = await hasColumn("orders", "staffId");
    const hasManagerId = await hasColumn("orders", "managerId");

    if (hasStaffId && !hasManagerId) {
      console.log("✏️  Renaming orders.staffId -> orders.managerId");
      await qi.renameColumn("orders", "staffId", "managerId");
    } else {
      console.log(
        `ℹ️  Skip staffId->managerId (staffId=${hasStaffId}, managerId=${hasManagerId})`
      );
    }

    console.log("✅ Done renaming columns.");
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to rename columns:", error);
    try {
      await sequelize.close();
    } catch {
      // ignore
    }
    process.exit(1);
  }
}

renameColumns();
