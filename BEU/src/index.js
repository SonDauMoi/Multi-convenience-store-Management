import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import passport from "./config/passport.js";
import { syncModels } from "./models/index.js";
import { sequelize, connectDb } from "./config/database.js";
import Cart from "./routes/cart.routes.js";
import Products from "./routes/products.routes.js";
import Stores from "./routes/store.routes.js";
import Categories from "./routes/category.routes.js";
import Login from "./routes/login.routes.js";
import Inventory from "./routes/inventory.routes.js";
import Orders from "./routes/orders.routes.js";
import Payment from "./routes/payment.routes.js";
import OAuth from "./routes/oauth.routes.js";
import Upload from "./routes/upload.routes.js";
import Banners from "./routes/banner.routes.js";
import SiteSettings from "./routes/siteSetting.routes.js";
import Admin from "./routes/admin.routes.js";
import StoreProducts from "./routes/storeProduct.routes.js";
import { default as Users, default as Wallet } from "./routes/users.routes.js";

dotenv.config();

const PORT = process.env.PORT || 8000;
const app = express();

app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true }));

// Session configuration for Passport
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

await connectDb();
await syncModels();

// Routes
app.use("/", Login);
app.use("/orders", Orders);
app.use("/inventory", Inventory);
app.use("/user", Users);
app.use("/products", Products);
app.use("/stores", Stores);
app.use("/category", Categories);
app.use("/cart", Cart);
app.use("/wallet", Wallet);
app.use("/payment", Payment);
app.use("/oauth2", OAuth);
app.use("/file-upload", Upload);
app.use("/banners", Banners);
app.use("/site-settings", SiteSettings);
app.use("/admin", Admin);
app.use("/store-products", StoreProducts);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
