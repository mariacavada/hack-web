import { Schema, model, Document } from "mongoose";

export interface IInventarioCedis extends Document {
  cedis_id: string;
  sku: string;
  stock_disponible: number;
  stock_reservado: number;
  stock_minimo: number;
  stock_critico: number;
  stock_maximo: number;
  ultima_entrada: Date;
  ultima_salida: Date;
  updated_at: Date;
}

const InventarioCedisSchema = new Schema<IInventarioCedis>(
  {
    cedis_id: { type: String, required: true, index: true },
    sku: { type: String, required: true, index: true },
    stock_disponible: { type: Number, default: 0 },
    stock_reservado: { type: Number, default: 0 },
    stock_minimo: { type: Number, default: 0 },
    stock_critico: { type: Number, default: 0 },
    stock_maximo: Number,
    ultima_entrada: Date,
    ultima_salida: Date,
  },
  { timestamps: { updatedAt: "updated_at" } }
);

InventarioCedisSchema.index({ cedis_id: 1, sku: 1 }, { unique: true });

export const InventarioCedis = model<IInventarioCedis>("InventarioCedis", InventarioCedisSchema);
