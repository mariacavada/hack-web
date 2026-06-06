import { Router, Response } from "express";
import { auth, AuthRequest } from "../middleware/auth";
import { User } from "../models/User";

const router = Router();
router.use(auth);

// Mi perfil
router.get("/me", async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.userId);
  res.json(user);
});

// Actualizar dirección o preferencias
router.patch("/me", async (req: AuthRequest, res: Response) => {
  const allowed = ["phone", "address", "notification_prefs", "vehicle"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }
  const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
  res.json(user);
});

// Actualizar ubicación (repartidor)
router.patch("/me/location", async (req: AuthRequest, res: Response) => {
  const { lat, lng } = req.body;
  await User.findByIdAndUpdate(req.userId, { current_location: { lat, lng } });
  res.json({ ok: true });
});

// Perfil de sustituciones del usuario
router.get("/me/substitution-profile", async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.userId).select("substitution_profile purchase_patterns");
  res.json(user);
});

export default router;
