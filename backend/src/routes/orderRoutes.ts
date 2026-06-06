import { Router, Response } from "express";
import { auth, requireRole, AuthRequest } from "../middleware/auth";
import { Order } from "../models/Order";
import { OrderDetail } from "../models/OrderDetail";
import { Resultado } from "../models/Resultado";
import { TrackingPedido } from "../models/TrackingPedido";
import { Notification } from "../models/Notification";
import { Types } from "mongoose";

const router = Router();
router.use(auth);

// ── CUSTOMER ──────────────────────────────────────────────────────────────────

// Crear pedido con sus líneas
router.post("/", async (req: AuthRequest, res: Response) => {
  const { items = [], ...orderData } = req.body;
  const order = await Order.create({
    ...orderData,
    customer_id: req.userId,
    status_final: "pendiente",
  });

  if (items.length > 0) {
    const details = items.map((item: any) => ({
      ...item,
      id_pedido: order.id_pedido || order._id.toString(),
    }));
    await OrderDetail.insertMany(details);
  }

  await TrackingPedido.create({
    id_pedido: order.id_pedido || order._id.toString(),
    customer_id: new Types.ObjectId(req.userId),
    status_actual: "pendiente",
    eventos: [{ status: "pendiente", descripcion: "Pedido recibido", timestamp: new Date() }],
  });

  res.status(201).json(order);
});

// Mis pedidos con tracking
router.get("/my", async (req: AuthRequest, res: Response) => {
  const orders = await Order.find({ customer_id: req.userId }).sort({ created_at: -1 });
  res.json(orders);
});

// Detalle de un pedido + líneas + tracking
router.get("/:id", async (req: AuthRequest, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404).json({ error: "Pedido no encontrado" });
    return;
  }
  const pedidoId = order.id_pedido || order._id.toString();
  const [details, tracking] = await Promise.all([
    OrderDetail.find({ id_pedido: pedidoId }),
    TrackingPedido.findOne({ id_pedido: pedidoId }),
  ]);
  res.json({ order, details, tracking });
});

// Responder a sustitución (acepta/rechaza cambio de SKU)
router.patch("/:id/resultado/:id_linea", async (req: AuthRequest, res: Response) => {
  const { respuesta } = req.body; // "aceptado" | "rechazado"
  const resultado = await Resultado.findOneAndUpdate(
    { id_pedido: req.params.id, id_linea: req.params.id_linea },
    { respuesta_cliente: respuesta, notificado_al_cliente: true },
    { new: true }
  );
  if (!resultado) {
    res.status(404).json({ error: "Resultado no encontrado" });
    return;
  }
  res.json(resultado);
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────

// Ver todos los pedidos
router.get("/", requireRole("admin"), async (_req: AuthRequest, res: Response) => {
  const orders = await Order.find().sort({ created_at: -1 });
  res.json(orders);
});

// Confirmar pedido
router.patch("/:id/confirm", requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status_final: "confirmado" },
    { new: true }
  );
  if (!order) {
    res.status(404).json({ error: "Pedido no encontrado" });
    return;
  }

  const pedidoId = order.id_pedido || order._id.toString();
  await TrackingPedido.findOneAndUpdate(
    { id_pedido: pedidoId },
    {
      status_actual: "confirmado",
      $push: { eventos: { status: "confirmado", descripcion: "Pedido confirmado", timestamp: new Date() } },
    }
  );

  await Notification.create({
    customer_id: new Types.ObjectId(order.customer_id),
    id_pedido: pedidoId,
    tipo: "order_status",
    titulo: "Pedido confirmado",
    mensaje: "Tu pedido fue confirmado y se está preparando.",
    prioridad: "media",
  });

  res.json(order);
});

// Asignar driver
router.patch("/:id/assign", requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const { driver_id } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status_final: "asignado", driver_id },
    { new: true }
  );
  if (!order) {
    res.status(404).json({ error: "Pedido no encontrado" });
    return;
  }
  await TrackingPedido.findOneAndUpdate(
    { id_pedido: order.id_pedido || order._id.toString() },
    {
      status_actual: "asignado",
      $push: { eventos: { status: "asignado", descripcion: "Driver asignado", timestamp: new Date() } },
    }
  );
  res.json(order);
});

// ── DRIVER ────────────────────────────────────────────────────────────────────

// Ver pedidos asignados al driver
router.get("/assigned/me", requireRole("driver"), async (req: AuthRequest, res: Response) => {
  const orders = await Order.find({
    driver_id: new Types.ObjectId(req.userId),
    status_final: { $in: ["asignado", "en_camino"] },
  });
  res.json(orders);
});

// Actualizar estado del pedido
router.patch("/:id/status", requireRole("driver"), async (req: AuthRequest, res: Response) => {
  const { status_final, notas, coords } = req.body;
  const allowed: string[] = ["en_camino", "entregado", "incompleto"];
  if (!allowed.includes(status_final)) {
    res.status(400).json({ error: "Estado inválido" });
    return;
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status_final },
    { new: true }
  );
  if (!order) {
    res.status(404).json({ error: "Pedido no encontrado" });
    return;
  }

  const pedidoId = order.id_pedido || order._id.toString();
  const descripcion: Record<string, string> = {
    en_camino: "El driver está en camino",
    entregado: "Pedido entregado",
    incompleto: "Pedido entregado con diferencias",
  };

  await TrackingPedido.findOneAndUpdate(
    { id_pedido: pedidoId },
    {
      status_actual: status_final,
      localizacion_actual: coords || null,
      $push: {
        eventos: {
          status: status_final,
          descripcion: notas || descripcion[status_final],
          timestamp: new Date(),
          coords: coords || undefined,
        },
      },
    }
  );

  await Notification.create({
    customer_id: new Types.ObjectId(order.customer_id),
    id_pedido: pedidoId,
    tipo: "order_status",
    titulo: descripcion[status_final],
    mensaje: notas || descripcion[status_final],
    prioridad: "alta",
  });

  res.json(order);
});

export default router;
