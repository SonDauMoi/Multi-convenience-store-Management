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
      password: { type: DataTypes.STRING, allowNull: true }, // Nullable for OAuth users
      name: { type: DataTypes.STRING, allowNull: false },
      provider: {
        type: DataTypes.ENUM("local", "github", "facebook"),
        defaultValue: "local",
        allowNull: false,
      },
      githubId: { type: DataTypes.STRING, allowNull: true }, // For GitHub OAuth users
      facebookId: { type: DataTypes.STRING, allowNull: true }, // For Facebook OAuth users
      dob: { type: DataTypes.DATE },
      gender: {
        type: DataTypes.ENUM("Male", "Female", "Other"),
        defaultValue: "Other",
      },
      resetOTP: { type: DataTypes.STRING },
      verificationOTP: { type: DataTypes.STRING },
      verificationOTPExpiry: { type: DataTypes.DATE },
      isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
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
