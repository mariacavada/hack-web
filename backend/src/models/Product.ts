import { Schema, model, Document } from "mongoose";

export interface IProduct extends Document {
  sku: string;
  nombre: string;
  linea: string;
  id_businessunit: number;
  categoria: string;
  presentacion: string;
  precio_unitario: number;
  sustitutos_compatibles: string[];
  estado: string;
  updated_at: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    sku: { type: String, required: true, unique: true },
    nombre: { type: String, required: true },
    linea: String,
    id_businessunit: Number,
    categoria: String,
    presentacion: String,
    precio_unitario: { type: Number, required: true, default: 0 },
    sustitutos_compatibles: [String],
    estado: { type: String, default: "activo" },
  },
  { timestamps: { updatedAt: "updated_at" } }
);

ProductSchema.index({ categoria: 1, estado: 1 });
ProductSchema.index({ id_businessunit: 1 });

export const Product = model<IProduct>("Product", ProductSchema);
