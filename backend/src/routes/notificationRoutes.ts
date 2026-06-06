import { Router, Response } from "express";
import { auth, AuthRequest } from "../middleware/auth";
import { Notification } from "../models/Notification";

const router = Router();
router.use(auth);

// Mis notificaciones
router.get("/", async (req: AuthRequest, res: Response) => {
  const notifications = await Notification.find({ user_id: req.userId })
    .sort({ sent_at: -1 })
    .limit(50);
  res.json(notifications);
});

// Marcar como leída
router.patch("/:id/read", async (req: AuthRequest, res: Response) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ ok: true });
});

// Marcar todas como leídas
router.patch("/read-all", async (req: AuthRequest, res: Response) => {
  await Notification.updateMany({ user_id: req.userId, read: false }, { read: true });
  res.json({ ok: true });
});

export default router;
