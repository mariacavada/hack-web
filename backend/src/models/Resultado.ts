import { Schema, model, Document } from "mongoose";

export interface IResultado extends Document {
  id_businessunit: number;
  id_linea: string;
  id_pedido: string;
  sku_solicitado: string;
  sku_solicitado_hash: string;
  nombre_sku_solicitado: string;
  sku_solicitado_cambio: string;
  sku_solicitado_cambio_hash: string;
  nombre_sku_solicitado_cambio: string;
  notificado_al_cliente: boolean;
  respuesta_cliente: string;
  resultado: string;
  features_ml: Record<string, unknown>;
  created_at: Date;
}

const ResultadoSchema = new Schema<IResultado>(
  {
    id_businessunit: Number,
    id_linea: { type: String, index: true },
    id_pedido: { type: String, index: true },
    sku_solicitado: { type: String, index: true },
    sku_solicitado_hash: String,
    nombre_sku_solicitado: String,
    sku_solicitado_cambio: String,
    sku_solicitado_cambio_hash: String,
    nombre_sku_solicitado_cambio: String,
    notificado_al_cliente: { type: Boolean, default: false },
    respuesta_cliente: String,
    resultado: String,
    features_ml: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: "created_at" } }
);

ResultadoSchema.index({ sku_solicitado: 1, respuesta_cliente: 1 });

export const Resultado = model<IResultado>("Resultado", ResultadoSchema);
