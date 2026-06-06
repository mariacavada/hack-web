import { Router, Response } from "express";
import { auth, AuthRequest } from "../middleware/auth";
import { Notification } from "../models/Notification";
import { Types } from "mongoose";

const router = Router();
router.use(auth);

// Mis notificaciones
router.get("/", async (req: AuthRequest, res: Response) => {
  const notifications = await Notification.find({
    customer_id: new Types.ObjectId(req.userId),
  })
    .sort({ created_at: -1 })
    .limit(50);
  res.json(notifications);
});

// Marcar como leída
router.patch("/:id/read", async (req: AuthRequest, res: Response) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, customer_id: new Types.ObjectId(req.userId) },
    { estado: "leida" }
  );
  res.json({ ok: true });
});

// Marcar todas como leídas
router.patch("/read-all", async (req: AuthRequest, res: Response) => {
  await Notification.updateMany(
    { customer_id: new Types.ObjectId(req.userId), estado: { $ne: "leida" } },
    { estado: "leida" }
  );
  res.json({ ok: true });
});

export default router;
