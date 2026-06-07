import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';

const ADMIN_PATH_TAB: Record<string, 'pedidos' | 'inventario'> = {
  '/admin/predicciones': 'inventario',
  '/admin/analiticas':   'inventario',
};

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

interface OrderItem {
  nombre?: string;
  name?: string;
  sku?: string;
  cantidad?: number;
  quantity?: number;
  precio_unitario?: number;
  precio?: number;
  subtotal?: number;
}

interface Order {
  _id: string;
  id_pedido?: string;
  status_final: string;
  total?: number;
  subtotal?: number;
  SubTotal?: number;
  createdAt?: string;
  created_at?: string;
  fecha_pedido?: string;
  direccion_entrega?: string;
  direccion?: string;
  notas?: string;
  notes?: string;
  nombre_negocio?: string;
  customer_id?: string;
  usuario?: { _id?: string; nombre?: string; email?: string };
  repartidor?: { nombre?: string };
  items?: OrderItem[];
  tracking?: { status: string; timestamp: string }[];
}

interface Stats {
  total:          number;
  hoy:            number;
  activos:        number;
  pendientes:     number;
  entregados:     number;
  cancelados:     number;
  nivel_servicio: number;
  revenue_total:  number;
}

interface LowStockItem {
  sku: string;
  nombre?: string;
  stock_actual?: number;
  stock_minimo?: number;
  cedis_id?: string;
}

interface RiskItem {
  sku: string;
  nombre?: string;
  nivel?: string;
  probabilidad?: number;
  horas_estimadas?: number;
}

const STATUS_BADGE: Record<string, string> = {
  'recibido':        'bg-yellow-100 text-yellow-700',
  'preparando':      'bg-indigo-100 text-indigo-700',
  'en camino':       'bg-orange-100 text-orange-700',
  'entregado':       'bg-green-100 text-green-700',
  'cancelado':       'bg-red-100 text-red-700',
  // capitalizado por si acaso
  'Recibido':        'bg-yellow-100 text-yellow-700',
  'Preparando':      'bg-indigo-100 text-indigo-700',
  'En camino':       'bg-orange-100 text-orange-700',
  'Entregado':       'bg-green-100 text-green-700',
  'Cancelado':       'bg-red-100 text-red-700',
  // aliases legacy
  'pendiente':       'bg-yellow-100 text-yellow-700',
  'confirmado':      'bg-blue-100 text-blue-700',
};


export default function AdminPage() {
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerMap, setCustomerMap] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [riskItems, setRiskItems] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pedidos' | 'inventario'>(
    ADMIN_PATH_TAB[location.pathname] ?? 'pedidos'
  );
  const [statusFilter,   setStatusFilter]   = useState('');
  const [selectedOrder,  setSelectedOrder]  = useState<Order | null>(null);
  const [detailOrder,    setDetailOrder]    = useState<Order | null>(null);
  const [detailLoading,  setDetailLoading]  = useState(false);

  useEffect(() => {
    setActiveTab(ADMIN_PATH_TAB[location.pathname] ?? 'pedidos');
  }, [location.pathname]);

  const token = localStorage.getItem('or_token') ?? '';
  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    const tk = localStorage.getItem('or_token') ?? '';
    const headers = { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' };
    Promise.all([
      fetch(`${API}/api/admin/orders?limit=500`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/admin/users?limit=500`,  { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/admin/stats`,            { headers }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/admin/inventory/low-stock?cedis_id=3012`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/admin/inventory/depletion-risk?nivel=critico`, { headers }).then(r => r.ok ? r.json() : []),
    ])
      .then(([o, u, st, ls, ri]) => {
        const rawOrders: any[] = Array.isArray(o) ? o : o?.orders ?? [];
        const rawUsers: any[]  = Array.isArray(u) ? u : u?.users ?? [];
        const map: Record<string, string> = {};
        rawUsers.forEach((usr: any) => {
          if (usr._id) map[usr._id] = usr.nombre_negocio ?? usr.nombre ?? usr.name ?? usr.email ?? usr._id;
        });
        setCustomerMap(map);
        setStats(st ?? null);
        setOrders(rawOrders.map(r => ({
          ...r,
          items: (r.items ?? []).map((it: any) => ({
            nombre:          it.nombre ?? it.name ?? it.sku ?? 'Producto',
            cantidad:        it.cantidad ?? it.quantity ?? 1,
            precio_unitario: it.precio_unitario ?? it.precio ?? it.price,
            sku:             it.sku,
          })),
        })));
        setLowStock(Array.isArray(ls) ? ls : ls?.items ?? []);
        setRiskItems(Array.isArray(ri) ? ri : ri?.items ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);


  const displayed = statusFilter
    ? orders.filter(o => o.status_final?.toLowerCase() === statusFilter.toLowerCase())
    : orders;


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#E61A27] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel de Administrador</h1>
        <p className="text-sm text-gray-400 mt-0.5">Resumen operativo en tiempo real</p>
      </div>

      {/* PEDIDOS */}
      {activeTab === 'pedidos' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

          {/* Stats strip — misma fuente que Analítica y Usuarios */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total pedidos',   value: stats?.total        ?? '—', color: 'text-gray-900'    },
              { label: 'Hoy',             value: stats?.hoy          ?? '—', color: 'text-gray-900'    },
              { label: 'Activos',         value: stats?.activos      ?? '—', color: 'text-blue-600'    },
              { label: 'Entregados',      value: stats?.entregados   ?? '—', color: 'text-green-600'   },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Filter pills */}
          {(() => {
            const FILTERS: { label: string; statuses: string[] }[] = [
              { label: 'Todos',       statuses: [] },
              { label: 'Asignado',    statuses: ['asignado'] },
              { label: 'Entregado',   statuses: ['entregado'] },
              { label: 'Incompleto',  statuses: ['incompleto'] },
              { label: 'Cancelado',   statuses: ['cancelado'] },
            ];
            const activeFilter = FILTERS.find(f =>
              f.statuses.length === 0
                ? statusFilter === ''
                : f.statuses.includes(statusFilter.toLowerCase())
            ) ?? FILTERS[0];

            return (
              <div className="flex items-center gap-2 flex-wrap">
                {FILTERS.map(f => {
                  const isActive = f === activeFilter;
                  return (
                    <button
                      key={f.label}
                      onClick={() => setStatusFilter(f.statuses[0] ?? '')}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
                <span className="ml-auto text-xs text-gray-400">{displayed.length} pedidos</span>
              </div>
            );
          })()}

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_1fr_120px_130px_1fr_32px] px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              <span>Pedido</span>
              <span>Cliente</span>
              <span>Estado</span>
              <span>Fecha</span>
              <span className="text-right">Total</span>
              <span />
            </div>

            {displayed.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">Sin pedidos con ese filtro.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {displayed.map(o => (
                  <div key={o._id} className="grid grid-cols-[1fr_1fr_120px_130px_1fr_32px] px-5 py-3 items-center hover:bg-gray-50 transition-colors">
                    <span className="text-xs font-mono font-bold text-gray-700 truncate pr-3">
                      {o.id_pedido ?? o._id}
                    </span>
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-medium text-gray-800 truncate">{o.nombre_negocio ?? (o.customer_id ? customerMap[o.customer_id] : undefined) ?? o.usuario?.nombre ?? '—'}</p>
                      {o.usuario?.email && <p className="text-[11px] text-gray-400 truncate">{o.usuario.email}</p>}
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit ${STATUS_BADGE[o.status_final] ?? 'bg-gray-100 text-gray-600'}`}>
                      {o.status_final}
                    </span>
                    <span className="text-xs text-gray-400">
                      {(o.fecha_pedido || o.createdAt)
                        ? new Date(o.fecha_pedido ?? o.createdAt!).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </span>
                    <span className="text-xs font-bold text-gray-900 text-right">
                      {(o.total ?? o.SubTotal) != null ? `$${(o.total ?? o.SubTotal)!.toLocaleString('es-MX')}` : '—'}
                    </span>
                    <button
                      onClick={async () => {
                        setSelectedOrder(o);
                        setDetailOrder(null);
                        setDetailLoading(true);
                        try {
                          const id   = o._id;
                          const pid  = o.id_pedido ?? o._id;
                          const tk2  = localStorage.getItem('or_token') ?? '';
                          const h2   = { Authorization: `Bearer ${tk2}`, 'Content-Type': 'application/json' };
                          const endpoints = [
                            `${API}/api/admin/orders/${id}`,
                            `${API}/api/admin/orders/${pid}`,
                            `${API}/api/orders/${id}`,
                            `${API}/api/orders/${pid}`,
                            `${API}/api/admin/order/${id}`,
                          ];

                          const normaliseItems = (raw: any): Order => {
                            // API returns {order:{...}, detalles:[...], tracking:{...}}
                            const base = raw.order ? { ...raw.order } : raw;
                            const rawItems =
                              raw.detalles ?? raw.items ?? raw.productos ??
                              raw.products ?? raw.orderItems ?? raw.lineas ??
                              base.detalles ?? base.items ?? [];
                            return {
                              ...base,
                              items: rawItems.map((it: any) => ({
                                nombre:
                                  it.nombre_sku_solicitado ??
                                  it.nombre ??
                                  it.nombre_producto ??
                                  it.name ??
                                  it.descripcion ??
                                  it.producto?.nombre ??
                                  it.sku_solicitado ??
                                  it.sku ??
                                  'Producto',
                                cantidad:        it.cantidad ?? it.cantidad_solicitada ?? it.quantity ?? 1,
                                precio_unitario: it.precio_unitario ?? it.precio_unitario_solicitado ?? it.precio ?? it.price,
                                sku:             it.sku_solicitado ?? it.sku,
                              })),
                            };
                          };

                          let detail: Order | null = null;
                          for (const url of endpoints) {
                            try {
                              const res = await fetch(url, { headers: h2 });
                              if (res.ok) {
                                const raw = await res.json();
                                const normalised = normaliseItems(raw);
                                if ((normalised.items ?? []).length > 0) {
                                  detail = normalised;
                                  break;
                                }
                                if (!detail) detail = normalised;
                              }
                            } catch { /* try next */ }
                          }
                          if (detail) setDetailOrder(detail);
                        } catch { /* fall back to list data */ } finally {
                          setDetailLoading(false);
                        }
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Order detail card */}
      <AnimatePresence>
        {selectedOrder && (() => {
          const o = detailOrder ?? selectedOrder;
          const items = o.items ?? [];
          return (
            <>
              <motion.div
                key="blur-bg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setSelectedOrder(null); setDetailOrder(null); }}
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              />
              <motion.div
                key="order-card"
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
              >
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm pointer-events-auto p-6 space-y-4 max-h-[90vh] overflow-y-auto">

                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-xl font-black text-gray-900 truncate">
                        {o.id_pedido ?? o._id}
                      </h2>
                      {(o.nombre_negocio ?? (o.customer_id ? customerMap[o.customer_id] : undefined) ?? o.usuario?.nombre) && (
                        <p className="text-sm text-gray-400 mt-0.5 truncate">
                          {o.nombre_negocio ?? (o.customer_id ? customerMap[o.customer_id] : undefined) ?? o.usuario?.nombre}
                          {o.usuario?.email ? ` · ${o.usuario.email}` : ''}
                        </p>
                      )}
                      {(o.direccion_entrega ?? o.direccion) && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          📍 {o.direccion_entrega ?? o.direccion}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => { setSelectedOrder(null); setDetailOrder(null); }}
                      className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Badges */}
                  <div className="flex gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_BADGE[o.status_final] ?? 'bg-gray-100 text-gray-600'}`}>
                      {o.status_final}
                    </span>
                    {(o.fecha_pedido || o.createdAt) && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                        {new Date(o.fecha_pedido ?? o.createdAt!).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    {o.repartidor?.nombre && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        🛵 {o.repartidor.nombre}
                      </span>
                    )}
                  </div>

                  {/* Items */}
                  {detailLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
                    </div>
                  ) : items.length > 0 ? (
                    <div className="bg-gray-50 rounded-2xl divide-y divide-gray-200 overflow-hidden">
                      {items.map((item, i) => {
                        const nombre = item.nombre ?? item.name ?? item.sku ?? '—';
                        const cantidad = item.cantidad ?? item.quantity ?? 1;
                        const precio = item.precio_unitario ?? item.precio;
                        return (
                          <div key={i} className="flex items-center justify-between px-4 py-3 gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{nombre}</p>
                              {precio != null && (
                                <p className="text-[11px] text-gray-400">${precio.toLocaleString('es-MX')} c/u</p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm text-gray-500 font-medium">×{cantidad}</p>
                              {precio != null && (
                                <p className="text-xs font-bold text-gray-800">${(precio * cantidad).toLocaleString('es-MX')}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-2">Sin detalle de productos.</p>
                  )}

                  {/* Notes */}
                  {o.notas && (
                    <div className="bg-yellow-50 rounded-xl px-4 py-3">
                      <p className="text-xs text-gray-500 font-medium mb-0.5">Notas</p>
                      <p className="text-sm text-gray-700">{o.notas}</p>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-400">Total</span>
                    <span className="text-xl font-black text-gray-900">
                      {(o.total ?? o.SubTotal) != null
                        ? `$${(o.total ?? o.SubTotal)!.toLocaleString('es-MX')}`
                        : '—'}
                    </span>
                  </div>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* INVENTARIO */}
      {activeTab === 'inventario' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Low stock */}
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3">Bajo stock ({lowStock.length})</h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {lowStock.length === 0 ? (
                <p className="p-8 text-center text-sm text-gray-400">Sin productos con bajo stock.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {lowStock.map((item, i) => (
                    <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.nombre ?? item.sku}</p>
                        <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}{item.cedis_id ? ` · CEDIS ${item.cedis_id}` : ''}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-orange-600">{item.stock_actual ?? '—'} uds.</p>
                        {item.stock_minimo !== undefined && (
                          <p className="text-xs text-gray-400">Mín: {item.stock_minimo}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Depletion risk */}
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3">Riesgo de agotamiento — crítico ({riskItems.length})</h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {riskItems.length === 0 ? (
                <p className="p-8 text-center text-sm text-gray-400">Sin alertas críticas.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {riskItems.map((item, i) => (
                    <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.nombre ?? item.sku}</p>
                        <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {item.probabilidad !== undefined && (
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                              <div className="h-full bg-[#E61A27] rounded-full" style={{ width: `${item.probabilidad}%` }} />
                            </div>
                            <span className="text-xs font-bold text-[#E61A27]">{item.probabilidad}%</span>
                          </div>
                        )}
                        {item.horas_estimadas !== undefined && (
                          <p className="text-xs text-gray-400 mt-1">~{item.horas_estimadas}h restantes</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
}
