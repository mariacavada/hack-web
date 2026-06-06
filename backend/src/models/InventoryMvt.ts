import { Schema, model, Document } from "mongoose";

export type TipoMovimiento =
  | "entrada"
  | "salida"
  | "reserva"
  | "liberacion"
  | "ajuste";

export interface IInventoryMvt extends Document {
  cedis_id: string;
  sku: string;
  tipo_movimiento: TipoMovimiento;
  cantidad: number;
  stock_antes: number;
  stock_despues: number;
  id_pedido: string;
  motivo: string;
  timestamp: Date;
}

const InventoryMvtSchema = new Schema<IInventoryMvt>({
  cedis_id: { type: String, required: true, index: true },
  sku: { type: String, required: true },
  tipo_movimiento: {
    type: String,
    enum: ["entrada", "salida", "reserva", "liberacion", "ajuste"],
    required: true,
  },
  cantidad: { type: Number, required: true },
  stock_antes: Number,
  stock_despues: Number,
  id_pedido: String,
  motivo: String,
  timestamp: { type: Date, default: Date.now },
});

InventoryMvtSchema.index({ cedis_id: 1, sku: 1, timestamp: -1 });

export const InventoryMvt = model<IInventoryMvt>("InventoryMvt", InventoryMvtSchema);
