import { Router, Request, Response } from "express";
import { auth, requireRole, AuthRequest } from "../middleware/auth";
import { Driver } from "../models/Driver";
import { DeliveryRoute } from "../models/DeliveryRoute";

const router = Router();
router.use(auth);

// ── ADMIN ─────────────────────────────────────────────────────────────────────

// Listar drivers
router.get("/", requireRole("admin"), async (req: Request, res: Response) => {
  const { cedis_id, estado } = req.query;
  const filter: Record<string, unknown> = {};
  if (cedis_id) filter.cedis_id = cedis_id;
  if (estado) filter.estado = estado;
  const drivers = await Driver.find(filter);
  res.json(drivers);
});

// Crear ruta de entrega para un driver
router.post("/routes", requireRole("admin"), async (req: Request, res: Response) => {
  const route = await DeliveryRoute.create(req.body);
  res.status(201).json(route);
});

// Ver rutas activas
router.get("/routes", requireRole("admin"), async (req: Request, res: Response) => {
  const { cedis_id, fecha } = req.query;
  const filter: Record<string, unknown> = {};
  if (cedis_id) filter.cedis_id = cedis_id;
  if (fecha) filter.fecha = { $gte: new Date(fecha as string) };
  const routes = await DeliveryRoute.find(filter)
    .populate("driver_id", "nombre telefono vehiculo_placa")
    .sort({ fecha: -1 });
  res.json(routes);
});

// ── DRIVER ────────────────────────────────────────────────────────────────────

// Mis rutas del día
router.get("/my-routes", requireRole("driver"), async (req: AuthRequest, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const routes = await DeliveryRoute.find({
    driver_id: req.userId,
    fecha: { $gte: today },
  }).sort({ fecha: 1 });
  res.json(routes);
});

// Actualizar estado de una parada
router.patch("/routes/:id/parada/:stop_number", requireRole("driver"), async (req: AuthRequest, res: Response) => {
  const { status, coords } = req.body;
  const route = await DeliveryRoute.findOneAndUpdate(
    { _id: req.params.id, "paradas.stop_number": Number(req.params.stop_number) },
    {
      $set: {
        "paradas.$.status": status,
        "paradas.$.llegada_real": new Date(),
        "paradas.$.coords": coords,
      },
    },
    { new: true }
  );
  if (!route) {
    res.status(404).json({ error: "Ruta no encontrada" });
    return;
  }
  res.json(route);
});

export default router;
