import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
  class Product extends Model {}

  Product.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      image: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      buyed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      inStock: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      quantity: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      sold: {
        type: DataTypes.INTEGER.UNSIGNED,
        defaultValue: 0,
      },
      preparation_time: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: 0,
      },
      category: {
        type: DataTypes.ENUM("food", "drink", "household", "personal"),
        allowNull: true,
        defaultValue: "household",
      },
      storeId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "stores",
          key: "id",
        },
      },
      reviews: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "product",
      tableName: "products",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["name"],
        },
      ],
    }
  );

  return Product;
};
