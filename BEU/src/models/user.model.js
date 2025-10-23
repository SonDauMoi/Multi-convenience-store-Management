import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
  class User extends Model {}

  User.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      username: { type: DataTypes.STRING, allowNull: false },
      password: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      dob: { type: DataTypes.DATE },
      gender: {
        type: DataTypes.ENUM("Male", "Female", "Other"),
        defaultValue: "Other",
      },
      resetOTP: { type: DataTypes.STRING },
      phone: { type: DataTypes.STRING },
      email: { type: DataTypes.STRING },
      resetOTPExpiry: { type: DataTypes.DATE },
      role: {
        type: DataTypes.ENUM("user", "manager", "admin"),
        allowNull: false,
        set(value) {
          this.setDataValue("role", value.trim());
        },
      },
      storeId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true, // Null for 'user' and 'admin', required for 'manager'
        references: {
          model: "stores",
          key: "id",
        },
      },
      avatar: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: "user",
      tableName: "users",
      timestamps: false,
      indexes: [
        { unique: true, fields: ["username"] },
        { unique: true, fields: ["email"] },
      ],
    }
  );

  return User;
};
