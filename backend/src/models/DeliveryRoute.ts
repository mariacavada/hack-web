import { Schema, model, Document, Types } from "mongoose";

interface Parada {
  id_pedido: string;
  stop_number: number;
  direccion: string;
  coords: { lat: number; lng: number };
  eta: Date | null;
  llegada_real: Date | null;
  status: "pendiente" | "en_camino" | "completado";
}

export interface IDeliveryRoute extends Document {
  driver_id: Types.ObjectId;
  id_pedido: string;
  cedis_id: string;
  estado: string;
  paradas: Parada[];
  metricas_ruta: Record<string, unknown>;
  fecha: Date;
  updated_at: Date;
}

const DeliveryRouteSchema = new Schema<IDeliveryRoute>(
  {
    driver_id: { type: Schema.Types.ObjectId, ref: "Driver", required: true, index: true },
    id_pedido: { type: String, index: true },
    cedis_id: { type: String, index: true },
    estado: { type: String, default: "pendiente" },
    paradas: [
      {
        id_pedido: String,
        stop_number: Number,
        direccion: String,
        coords: { lat: Number, lng: Number },
        eta: { type: Date, default: null },
        llegada_real: { type: Date, default: null },
        status: {
          type: String,
          enum: ["pendiente", "en_camino", "completado"],
          default: "pendiente",
        },
      },
    ],
    metricas_ruta: { type: Schema.Types.Mixed, default: {} },
    fecha: { type: Date, required: true },
  },
  { timestamps: { updatedAt: "updated_at" } }
);

DeliveryRouteSchema.index({ driver_id: 1, fecha: 1 });

export const DeliveryRoute = model<IDeliveryRoute>("DeliveryRoute", DeliveryRouteSchema);
