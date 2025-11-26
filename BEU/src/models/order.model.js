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
        type: DataTypes.ENUM("cash", "online", "COD"),
        allowNull: false,
      },
      order_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "processing",
          "shipping",
          "delivered",
          "cancelled"
        ),
        defaultValue: "pending",
      },
      shipping_partner: { type: DataTypes.STRING, comment: "GHN, GHTK, etc." },
      shipping_code: { type: DataTypes.STRING, comment: "Mã vận đơn" },
      shipping_fee: { type: DataTypes.DOUBLE, defaultValue: 0 },
      shipper_name: { type: DataTypes.STRING },
      shipper_phone: { type: DataTypes.STRING },
    },
    { sequelize, modelName: "order", tableName: "orders", timestamps: false }
  );

  return Order;
};
