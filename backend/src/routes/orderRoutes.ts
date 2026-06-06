import { Router, Response } from "express";
import { auth, requireRole, AuthRequest } from "../middleware/auth";
import { Order } from "../models/Order";
import { Notification } from "../models/Notification";
import { SubstitutionLog } from "../models/SubstitutionLog";
import { User } from "../models/User";

const router = Router();
router.use(auth);

// ── USUARIO ──────────────────────────────────────────────────────────────────

// Crear pedido
router.post("/", async (req: AuthRequest, res: Response) => {
  const order = await Order.create({ ...req.body, customer_id: req.userId, status: "pendiente" });
  res.status(201).json(order);
});

// Ver mis pedidos + tracking
router.get("/my", async (req: AuthRequest, res: Response) => {
  const orders = await Order.find({ customer_id: req.userId }).sort({ created_at: -1 });
  res.json(orders);
});

// Detalle de un pedido (tracking tipo Amazon)
router.get("/:id", async (req: AuthRequest, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404).json({ error: "Pedido no encontrado" }); return; }
  res.json(order);
});

// Aceptar o rechazar sustitución
router.patch("/:id/substitution/:sku", async (req: AuthRequest, res: Response) => {
  const { accepted } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404).json({ error: "Pedido no encontrado" }); return; }

  const item = order.items.find((i) => i.sku === req.params.sku || i.substitution?.substitute_sku === req.params.sku);
  if (!item?.substitution) { res.status(404).json({ error: "Sustitución no encontrada" }); return; }

  item.substitution.accepted_by_user = accepted;
  await order.save();

  // Actualizar perfil del usuario
  await User.updateOne(
    { _id: req.userId, "substitution_profile.original_sku": item.substitution.original_sku },
    {
      $inc: {
        "substitution_profile.$.preferred_substitutes.$[sub].times_accepted": accepted ? 1 : 0,
        "substitution_profile.$.preferred_substitutes.$[sub].times_rejected": accepted ? 0 : 1,
      },
    },
    { arrayFilters: [{ "sub.sku": item.substitution.substitute_sku }] }
  );

  // Registrar en log para entrenamiento Gemini
  await SubstitutionLog.create({
    order_id: order._id,
    customer_id: req.userId,
    original_sku: item.substitution.original_sku,
    original_name: item.substitution.original_name,
    substitute_sku: item.substitution.substitute_sku,
    substitute_name: item.substitution.substitute_name,
    suggested_by: item.substitution.suggested_by,
    accepted_by_user: accepted,
  });

  res.json({ ok: true });
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────

// Ver todos los pedidos
router.get("/", requireRole("admin"), async (_req: AuthRequest, res: Response) => {
  const orders = await Order.find().populate("customer_id", "name email").sort({ created_at: -1 });
  res.json(orders);
});

// Confirmar pedido
router.patch("/:id/confirm", requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: "confirmado", "tracking.confirmed_at": new Date() },
    { new: true }
  );
  if (!order) { res.status(404).json({ error: "Pedido no encontrado" }); return; }

  await Notification.create({
    user_id: order.customer_id,
    type: "order_status",
    title: "Pedido confirmado",
    body: `Tu pedido fue confirmado y se está preparando.`,
    metadata: { order_id: order._id },
    channel: "in_app",
  });

  res.json(order);
});

// Asignar repartidor
router.patch("/:id/assign", requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const { repartidor_id } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: "asignado", repartidor_id, "tracking.assigned_at": new Date() },
    { new: true }
  );
  res.json(order);
});

// ── REPARTIDOR ────────────────────────────────────────────────────────────────

// Ver pedidos asignados
router.get("/assigned/me", requireRole("repartidor"), async (req: AuthRequest, res: Response) => {
  const orders = await Order.find({ repartidor_id: req.userId, status: { $in: ["asignado", "en_camino"] } })
    .populate("customer_id", "name phone address");
  res.json(orders);
});

// Marcar en camino / entregado / incompleto
router.patch("/:id/status", requireRole("repartidor"), async (req: AuthRequest, res: Response) => {
  const { status, delivery_notes, missing_items_reported } = req.body;
  const allowed = ["en_camino", "entregado", "incompleto"];
  if (!allowed.includes(status)) { res.status(400).json({ error: "Estado inválido" }); return; }

  const timestamps: Record<string, Date> = {};
  if (status === "en_camino") timestamps["tracking.picked_up_at"] = new Date();
  if (status === "entregado" || status === "incompleto") timestamps["tracking.delivered_at"] = new Date();

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status, delivery_notes, missing_items_reported, ...timestamps },
    { new: true }
  );
  if (!order) { res.status(404).json({ error: "Pedido no encontrado" }); return; }

  // Notificar al usuario
  const messages: Record<string, string> = {
    en_camino: "Tu pedido está en camino 🚀",
    entregado: "Tu pedido fue entregado ✅",
    incompleto: "Tu pedido fue entregado con algunas diferencias.",
  };
  await Notification.create({
    user_id: order.customer_id,
    type: "order_status",
    title: messages[status],
    body: delivery_notes || messages[status],
    metadata: { order_id: order._id, missing_items_reported },
    channel: "in_app",
  });

  res.json(order);
});

export default router;
