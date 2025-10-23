import initUserModel from "./user.model.js";
import initProductModel from "./product.model.js";
import initCartModel from "./cart.model.js";
import initOrderDetailModel from "./orderDetail.model.js";
import initOrderModel from "./order.model.js";
import initStoreModel from "./store.model.js";
import { sequelize } from "../config/database.js";

// Initialize models
const User = initUserModel(sequelize);
const Product = initProductModel(sequelize);
const Cart = initCartModel(sequelize);
const OrderDetail = initOrderDetailModel(sequelize);
const Order = initOrderModel(sequelize);
const Store = initStoreModel(sequelize);

// --- Define Associations ---

// Store Associations
Store.hasMany(Product, { foreignKey: "storeId", as: "products" });
Product.belongsTo(Store, { foreignKey: "storeId", as: "store" });

Store.hasMany(Order, { foreignKey: "storeId", as: "orders" });
Order.belongsTo(Store, { foreignKey: "storeId", as: "store" });

Store.hasMany(User, { foreignKey: "storeId", as: "managers" });
User.belongsTo(Store, { foreignKey: "storeId", as: "store" });

// User-Cart Association
User.hasMany(Cart, { foreignKey: "userId" });
Cart.belongsTo(User, { foreignKey: "userId" });

// Product-Cart Association
Product.hasMany(Cart, { foreignKey: "productId" });
Cart.belongsTo(Product, { foreignKey: "productId" });

// User-Order Association
User.hasMany(Order, { as: "userOrders", foreignKey: "studentId" });
User.hasMany(Order, { as: "managerOrders", foreignKey: "staffId" });
Order.belongsTo(User, { as: "user", foreignKey: "studentId" });
Order.belongsTo(User, { as: "manager", foreignKey: "staffId" });

// Order-OrderDetail Association
Order.hasMany(OrderDetail, { foreignKey: "orderId" });
OrderDetail.belongsTo(Order, { foreignKey: "orderId" });

// Product-OrderDetail Association
Product.hasMany(OrderDetail, { foreignKey: "productId" });
OrderDetail.belongsTo(Product, { foreignKey: "productId" });

const syncModels = async () => {
  await sequelize.sync({ alter: true });
  console.log("🔄 All models were synchronized successfully.");
};

export {
  sequelize,
  syncModels,
  User,
  Product,
  Cart,
  OrderDetail,
  Order,
  Store,
};
