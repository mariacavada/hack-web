import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

/* ── Types ───────────────────────────────────────────────────────────────── */
export interface OrderItem { nombre: string; cantidad: number; sku: string; }
export interface AssignedOrder {
  _id: string;
  id_pedido?: string;
  status_final: string;
  usuario?: { nombre?: string; email?: string; direccion?: string };
  direccion_entrega?: string;
  cliente?: string;
  items?: OrderItem[];
  total?: number;
  assigned_at?: string;
  fecha_pedido?: string;
  fecha_entrega?: string;
  eta_entrega?: string;
  status_actual?: string;
  lat?: number;
  lng?: number;
}

/* ── Status constants (single source of truth) ───────────────────────────── */
export const STATUS_NORMALIZE: Record<string, string> = {
  pendiente:        'Pendiente',
  confirmado:       'Confirmado',
  asignado:         'Asignado',
  en_preparacion:   'En preparación',
  'en preparación': 'En preparación',
  preparando:       'En preparación',
  en_camino:        'En camino',
  'en camino':      'En camino',
  entregado:        'Entregado',
  incompleto:       'Incompleto',
  cancelado:        'Cancelado',
};

export const STATUS_BADGE: Record<string, string> = {
  'Pendiente':      'bg-yellow-100 text-yellow-700',
  'Confirmado':     'bg-blue-100 text-blue-700',
  'Asignado':       'bg-blue-100 text-blue-700',
  'En preparación': 'bg-indigo-100 text-indigo-700',
  'En camino':      'bg-orange-100 text-orange-700',
  'Entregado':      'bg-green-100 text-green-700',
  'Incompleto':     'bg-amber-100 text-amber-700',
  'Cancelado':      'bg-gray-100 text-gray-500',
};

export function normalizeStatus(s?: string): string {
  if (!s) return 'Pendiente';
  const low = s.toLowerCase();
  return STATUS_NORMALIZE[low] ?? STATUS_NORMALIZE[low.replace(/\s+/g, '_')] ?? s;
}

const todayStr = new Date().toDateString();
export function isToday(o: AssignedOrder): boolean {
  const d = o.fecha_pedido ?? o.assigned_at ?? o.fecha_entrega;
  if (!d) return true;
  return new Date(d).toDateString() === todayStr;
}

/* ── Parser ──────────────────────────────────────────────────────────────── */
interface DriverOrderResponse {
  order?: Record<string, any>;
  detalles?: Record<string, any>[];
  tracking?: { status_actual?: string; eta_entrega?: string };
}

export function parseDriverOrders(raw: any): AssignedOrder[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: DriverOrderResponse | AssignedOrder) => {
    if ('order' in item && item.order) {
      const o   = item.order as Record<string, any>;
      const det = (item.detalles ?? []) as Record<string, any>[];
      const trk = (item as DriverOrderResponse).tracking ?? {};
      return {
        _id:               o._id ?? o.id_pedido,
        id_pedido:         o.id_pedido,
        status_final:      normalizeStatus(o.status_final ?? trk.status_actual),
        usuario:           o.usuario ?? o.customer ?? null,
        direccion_entrega: o.direccion_entrega ?? o.direccion ?? o.usuario?.direccion ?? null,
        total:             o.total ?? o.subtotal,
        assigned_at:       o.assigned_at ?? undefined,
        fecha_pedido:      o.fecha_pedido ?? o.created_at ?? undefined,
        fecha_entrega:     o.fecha_entrega ?? undefined,
        eta_entrega:       trk.eta_entrega ?? undefined,
        status_actual:     trk.status_actual ?? undefined,
        items: det.map(d => ({
          sku:      d.sku_solicitado ?? d.sku ?? '',
          nombre:   d.nombre_sku_solicitado ?? d.nombre ?? d.sku_solicitado ?? 'Producto',
          cantidad: d.quantity ?? d.cantidad ?? 1,
        })),
      } satisfies AssignedOrder;
    }
    const o = item as any;
    const rawDet: any[] = o.detalles ?? o.items ?? [];
    return {
      _id:               o._id ?? o.id_pedido,
      id_pedido:         o.id_pedido,
      status_final:      normalizeStatus(o.status_final ?? o.tracking?.status_actual),
      usuario:           o.usuario ?? null,
      direccion_entrega: o.direccion_entrega ?? o.direccion ?? null,
      total:             o.total ?? o.subtotal,
      assigned_at:       o.assigned_at ?? undefined,
      fecha_pedido:      o.fecha_pedido ?? o.created_at ?? undefined,
      fecha_entrega:     o.fecha_entrega ?? undefined,
      eta_entrega:       o.tracking?.eta_entrega ?? undefined,
      items: rawDet.map(d => ({
        sku:      d.sku_solicitado ?? d.sku ?? '',
        nombre:   d.nombre_sku_solicitado ?? d.nombre ?? d.sku_solicitado ?? 'Producto',
        cantidad: d.quantity ?? d.cantidad ?? 1,
      })),
    } satisfies AssignedOrder;
  });
}

/* ── Context ─────────────────────────────────────────────────────────────── */
interface Ctx {
  orders:       AssignedOrder[];
  loading:      boolean;
  updateStatus: (orderId: string, newStatus: string) => void;
  refresh:      () => void;
}

const RepartidorCtx = createContext<Ctx>({
  orders: [], loading: true, updateStatus: () => {}, refresh: () => {},
});

export function RepartidorProvider({ children }: { children: ReactNode }) {
  const [orders,  setOrders]  = useState<AssignedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    const token = localStorage.getItem('or_token');
    if (!token) { setLoading(false); return; }
    setLoading(true);
    fetch(`${API}/api/driver/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const raw = Array.isArray(data) ? data : (data?.orders ?? []);
        setOrders(parseDriverOrders(raw));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchOrders, []);

  const updateStatus = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o =>
      o._id === orderId ? { ...o, status_final: normalizeStatus(newStatus) } : o
    ));
  };

  return (
    <RepartidorCtx.Provider value={{ orders, loading, updateStatus, refresh: fetchOrders }}>
      {children}
    </RepartidorCtx.Provider>
  );
}

export function useRepartidor() { return useContext(RepartidorCtx); }
