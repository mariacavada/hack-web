import { Schema, model, Document } from "mongoose";

export interface IDashCache extends Document {
  tipo: string;
  cedis_id: string;
  datos: Record<string, unknown>;
  updated_at: Date;
}

const DashCacheSchema = new Schema<IDashCache>(
  {
    tipo: { type: String, required: true },
    cedis_id: { type: String, default: "global" },
    datos: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { updatedAt: "updated_at" } }
);

DashCacheSchema.index({ tipo: 1, cedis_id: 1 }, { unique: true });

export const DashCache = model<IDashCache>("DashCache", DashCacheSchema);
