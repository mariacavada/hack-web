import { Router, Request, Response } from "express";
import { auth, requireRole, AuthRequest } from "../middleware/auth";
import { Cedis } from "../models/Cedis";
import { InventarioCedis } from "../models/InventarioCedis";
import { InventoryMvt } from "../models/InventoryMvt";

const router = Router();
router.use(auth);

// Listar todos los cedis
router.get("/", async (_req: Request, res: Response) => {
  const cedis = await Cedis.find({ estado: "activo" });
  res.json(cedis);
});

// Detalle de un cedis
router.get("/:cedis_id", async (req: Request, res: Response) => {
  const cedis = await Cedis.findOne({ cedis_id: req.params.cedis_id });
  if (!cedis) {
    res.status(404).json({ error: "CEDIS no encontrado" });
    return;
  }
  res.json(cedis);
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────

// Crear cedis
router.post("/", requireRole("admin"), async (req: Request, res: Response) => {
  const cedis = await Cedis.create(req.body);
  res.status(201).json(cedis);
});

// Inventario completo de un cedis
router.get("/:cedis_id/inventario", requireRole("admin"), async (req: Request, res: Response) => {
  const inventario = await InventarioCedis.find({ cedis_id: req.params.cedis_id });
  res.json(inventario);
});

// Actualizar stock de un SKU en un cedis
router.patch("/:cedis_id/inventario/:sku", requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const { stock_disponible, motivo } = req.body;
  const inv = await InventarioCedis.findOne({
    cedis_id: req.params.cedis_id,
    sku: req.params.sku,
  });
  if (!inv) {
    res.status(404).json({ error: "Inventario no encontrado" });
    return;
  }

  const stock_antes = inv.stock_disponible;
  inv.stock_disponible = stock_disponible;
  inv.ultima_entrada = new Date();
  await inv.save();

  await InventoryMvt.create({
    cedis_id: String(req.params.cedis_id),
    sku: String(req.params.sku),
    tipo_movimiento: stock_disponible > stock_antes ? "entrada" : "ajuste",
    cantidad: Math.abs(stock_disponible - stock_antes),
    stock_antes,
    stock_despues: stock_disponible,
    motivo: motivo || "ajuste_manual",
  });

  res.json(inv);
});

// Movimientos de inventario
router.get("/:cedis_id/movimientos", requireRole("admin"), async (req: Request, res: Response) => {
  const { sku } = req.query;
  const filter: Record<string, unknown> = { cedis_id: req.params.cedis_id };
  if (sku) filter.sku = sku;
  const mvts = await InventoryMvt.find(filter).sort({ timestamp: -1 }).limit(200);
  res.json(mvts);
});

export default router;
