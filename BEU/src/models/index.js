import initUserModel from "./user.model.js";
import initCartModel from "./cart.model.js";
import initOrderDetailModel from "./orderDetail.model.js";
import initOrderModel from "./order.model.js";
import initStoreModel from "./store.model.js";
import initCategoryModel from "./category.model.js";
import initBannerModel from "./banner.model.js";
import initSiteSettingModel from "./siteSetting.model.js";
import initProductTemplateModel from "./productTemplate.model.js";
import initStoreProductModel from "./storeProduct.model.js";
import { sequelize } from "../config/database.js";

// Initialize models
const User = initUserModel(sequelize);
const Cart = initCartModel(sequelize);
const OrderDetail = initOrderDetailModel(sequelize);
const Order = initOrderModel(sequelize);
const Store = initStoreModel(sequelize);
const Category = initCategoryModel(sequelize);
const Banner = initBannerModel(sequelize);
const SiteSetting = initSiteSettingModel(sequelize);
const ProductTemplate = initProductTemplateModel(sequelize);
const StoreProduct = initStoreProductModel(sequelize);

// --- Define Associations ---

// Store Associations
Store.hasMany(Order, { foreignKey: "storeId", as: "orders" });
Order.belongsTo(Store, { foreignKey: "storeId", as: "store" });

Store.hasMany(User, { foreignKey: "storeId", as: "managers" });
User.belongsTo(Store, { foreignKey: "storeId", as: "store" });

// User-Cart Association
User.hasMany(Cart, { foreignKey: "userId" });
Cart.belongsTo(User, { foreignKey: "userId" });

// StoreProduct-Cart Association
StoreProduct.hasMany(Cart, { foreignKey: "storeProductId" });
Cart.belongsTo(StoreProduct, { foreignKey: "storeProductId" });

// User-Order Association
User.hasMany(Order, { as: "userOrders", foreignKey: "userId" });
User.hasMany(Order, { as: "managerOrders", foreignKey: "managerId" });
Order.belongsTo(User, { as: "user", foreignKey: "userId" });
Order.belongsTo(User, { as: "manager", foreignKey: "managerId" });

// Order-OrderDetail Association
Order.hasMany(OrderDetail, { foreignKey: "orderId", as: "orderDetails" });
OrderDetail.belongsTo(Order, { foreignKey: "orderId" });

// StoreProduct-OrderDetail Association (MỚI)
StoreProduct.hasMany(OrderDetail, { foreignKey: "storeProductId" });
OrderDetail.belongsTo(StoreProduct, { foreignKey: "storeProductId" });

// Category - ProductTemplate Association (NEW)
Category.hasMany(ProductTemplate, {
  foreignKey: "categoryId",
  as: "productTemplates",
});
ProductTemplate.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "categoryRef",
});

// ProductTemplate - StoreProduct - Store Associations
ProductTemplate.hasMany(StoreProduct, {
  foreignKey: "product_template_id",
  as: "storeProducts",
});
StoreProduct.belongsTo(ProductTemplate, {
  foreignKey: "product_template_id",
  as: "productTemplate",
});

Store.hasMany(StoreProduct, { foreignKey: "store_id", as: "storeProducts" });
StoreProduct.belongsTo(Store, { foreignKey: "store_id", as: "store" });

const syncModels = async () => {
  try {
    // Comment out sync during development if it causes issues with Postgres ENUMs
    // await sequelize.sync({ alter: true });
    console.log(
      "🔄 Model synchronization is handled manually or skipped for now."
    );
  } catch (error) {
    console.error("❌ Error synchronizing models:", error);
  }
};

export {
  sequelize,
  syncModels,
  User,
  Cart,
  OrderDetail,
  Order,
  Store,
  Category,
  Banner,
  SiteSetting,
  ProductTemplate,
  StoreProduct,
};
