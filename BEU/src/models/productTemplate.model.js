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
        type: DataTypes.TEXT, // Đảm bảo lưu được base64 dài
        allowNull: true,
      },
      images: {
        type: DataTypes.JSON, // Mảng các ảnh chi tiết
        allowNull: true,
      },
      price: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING, // Chuyển từ ENUM sang STRING để linh hoạt
        allowNull: true,
        defaultValue: "other",
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "category_id",
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
