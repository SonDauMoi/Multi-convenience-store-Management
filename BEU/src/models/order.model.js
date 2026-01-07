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
        type: DataTypes.ENUM("cash", "online", "COD", "paypal", "stripe"),
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
      receiver_name: { type: DataTypes.STRING, comment: "Tên người nhận" },
      receiver_phone: { type: DataTypes.STRING, comment: "SĐT người nhận" },
      delivery_address: { type: DataTypes.TEXT, comment: "Địa chỉ chi tiết" },
      province_id: { type: DataTypes.INTEGER, comment: "ID tỉnh/thành phố" },
      district_id: { type: DataTypes.INTEGER, comment: "ID quận/huyện" },
      ward_id: { type: DataTypes.INTEGER, comment: "ID phường/xã" },
      cancel_time: { type: DataTypes.DATE, comment: "Thời gian hủy đơn hàng" },
      cancel_reason: { type: DataTypes.TEXT, comment: "Lý do hủy đơn hàng" },
      notes: {
        type: DataTypes.TEXT,
        comment: "Ghi chú đơn hàng (bao gồm thông tin hoàn tiền)",
      },
      paypal_capture_id: {
        type: DataTypes.STRING,
        comment: "PayPal capture transaction ID for refunds",
      },
      paypal_order_id: { type: DataTypes.STRING, comment: "PayPal order ID" },
      refund_status: {
        type: DataTypes.ENUM("none", "pending", "completed", "failed"),
        defaultValue: "none",
        comment: "Trạng thái hoàn tiền",
      },
      refund_amount: { type: DataTypes.DOUBLE, comment: "Số tiền đã hoàn" },
      refund_time: { type: DataTypes.DATE, comment: "Thời gian hoàn tiền" },
      refund_id: {
        type: DataTypes.STRING,
        comment: "PayPal refund transaction ID",
      },
    },
    { sequelize, modelName: "order", tableName: "orders", timestamps: false }
  );

  return Order;
};
