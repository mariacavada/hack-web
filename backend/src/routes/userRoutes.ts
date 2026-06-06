import { Router, Response } from "express";
import { auth, AuthRequest } from "../middleware/auth";
import { Customer } from "../models/Customer";
import { Driver } from "../models/Driver";
import { Admin } from "../models/Admin";
import { OrderPattern } from "../models/OrderPattern";

const router = Router();
router.use(auth);

function getModel(rol?: string) {
  if (rol === "driver") return Driver;
  if (rol === "admin") return Admin;
  return Customer;
}

// Mi perfil
router.get("/me", async (req: AuthRequest, res: Response) => {
  const Model = getModel(req.userRol) as any;
  const doc = await Model.findById(req.userId);
  if (!doc) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }
  res.json({ ...doc.toObject(), rol: req.userRol });
});

// Actualizar perfil
router.patch("/me", async (req: AuthRequest, res: Response) => {
  const Model = getModel(req.userRol) as any;
  const allowed =
    req.userRol === "customer"
      ? ["telefono", "preferencias_notificacion", "patrones_preferencia", "nombre_negocio"]
      : req.userRol === "driver"
      ? ["telefono", "vehiculo_placa", "estado"]
      : ["telefono"];

  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }
  const doc = await Model.findByIdAndUpdate(req.userId, update, { new: true });
  res.json(doc);
});

// Actualizar ubicación (driver)
router.patch("/me/location", async (req: AuthRequest, res: Response) => {
  if (req.userRol !== "driver") {
    res.status(403).json({ error: "Solo disponible para drivers" });
    return;
  }
  const { lat, lng } = req.body;
  await Driver.findByIdAndUpdate(req.userId, { ubicacion_actual: { lat, lng } });
  res.json({ ok: true });
});

// Patrones de reorden del customer (para predicciones ML)
router.get("/me/order-patterns", async (req: AuthRequest, res: Response) => {
  if (req.userRol !== "customer") {
    res.status(403).json({ error: "Solo disponible para customers" });
    return;
  }
  const patterns = await OrderPattern.find({ customer_id: req.userId }).sort({ proximo_reorden: 1 });
  res.json(patterns);
});

export default router;
