import { Schema, model, Document } from "mongoose";

export interface ICustomer extends Document {
  customer_id: string;
  nombre_negocio: string;
  email: string;
  password_hash: string;
  telefono: string;
  tipo_cliente: string;
  pais: string;
  id_businessunit: number;
  business_unit: string;
  cedis_asignado: string;
  estado: string;
  preferencias_notificacion: Record<string, boolean>;
  patrones_preferencia: Record<string, unknown>;
  last_login: Date;
  created_at: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    customer_id: { type: String, unique: true, sparse: true },
    nombre_negocio: String,
    email: { type: String, required: true, unique: true, lowercase: true },
    password_hash: { type: String, required: true, select: false },
    telefono: String,
    tipo_cliente: String,
    pais: String,
    id_businessunit: Number,
    business_unit: String,
    cedis_asignado: { type: String, index: true },
    estado: { type: String, default: "activo" },
    preferencias_notificacion: { type: Schema.Types.Mixed, default: {} },
    patrones_preferencia: { type: Schema.Types.Mixed, default: {} },
    last_login: Date,
  },
  { timestamps: { createdAt: "created_at" } }
);

CustomerSchema.index({ cedis_asignado: 1, estado: 1 });

export const Customer = model<ICustomer>("Customer", CustomerSchema);
