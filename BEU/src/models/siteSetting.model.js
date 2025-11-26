import { DataTypes } from "sequelize";

export default (sequelize) => {
  const SiteSetting = sequelize.define(
    "SiteSetting",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      key: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM("header", "footer", "general"),
        defaultValue: "general",
      },
    },
    {
      tableName: "site_settings",
      timestamps: true,
      underscored: true,
    }
  );

  return SiteSetting;
};
