import { DataTypes } from "sequelize";

export default (sequelize) => {
  const StoreProduct = sequelize.define(
    "StoreProduct",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      product_template_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      store_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      sold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      in_stock: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "store_products",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["product_template_id", "store_id"],
        },
      ],
    }
  );

  return StoreProduct;
};
