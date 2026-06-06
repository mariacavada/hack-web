import { Router, Request, Response } from "express";
import { auth, requireRole, AuthRequest } from "../middleware/auth";
import { Product } from "../models/Product";
import { InventarioCedis } from "../models/InventarioCedis";
import { StockPredict } from "../models/StockPredict";

const router = Router();
router.use(auth);

// Buscar productos
router.get("/", async (req: Request, res: Response) => {
  const { q, categoria, id_businessunit } = req.query;
  const filter: Record<string, unknown> = { estado: "activo" };
  if (q) filter.nombre = { $regex: q, $options: "i" };
  if (categoria) filter.categoria = categoria;
  if (id_businessunit) filter.id_businessunit = Number(id_businessunit);
  const products = await Product.find(filter);
  res.json(products);
});

// Ver un producto con su inventario por cedis
router.get("/:sku", async (req: Request, res: Response) => {
  const product = await Product.findOne({ sku: req.params.sku });
  if (!product) {
    res.status(404).json({ error: "Producto no encontrado" });
    return;
  }
  const inventario = await InventarioCedis.find({ sku: req.params.sku });
  res.json({ product, inventario });
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────

// Stock bajo por cedis
router.get("/admin/low-stock", requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const { cedis_id } = req.query;
  const filter: Record<string, unknown> = {
    $expr: { $lte: ["$stock_disponible", "$stock_minimo"] },
  };
  if (cedis_id) filter.cedis_id = cedis_id;
  const items = await InventarioCedis.find(filter).sort({ stock_disponible: 1 });
  res.json(items);
});

// Alertas de stock crítico (ML)
router.get("/admin/stock-alerts", requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const { cedis_id } = req.query;
  const filter: Record<string, unknown> = { nivel_alerta: { $in: ["bajo", "critico"] } };
  if (cedis_id) filter.cedis_id = cedis_id;
  const alerts = await StockPredict.find(filter).sort({ dias_estimados_agotamiento: 1 });
  res.json(alerts);
});

// Crear producto
router.post("/", requireRole("admin"), async (req: Request, res: Response) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

// Actualizar producto
router.patch("/:sku", requireRole("admin"), async (req: Request, res: Response) => {
  const product = await Product.findOneAndUpdate(
    { sku: req.params.sku },
    { ...req.body },
    { new: true }
  );
  if (!product) {
    res.status(404).json({ error: "Producto no encontrado" });
    return;
  }
  res.json(product);
});

export default router;
