import { Schema, model, Document } from "mongoose";

export type NivelAlerta = "ok" | "bajo" | "critico";

export interface IStockPredict extends Document {
  cedis_id: string;
  sku: string;
  stock_actual: number;
  rotacion_diaria_real: number;
  demanda_diaria_predicha: number;
  dias_estimados_agotamiento: number;
  fecha_agotamiento_predicha: Date | null;
  cantidad_reorden_sugerida: number;
  nivel_alerta: NivelAlerta;
  confianza: number;
  updated_at: Date;
}

const StockPredictSchema = new Schema<IStockPredict>(
  {
    cedis_id: { type: String, required: true },
    sku: { type: String, required: true },
    stock_actual: { type: Number, default: 0 },
    rotacion_diaria_real: Number,
    demanda_diaria_predicha: Number,
    dias_estimados_agotamiento: Number,
    fecha_agotamiento_predicha: { type: Date, default: null },
    cantidad_reorden_sugerida: { type: Number, default: 0 },
    nivel_alerta: {
      type: String,
      enum: ["ok", "bajo", "critico"],
      default: "ok",
    },
    confianza: { type: Number, min: 0, max: 1 },
  },
  { timestamps: { updatedAt: "updated_at" } }
);

StockPredictSchema.index({ cedis_id: 1, sku: 1 }, { unique: true });
StockPredictSchema.index({ nivel_alerta: 1 });

export const StockPredict = model<IStockPredict>("StockPredict", StockPredictSchema);
