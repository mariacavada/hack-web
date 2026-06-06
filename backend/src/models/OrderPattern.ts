import { Schema, model, Document, Types } from "mongoose";

export interface IOrderPattern extends Document {
  customer_id: Types.ObjectId;
  sku: string;
  cedis_id: string;
  gap_promedio_dias: number;
  cantidad_promedio: number;
  proximo_reorden: Date | null;
  confianza: number;
  updated_at: Date;
}

const OrderPatternSchema = new Schema<IOrderPattern>(
  {
    customer_id: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    sku: { type: String, required: true },
    cedis_id: String,
    gap_promedio_dias: Number,
    cantidad_promedio: Number,
    proximo_reorden: { type: Date, default: null },
    confianza: { type: Number, min: 0, max: 1 },
  },
  { timestamps: { updatedAt: "updated_at" } }
);

OrderPatternSchema.index({ customer_id: 1, sku: 1 }, { unique: true });
OrderPatternSchema.index({ proximo_reorden: 1 });

export const OrderPattern = model<IOrderPattern>("OrderPattern", OrderPatternSchema);
