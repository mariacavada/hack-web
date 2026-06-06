import { Schema, model, Document, Types } from "mongoose";

export interface INotification extends Document {
  customer_id: Types.ObjectId;
  id_pedido: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  canales: Record<string, boolean>;
  estado: string;
  prioridad: string;
  expiracion: Date | null;
  created_at: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    customer_id: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    id_pedido: { type: String, index: true },
    tipo: {
      type: String,
      enum: [
        "product_unavailable",
        "reorder_reminder",
        "substitution_suggestion",
        "order_status",
        "low_stock",
        "depletion_alert",
      ],
      required: true,
    },
    titulo: { type: String, required: true },
    mensaje: { type: String, required: true },
    canales: { type: Schema.Types.Mixed, default: { in_app: true } },
    estado: { type: String, enum: ["pendiente", "enviada", "leida"], default: "pendiente" },
    prioridad: { type: String, enum: ["baja", "media", "alta"], default: "media" },
    expiracion: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at" } }
);

NotificationSchema.index({ customer_id: 1, estado: 1, created_at: -1 });

export const Notification = model<INotification>("Notification", NotificationSchema);
