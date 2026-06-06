import { Router, Request, Response } from "express";
import { auth, requireRole, AuthRequest } from "../middleware/auth";
import { DemandForecast } from "../models/DemandForecast";
import { StockPredict } from "../models/StockPredict";
import { OrderPattern } from "../models/OrderPattern";
import { MetricaML } from "../models/MetricaML";
import { DashCache } from "../models/DashCache";
import { Types } from "mongoose";

const router = Router();
router.use(auth);

// ── ADMIN ─────────────────────────────────────────────────────────────────────

// Predicciones de demanda por cedis/sku
router.get("/demand", requireRole("admin"), async (req: Request, res: Response) => {
  const { cedis_id, sku } = req.query;
  const filter: Record<string, unknown> = { valid_hasta: { $gte: new Date() } };
  if (cedis_id) filter.cedis_id = cedis_id;
  if (sku) filter.sku = sku;
  const forecasts = await DemandForecast.find(filter).sort({ confianza: -1 });
  res.json(forecasts);
});

// Guardar predicción de demanda (llamado desde servicio ML)
router.post("/demand", requireRole("admin"), async (req: Request, res: Response) => {
  const forecast = await DemandForecast.create(req.body);
  res.status(201).json(forecast);
});

// Predicciones de stock
router.get("/stock-predict", requireRole("admin"), async (req: Request, res: Response) => {
  const { cedis_id, nivel_alerta } = req.query;
  const filter: Record<string, unknown> = {};
  if (cedis_id) filter.cedis_id = cedis_id;
  if (nivel_alerta) filter.nivel_alerta = nivel_alerta;
  const predictions = await StockPredict.find(filter).sort({ dias_estimados_agotamiento: 1 });
  res.json(predictions);
});

// Upsert predicción de stock (llamado desde servicio ML)
router.post("/stock-predict", requireRole("admin"), async (req: Request, res: Response) => {
  const { cedis_id, sku, ...data } = req.body;
  const doc = await StockPredict.findOneAndUpdate(
    { cedis_id, sku },
    { cedis_id, sku, ...data },
    { upsert: true, new: true }
  );
  res.json(doc);
});

// Métricas de modelos ML
router.get("/metricas", requireRole("admin"), async (req: Request, res: Response) => {
  const { modelo } = req.query;
  const filter: Record<string, unknown> = {};
  if (modelo) filter.modelo = modelo;
  const metricas = await MetricaML.find(filter).sort({ fecha: -1 }).limit(100);
  res.json(metricas);
});

// Guardar métricas de un modelo
router.post("/metricas", requireRole("admin"), async (req: Request, res: Response) => {
  const metrica = await MetricaML.create(req.body);
  res.status(201).json(metrica);
});

// Dashboard cache (get o refresh)
router.get("/dash-cache/:tipo", requireRole("admin"), async (req: Request, res: Response) => {
  const cedis_id = String(req.query.cedis_id ?? "global");
  const cache = await DashCache.findOne({ tipo: String(req.params.tipo), cedis_id });
  if (!cache) {
    res.status(404).json({ error: "Cache no disponible aún" });
    return;
  }
  res.json(cache);
});

router.put("/dash-cache/:tipo", requireRole("admin"), async (req: Request, res: Response) => {
  const { cedis_id = "global", datos } = req.body;
  const cache = await DashCache.findOneAndUpdate(
    { tipo: req.params.tipo, cedis_id },
    { datos },
    { upsert: true, new: true }
  );
  res.json(cache);
});

// ── CUSTOMER ──────────────────────────────────────────────────────────────────

// Patrones de reorden propios del customer
router.get("/my-patterns", async (req: AuthRequest, res: Response) => {
  const patterns = await OrderPattern.find({
    customer_id: new Types.ObjectId(req.userId),
  }).sort({ proximo_reorden: 1 });
  res.json(patterns);
});

export default router;
