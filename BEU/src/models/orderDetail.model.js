import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
  class OrderDetail extends Model {}

  OrderDetail.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      orderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      price: { type: DataTypes.DOUBLE, allowNull: false },
      total_price: { type: DataTypes.DOUBLE, allowNull: false },
    },
    {
      sequelize,
      modelName: "orderDetail",
      tableName: "order_details",
      timestamps: false,
    }
  );

  return OrderDetail;
};
