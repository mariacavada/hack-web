import { Schema, model, Document } from "mongoose";

interface SubstituteEntry {
  sku: string;
  name: string;
  times_accepted: number;
  times_rejected: number;
}

interface SubstitutionProfile {
  original_sku: string;
  preferred_substitutes: SubstituteEntry[];
  last_updated: Date;
}

interface PurchasePattern {
  sku: string;
  name: string;
  avg_quantity: number;
  avg_days_between_orders: number;
  last_ordered: Date;
  next_predicted_order: Date;
}

export interface IUser extends Document {
  email: string;
  phone: string;
  name: string;
  password: string;
  role: "usuario" | "admin" | "repartidor";
  created_at: Date;
  // usuario
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    coords: { lat: number; lng: number };
  };
  substitution_profile: SubstitutionProfile[];
  purchase_patterns: PurchasePattern[];
  notification_prefs: {
    reorder_reminder: boolean;
    substitution_alert: boolean;
    order_tracking: boolean;
  };
  // repartidor
  vehicle?: string;
  cedis?: string;
  current_location?: { lat: number; lng: number };
  is_available?: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: String,
    name: { type: String, required: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["usuario", "admin", "repartidor"], required: true },

    // usuario
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      coords: { lat: Number, lng: Number },
    },
    substitution_profile: [
      {
        original_sku: String,
        preferred_substitutes: [
          { sku: String, name: String, times_accepted: Number, times_rejected: Number },
        ],
        last_updated: Date,
      },
    ],
    purchase_patterns: [
      {
        sku: String,
        name: String,
        avg_quantity: Number,
        avg_days_between_orders: Number,
        last_ordered: Date,
        next_predicted_order: Date,
      },
    ],
    notification_prefs: {
      reorder_reminder: { type: Boolean, default: true },
      substitution_alert: { type: Boolean, default: true },
      order_tracking: { type: Boolean, default: true },
    },

    // repartidor
    vehicle: String,
    cedis: String,
    current_location: { lat: Number, lng: Number },
    is_available: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const User = model<IUser>("User", UserSchema);
