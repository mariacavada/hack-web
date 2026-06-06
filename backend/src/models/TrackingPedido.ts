import { Schema, model, Document, Types } from "mongoose";

interface Evento {
  status: string;
  descripcion: string;
  timestamp: Date;
  coords?: { lat: number; lng: number };
}

export interface ITrackingPedido extends Document {
  id_pedido: string;
  customer_id: Types.ObjectId;
  eventos: Evento[];
  status_actual: string;
  localizacion_actual: { lat: number; lng: number } | null;
  eta_entrega: Date | null;
  updated_at: Date;
}

const TrackingPedidoSchema = new Schema<ITrackingPedido>(
  {
    id_pedido: { type: String, required: true, unique: true },
    customer_id: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    eventos: [
      {
        status: String,
        descripcion: String,
        timestamp: { type: Date, default: Date.now },
        coords: { lat: Number, lng: Number },
      },
    ],
    status_actual: { type: String, default: "pendiente" },
    localizacion_actual: { lat: Number, lng: Number },
    eta_entrega: { type: Date, default: null },
  },
  { timestamps: { updatedAt: "updated_at" } }
);

export const TrackingPedido = model<ITrackingPedido>("TrackingPedido", TrackingPedidoSchema);
