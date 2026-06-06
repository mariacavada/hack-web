import { Schema, model, Document } from "mongoose";

export interface IOrderDetail extends Document {
  id_linea: string;
  id_pedido: string;
  sku_solicitado: string;
  nombre_sku_solicitado: string;
  quantity: number;
  status: string;
}

const OrderDetailSchema = new Schema<IOrderDetail>({
  id_linea: { type: String, unique: true, sparse: true },
  id_pedido: { type: String, required: true, index: true },
  sku_solicitado: { type: String, index: true },
  nombre_sku_solicitado: String,
  quantity: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ["registrado", "entregado", "faltante", "sustituido"],
    default: "registrado",
  },
});

OrderDetailSchema.index({ id_pedido: 1, sku_solicitado: 1 });

export const OrderDetail = model<IOrderDetail>("OrderDetail", OrderDetailSchema);
