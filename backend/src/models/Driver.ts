import { Schema, model, Document } from "mongoose";

export interface IDriver extends Document {
  nombre: string;
  email: string;
  password_hash: string;
  telefono: string;
  cedis_id: string;
  vehiculo_placa: string;
  calificacion_promedio: number;
  ubicacion_actual: { lat: number; lng: number };
  estado: string;
  last_login: Date;
  created_at: Date;
}

const DriverSchema = new Schema<IDriver>(
  {
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password_hash: { type: String, required: true, select: false },
    telefono: String,
    cedis_id: { type: String, index: true },
    vehiculo_placa: String,
    calificacion_promedio: { type: Number, default: 0 },
    ubicacion_actual: { lat: Number, lng: Number },
    estado: { type: String, default: "activo" },
    last_login: Date,
  },
  { timestamps: { createdAt: "created_at" } }
);

export const Driver = model<IDriver>("Driver", DriverSchema);
