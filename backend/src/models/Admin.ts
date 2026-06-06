import { Schema, model, Document } from "mongoose";

export interface IAdmin extends Document {
  nombre: string;
  email: string;
  password_hash: string;
  nivel: string;
  cedis_asignados: string[];
  permisos: string[];
  last_login: Date;
  created_at: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password_hash: { type: String, required: true, select: false },
    nivel: { type: String, default: "operador" },
    cedis_asignados: [String],
    permisos: [String],
    last_login: Date,
  },
  { timestamps: { createdAt: "created_at" } }
);

export const Admin = model<IAdmin>("Admin", AdminSchema);
