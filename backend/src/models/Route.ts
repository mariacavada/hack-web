import { Schema, model, Document, Types } from "mongoose";

interface RouteStop {
  order_id: Types.ObjectId;
  stop_number: number;
  address: { street: string; coords: { lat: number; lng: number } };
  estimated_arrival: Date;
  actual_arrival: Date | null;
  status: "pendiente" | "en_camino" | "completado";
}

export interface IRoute extends Document {
  repartidor_id: Types.ObjectId;
  date: Date;
  stops: RouteStop[];
  total_distance_km: number;
  optimized_at: Date;
}

const RouteSchema = new Schema<IRoute>({
  repartidor_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  stops: [
    {
      order_id: { type: Schema.Types.ObjectId, ref: "Order" },
      stop_number: Number,
      address: {
        street: String,
        coords: { lat: Number, lng: Number },
      },
      estimated_arrival: Date,
      actual_arrival: { type: Date, default: null },
      status: {
        type: String,
        enum: ["pendiente", "en_camino", "completado"],
        default: "pendiente",
      },
    },
  ],
  total_distance_km: Number,
  optimized_at: { type: Date, default: Date.now },
});

RouteSchema.index({ repartidor_id: 1, date: 1 });

export const Route = model<IRoute>("Route", RouteSchema);
