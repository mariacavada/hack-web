import { Schema, model, Document } from "mongoose";

export interface ICedis extends Document {
  cedis_id: string;
  nombre: string;
  pais: string;
  ciudad: string;
  direccion: string;
  telefono: string;
  id_businessunit: number;
  estado: string;
  created_at: Date;
}

const CedisSchema = new Schema<ICedis>(
  {
    cedis_id: { type: String, required: true, unique: true },
    nombre: String,
    pais: String,
    ciudad: String,
    direccion: String,
    telefono: String,
    id_businessunit: Number,
    estado: { type: String, default: "activo" },
  },
  { timestamps: { createdAt: "created_at" } }
);

export const Cedis = model<ICedis>("Cedis", CedisSchema);
