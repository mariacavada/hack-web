import { Schema, model, Document } from "mongoose";

export interface IProduct extends Document {
  sku: string;
  name: string;
  category: string;
  business_unit: string;
  cedis: string;
  price: number;
  stock: number;
  low_stock_threshold: number;
  is_available: boolean;
  substitutes: { sku: string; name: string; similarity_score: number }[];
  depletion_prediction: {
    probability_out_of_stock: number;
    estimated_days_remaining: number;
    computed_at: Date;
  };
}

const ProductSchema = new Schema<IProduct>(
  {
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: String,
    business_unit: String,
    cedis: { type: String, index: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    low_stock_threshold: { type: Number, default: 10 },
    is_available: { type: Boolean, default: true },

    substitutes: [
      { sku: String, name: String, similarity_score: Number },
    ],
    depletion_prediction: {
      probability_out_of_stock: { type: Number, default: 0 },
      estimated_days_remaining: { type: Number, default: 999 },
      computed_at: Date,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

ProductSchema.index({ cedis: 1, is_available: 1 });
ProductSchema.index({ stock: 1 });

export const Product = model<IProduct>("Product", ProductSchema);
