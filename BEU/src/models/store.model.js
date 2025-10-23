// src/models/store.model.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Store = sequelize.define(
    "Store",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "stores",
      timestamps: true,
      underscored: true, // Use snake_case for column names
    }
  );

  return Store;
};
