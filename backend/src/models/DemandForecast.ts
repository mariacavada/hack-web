import { Schema, model, Document } from "mongoose";

export interface IDemandForecast extends Document {
  cedis_id: string;
  sku: string;
  modelo: string;
  horizonte_dias: number;
  predicciones: { fecha: string; demanda: number }[];
  demanda_diaria_predicha: number;
  demanda_semanal_predicha: number;
  demanda_mensual_predicha: number;
  temporada: string;
  confianza: number;
  fecha_calculo: Date;
  valid_hasta: Date;
}

const DemandForecastSchema = new Schema<IDemandForecast>({
  cedis_id: { type: String, required: true, index: true },
  sku: { type: String, required: true, index: true },
  modelo: String,
  horizonte_dias: { type: Number, default: 30 },
  predicciones: [{ fecha: String, demanda: Number }],
  demanda_diaria_predicha: Number,
  demanda_semanal_predicha: Number,
  demanda_mensual_predicha: Number,
  temporada: String,
  confianza: { type: Number, min: 0, max: 1 },
  fecha_calculo: { type: Date, default: Date.now },
  valid_hasta: Date,
});

DemandForecastSchema.index({ cedis_id: 1, sku: 1, fecha_calculo: -1 });

export const DemandForecast = model<IDemandForecast>("DemandForecast", DemandForecastSchema);
