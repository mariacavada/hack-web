import { Schema, model, Document, Types } from "mongoose";

export type OrderStatus =
  | "pendiente"
  | "confirmado"
  | "asignado"
  | "en_camino"
  | "entregado"
  | "incompleto"
  | "cancelado";

export type ItemStatus = "registrado" | "entregado" | "faltante" | "sustituido";

interface OrderItem {
  sku: string;
  name: string;
  quantity_requested: number;
  quantity_delivered: number;
  unit_price: number;
  status: ItemStatus;
  substitution?: {
    original_sku: string;
    original_name: string;
    substitute_sku: string;
    substitute_name: string;
    accepted_by_user: boolean | null;
    suggested_by: "gemini" | "repartidor" | "admin";
  };
}

export interface IOrder extends Document {
  id_pedido: string;
  customer_id: Types.ObjectId;
  repartidor_id: Types.ObjectId | null;
  cedis: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  total: number;
  tracking: {
    ordered_at: Date;
    confirmed_at: Date | null;
    assigned_at: Date | null;
    picked_up_at: Date | null;
    delivered_at: Date | null;
  };
  delivery_address: {
    street: string;
    city: string;
    coords: { lat: number; lng: number };
  };
  delivery_notes: string;
  missing_items_reported: string[];
  chatbot_session_id: Types.ObjectId | null;
}

const OrderSchema = new Schema<IOrder>(
  {
    id_pedido: { type: String, index: true },
    customer_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    repartidor_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
    cedis: String,
    status: {
      type: String,
      enum: ["pendiente", "confirmado", "asignado", "en_camino", "entregado", "incompleto", "cancelado"],
      default: "pendiente",
      index: true,
    },

    items: [
      {
        sku: String,
        name: String,
        quantity_requested: Number,
        quantity_delivered: { type: Number, default: 0 },
        unit_price: Number,
        status: {
          type: String,
          enum: ["registrado", "entregado", "faltante", "sustituido"],
          default: "registrado",
        },
        substitution: {
          original_sku: String,
          original_name: String,
          substitute_sku: String,
          substitute_name: String,
          accepted_by_user: { type: Boolean, default: null },
          suggested_by: { type: String, enum: ["gemini", "repartidor", "admin"] },
        },
      },
    ],

    subtotal: Number,
    total: Number,

    tracking: {
      ordered_at: { type: Date, default: Date.now },
      confirmed_at: { type: Date, default: null },
      assigned_at: { type: Date, default: null },
      picked_up_at: { type: Date, default: null },
      delivered_at: { type: Date, default: null },
    },

    delivery_address: {
      street: String,
      city: String,
      coords: { lat: Number, lng: Number },
    },

    delivery_notes: { type: String, default: "" },
    missing_items_reported: [String],
    chatbot_session_id: { type: Schema.Types.ObjectId, ref: "ChatbotSession", default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

OrderSchema.index({ customer_id: 1, created_at: -1 });
OrderSchema.index({ repartidor_id: 1, status: 1 });

export const Order = model<IOrder>("Order", OrderSchema);
