import { Router, Request, Response } from "express";
import { auth, requireRole, AuthRequest } from "../middleware/auth";
import { Product } from "../models/Product";

const router = Router();
router.use(auth);

// Buscar productos disponibles (todos los roles)
router.get("/", async (req: Request, res: Response) => {
  const { cedis, q } = req.query;
  const filter: Record<string, unknown> = { is_available: true };
  if (cedis) filter.cedis = cedis;
  if (q) filter.name = { $regex: q, $options: "i" };
  const products = await Product.find(filter).select("-depletion_prediction");
  res.json(products);
});

// Ver un producto con sus sustitutos
router.get("/:sku", async (req: Request, res: Response) => {
  const product = await Product.findOne({ sku: req.params.sku });
  if (!product) { res.status(404).json({ error: "Producto no encontrado" }); return; }
  res.json(product);
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────

// Ver stock bajo (para notificación admin)
router.get("/admin/low-stock", requireRole("admin"), async (_req: AuthRequest, res: Response) => {
  const products = await Product.find({
    $expr: { $lte: ["$stock", "$low_stock_threshold"] },
  });
  res.json(products);
});

// Ver probabilidad de agotamiento
router.get("/admin/depletion-risk", requireRole("admin"), async (_req: AuthRequest, res: Response) => {
  const products = await Product.find({ "depletion_prediction.probability_out_of_stock": { $gte: 0.6 } })
    .sort({ "depletion_prediction.probability_out_of_stock": -1 });
  res.json(products);
});

// Actualizar stock
router.patch("/:sku/stock", requireRole("admin"), async (req: Request, res: Response) => {
  const product = await Product.findOneAndUpdate(
    { sku: req.params.sku },
    { stock: req.body.stock, is_available: req.body.stock > 0 },
    { new: true }
  );
  res.json(product);
});

// Crear producto
router.post("/", requireRole("admin"), async (req: Request, res: Response) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

export default router;
