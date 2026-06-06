import { Schema, model, Document, Types } from "mongoose";

export interface IAuthSession extends Document {
  rol: "customer" | "admin" | "driver";
  ref_id: Types.ObjectId;
  jwt_token: string;
  refresh_token: string;
  expires_at: Date;
  created_at: Date;
}

const AuthSessionSchema = new Schema<IAuthSession>(
  {
    rol: { type: String, enum: ["customer", "admin", "driver"], required: true },
    ref_id: { type: Schema.Types.ObjectId, required: true, index: true },
    jwt_token: { type: String },
    refresh_token: String,
    expires_at: { type: Date, required: true },
  },
  { timestamps: { createdAt: "created_at" } }
);

AuthSessionSchema.index({ jwt_token: 1 }, { unique: true, sparse: true });

export const AuthSession = model<IAuthSession>("AuthSession", AuthSessionSchema);
