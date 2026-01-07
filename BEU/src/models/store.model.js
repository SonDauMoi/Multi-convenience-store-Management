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
      provinceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "province_id",
      },
      districtId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "district_id",
      },
      wardId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "ward_id",
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
