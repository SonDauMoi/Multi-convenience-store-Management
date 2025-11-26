import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Banner = sequelize.define(
    "Banner",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      image_url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      link_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      position: {
        type: DataTypes.ENUM("home_main", "home_secondary", "category_top"),
        defaultValue: "home_main",
      },
      order_index: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "banners",
      timestamps: true,
      underscored: true,
    }
  );

  return Banner;
};
