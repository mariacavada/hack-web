import { Schema, model, Document, Types } from "mongoose";

export type NotificationType =
  | "product_unavailable"
  | "reorder_reminder"
  | "substitution_suggestion"
  | "order_status"
  | "low_stock"
  | "depletion_alert";

export interface INotification extends Document {
  user_id: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  read: boolean;
  sent_at: Date;
  channel: "push" | "sms" | "in_app" | "elevenlabs_call";
}

const NotificationSchema = new Schema<INotification>({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: {
    type: String,
    enum: ["product_unavailable", "reorder_reminder", "substitution_suggestion", "order_status", "low_stock", "depletion_alert"],
    required: true,
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  read: { type: Boolean, default: false },
  sent_at: { type: Date, default: Date.now },
  channel: { type: String, enum: ["push", "sms", "in_app", "elevenlabs_call"], default: "in_app" },
});

NotificationSchema.index({ user_id: 1, read: 1, sent_at: -1 });

export const Notification = model<INotification>("Notification", NotificationSchema);
