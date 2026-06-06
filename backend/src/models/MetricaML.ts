import { Schema, model, Document } from "mongoose";

export interface IMetricaML extends Document {
  modelo: string;
  tipo: string;
  version: string;
  precision: number;
  recall: number;
  f1_score: number;
  rmse: number;
  mae: number;
  muestras: number;
  fecha: Date;
}

const MetricaMLSchema = new Schema<IMetricaML>({
  modelo: { type: String, required: true },
  tipo: String,
  version: String,
  precision: Number,
  recall: Number,
  f1_score: Number,
  rmse: Number,
  mae: Number,
  muestras: Number,
  fecha: { type: Date, default: Date.now },
});

MetricaMLSchema.index({ modelo: 1, fecha: -1 });

export const MetricaML = model<IMetricaML>("MetricaML", MetricaMLSchema);
