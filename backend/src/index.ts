import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";

import authRoutes from "./routes/authRoutes";
import orderRoutes from "./routes/orderRoutes";
import productRoutes from "./routes/productRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import userRoutes from "./routes/userRoutes";
import cedisRoutes from "./routes/cedisRoutes";
import driverRoutes from "./routes/driverRoutes";
import mlRoutes from "./routes/mlRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cedis", cedisRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/ml", mlRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`✓ Servidor en http://localhost:${PORT}`));
});
