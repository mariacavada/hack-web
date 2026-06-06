import { Schema, model, Document, Types } from "mongoose";

export type StatusFinal =
  | "pendiente"
  | "confirmado"
  | "asignado"
  | "en_camino"
  | "entregado"
  | "incompleto"
  | "cancelado";

export interface IOrder extends Document {
  id_pedido: string;
  customer_id: string;
  cedis_id: string;
  driver_id: Types.ObjectId | null;
  pais: string;
  id_businessunit: number;
  business_unit: string;
  fecha_pedido: string;
  fecha_entrega: string | null;
  status_final: StatusFinal;
  valor_pedido: number;
  subtotal: number;
  total: number;
  feedback_cliente: Record<string, unknown>;
  created_at: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    id_pedido: { type: String, index: true },
    customer_id: { type: String, required: true, index: true },
    cedis_id: { type: String, index: true },
    driver_id: { type: Schema.Types.ObjectId, ref: "Driver", default: null },
    pais: String,
    id_businessunit: Number,
    business_unit: String,
    fecha_pedido: String,
    fecha_entrega: { type: String, default: null },
    status_final: {
      type: String,
      enum: ["pendiente", "confirmado", "asignado", "en_camino", "entregado", "incompleto", "cancelado"],
      default: "pendiente",
      index: true,
    },
    valor_pedido: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    feedback_cliente: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: "created_at" } }
);

OrderSchema.index({ customer_id: 1, created_at: -1 });
OrderSchema.index({ cedis_id: 1, status_final: 1 });
OrderSchema.index({ driver_id: 1, status_final: 1 });

export const Order = model<IOrder>("Order", OrderSchema);
