import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
  class Cart extends Model {}

  Cart.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      storeProductId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // Đổi từ productId
      storeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // Thêm mới
      storeName: { type: DataTypes.STRING, allowNull: true }, // Thêm mới - tên cửa hàng
      name: { type: DataTypes.STRING, allowNull: false },
      quantity: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      price: { type: DataTypes.DOUBLE, allowNull: false },
      total: { type: DataTypes.DOUBLE, allowNull: false },
      image: { type: DataTypes.TEXT },
      buyNow: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    { sequelize, modelName: "cart", tableName: "carts", timestamps: false }
  );

  return Cart;
};
