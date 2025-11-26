import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
  class Category extends Model {}

  Category.init(
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
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "category",
      tableName: "categories",
      timestamps: true,
    }
  );

  return Category;
};
