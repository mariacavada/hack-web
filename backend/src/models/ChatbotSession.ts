import { Schema, model, Document, Types } from "mongoose";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface IChatbotSession extends Document {
  user_id: Types.ObjectId;
  order_id: Types.ObjectId | null;
  messages: Message[];
  context: Record<string, unknown>;
  started_at: Date;
  ended_at: Date | null;
}

const ChatbotSessionSchema = new Schema<IChatbotSession>({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  order_id: { type: Schema.Types.ObjectId, ref: "Order", default: null },
  messages: [
    {
      role: { type: String, enum: ["user", "assistant"], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  context: { type: Schema.Types.Mixed, default: {} },
  started_at: { type: Date, default: Date.now },
  ended_at: { type: Date, default: null },
});

export const ChatbotSession = model<IChatbotSession>("ChatbotSession", ChatbotSessionSchema);
