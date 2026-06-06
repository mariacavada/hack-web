import mongoose from "mongoose";

const MONGO_URI = (process.env.MONGODB_URI || process.env.MONGO_URI)!;
const DB_NAME = process.env.DB_NAME || "order_rescue";

export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
    console.log(`✓ MongoDB conectado — base: ${DB_NAME}`);
  } catch (err) {
    console.error("✗ Error conectando a MongoDB:", err);
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () =>
    console.warn("! MongoDB desconectado, intentando reconectar…")
  );
  mongoose.connection.on("reconnected", () =>
    console.log("✓ MongoDB reconectado")
  );
}
