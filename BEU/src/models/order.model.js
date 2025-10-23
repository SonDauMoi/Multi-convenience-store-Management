import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
  class Order extends Model {}

  Order.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      storeId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "stores",
          key: "id",
        },
      },
      studentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      staffId: { type: DataTypes.INTEGER.UNSIGNED },
      total_quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      total_price: { type: DataTypes.DOUBLE, allowNull: false },
      discount: { type: DataTypes.DOUBLE, defaultValue: 0 },
      final_price: { type: DataTypes.DOUBLE, allowNull: false },
      payment_method: {
        type: DataTypes.ENUM("cash", "online"),
        allowNull: false,
      },
      order_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      status: {
        type: DataTypes.ENUM("pending", "processing", "completed", "declined"),
        defaultValue: "pending",
      },
    },
    { sequelize, modelName: "order", tableName: "orders", timestamps: false }
  );

  return Order;
};
