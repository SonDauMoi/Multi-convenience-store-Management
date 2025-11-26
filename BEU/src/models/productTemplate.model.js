import { DataTypes } from "sequelize";

export default (sequelize) => {
  const ProductTemplate = sequelize.define(
    "ProductTemplate",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      image: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      images: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      price: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      category: {
        type: DataTypes.ENUM(
          "grocery",
          "snack",
          "beverage",
          "household",
          "personal_care",
          "other"
        ),
        allowNull: false,
        defaultValue: "other",
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "User ID who created this template",
      },
    },
    {
      tableName: "product_templates",
      timestamps: true,
      underscored: true,
    }
  );

  return ProductTemplate;
};
