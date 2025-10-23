import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { syncModels } from "./models/index.js";
import { sequelize, connectDb } from "./config/database.js";
import Cart from "./routes/cart.routes.js";
import Products from "./routes/products.routes.js";
import Stores from "./routes/store.routes.js";
import Login from "./routes/login.routes.js";
import Inventory from "./routes/inventory.routes.js";
import Orders from "./routes/orders.routes.js";
import Payment from "./routes/payment.routes.js";
import { default as Users, default as Wallet } from "./routes/users.routes.js";

dotenv.config();

const PORT = process.env.PORT || 8000;
const app = express();

app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true }));

await connectDb();
await syncModels();

// Routes
app.use("/", Login);
app.use("/orders", Orders);
app.use("/inventory", Inventory);
app.use("/user", Users);
app.use("/products", Products);
app.use("/stores", Stores);
app.use("/cart", Cart);
app.use("/wallet", Wallet);
app.use("/payment", Payment);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
