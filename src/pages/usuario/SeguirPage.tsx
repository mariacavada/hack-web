import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatOrder } from './ChatOrderContext';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

const TIMELINE = [
  { key: 'Pendiente',       label: 'Pedido recibido',    desc: 'Tu pedido fue registrado correctamente.' },
  { key: 'Confirmado',      label: 'Confirmado',          desc: 'Inventario verificado y asignado.' },
  { key: 'En preparación',  label: 'Preparando pedido',  desc: 'Estamos preparando tu pedido en CEDIS.' },
  { key: 'En camino',       label: 'En camino',           desc: 'Tu pedido está en ruta hacia tu dirección.' },
  { key: 'Entregado',       label: 'Entregado',           desc: 'Tu pedido fue entregado con éxito.' },
];

const STATUS_ORDER: Record<string, number> = {
  'Pendiente': 0, 'Confirmado': 1, 'En preparación': 2, 'En camino': 3, 'Entregado': 4,
};

const STATUS_HERO: Record<string, { border: string; accent: string; iconBg: string; badge: string; label: string }> = {
  'Pendiente':      { border: 'border-gray-200',   accent: 'text-gray-700',   iconBg: 'bg-gray-100',   badge: 'bg-gray-100 text-gray-600',    label: 'Pedido recibido' },
  'Confirmado':     { border: 'border-blue-200',   accent: 'text-blue-700',   iconBg: 'bg-blue-50',    badge: 'bg-blue-100 text-blue-700',    label: 'Pedido confirmado' },
  'En preparación': { border: 'border-indigo-200', accent: 'text-indigo-700', iconBg: 'bg-indigo-50',  badge: 'bg-indigo-100 text-indigo-700',label: 'Preparando tu pedido' },
  'En camino':      { border: 'border-orange-200', accent: 'text-orange-700', iconBg: 'bg-orange-50',  badge: 'bg-orange-100 text-orange-700',label: 'Tu pedido va en camino' },
  'Entregado':      { border: 'border-green-200',  accent: 'text-green-700',  iconBg: 'bg-green-50',   badge: 'bg-green-100 text-green-700',  label: '¡Entregado con éxito!' },
  'Cancelado':      { border: 'border-red-200',    accent: 'text-red-700',    iconBg: 'bg-red-50',     badge: 'bg-red-100 text-red-700',      label: 'Pedido cancelado' },
};

// API returns lowercase/underscore values; normalize to title-case keys used above
function normalizeStatus(raw: string): string {
  const map: Record<string, string> = {
    pendiente:        'Pendiente',
    confirmado:       'Confirmado',
    asignado:         'Confirmado',
    en_preparacion:   'En preparación',
    'en preparación': 'En preparación',
    en_camino:        'En camino',
    'en camino':      'En camino',
    entregado:        'Entregado',
    incompleto:       'Entregado',
    cancelado:        'Cancelado',
  }
  const key = raw.toLowerCase().replace(/ /g, '_')
  return map[key] ?? map[raw.toLowerCase()] ?? raw
}

interface OrderItem { sku?: string; nombre: string; cantidad: number; precio_unitario?: number; }
interface GroupedItem { sku?: string; nombre: string; cantidad: number; precio_unitario?: number; }

function groupItems(items: OrderItem[]): GroupedItem[] {
  const map = new Map<string, GroupedItem>()
  for (const item of items) {
    const key = item.sku ?? item.nombre
    const existing = map.get(key)
    if (existing) {
      map.set(key, { ...existing, cantidad: existing.cantidad + item.cantidad })
    } else {
      map.set(key, { ...item })
    }
  }
  return Array.from(map.values())
}

interface Order {
  id_pedido: string;
  status_final: string;
  fecha_pedido: string;
  fecha_entrega?: string;
  subtotal?: number;
  total: number;
  items: OrderItem[];
  repartidor?: { nombre: string; vehiculo?: string };
  direccion_entrega?: string;
}

export default function SeguirPage() {
  const { setActiveOrderId } = useChatOrder();
  const [orders, setOrders]     = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [showAllItems, setShowAllItems] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('or_token');
    if (!token) { setLoading(false); return; }

    fetch(`${API}/api/orders/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error('Error al cargar pedidos'); return r.json(); })
      .then((data: any[]) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayStr   = new Date().toDateString();
        const normalized: Order[] = data
          .filter((o: any) => {
            const rawDate = o.fecha_entrega ?? o.fecha_pedido;
            if (!rawDate) return false; // no date → exclude
            const st = normalizeStatus(o.status_final ?? 'pendiente');
            if (['Entregado', 'Cancelado'].includes(st)) {
              // terminal: only show if the order date is today
              return new Date(rawDate).toDateString() === todayStr;
            }
            // active: today or future only
            return new Date(rawDate) >= todayStart;
          })
          .map((o: any) => ({
          id_pedido:        o.id_pedido ?? o._id,
          status_final:     normalizeStatus(o.status_final ?? 'pendiente'),
          fecha_pedido:     o.fecha_pedido ?? o.createdAt ?? new Date().toISOString(),
          fecha_entrega:    o.fecha_entrega,
          subtotal:         o.subtotal ?? o.SubTotal ?? o.total ?? 0,
          total:            o.total ?? o.Total ?? o.subtotal ?? 0,
          items:            (o.items ?? []).map((i: any) => ({
            sku:             i.sku,
            nombre:          i.nombre ?? i.name ?? i.sku ?? 'Producto',
            cantidad:        i.cantidad ?? i.quantity ?? 1,
            precio_unitario: i.precio_unitario ?? i.precio ?? i.price,
          })),
          repartidor:       o.repartidor ?? null,
          direccion_entrega: o.direccion_entrega ?? o.direccion ?? null,
        }))
        setOrders(normalized);
        const active = normalized.find(o => !['Entregado', 'Cancelado'].includes(o.status_final));
        setSelected(active ?? normalized[0]);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Avisar al asistente sobre qué pedido está viendo el usuario, para que
  // pueda responder con contexto específico de ese pedido (ver chatbot.service)
  useEffect(() => {
    setActiveOrderId(selected?.id_pedido ?? null);
    return () => setActiveOrderId(null);
  }, [selected, setActiveOrderId]);

  // Reset "see more" whenever a different order is selected
  const handleSelect = (o: Order) => { setSelected(o); setShowAllItems(false); }

  const currentStep = selected ? (STATUS_ORDER[selected.status_final] ?? 0) : 0;
  const hero        = selected ? (STATUS_HERO[selected.status_final] ?? STATUS_HERO['Pendiente']!) : null;
  const isLive      = selected?.status_final === 'En camino';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#E61A27] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Seguimiento</h1>
          {selected && (
            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
              {selected.id_pedido}
            </span>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl p-4">{error}</div>
        )}

        {orders.length === 0 && !error ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0M3 7h18M3 7l2-4h14l2 4M3 7v10h1m15 0h1V7" />
              </svg>
            </div>
            <p className="text-gray-900 font-semibold text-sm">Sin pedidos activos</p>
            <p className="text-gray-400 text-xs mt-1">Haz un pedido para ver su seguimiento aquí.</p>
          </div>
        ) : (
          <>
            {/* Order selector pills */}
            {orders.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {orders.slice(0, 8).map(o => (
                  <button
                    key={o.id_pedido}
                    onClick={() => handleSelect(o)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                      selected?.id_pedido === o.id_pedido
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {o.id_pedido}
                  </button>
                ))}
              </div>
            )}

            {selected && hero && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={selected.id_pedido}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-3"
                >
                  {/* Hero status card */}
                  <div className={`bg-white border-2 ${hero.border} rounded-2xl p-5`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {isLive && (
                          <motion.span
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                            className="block w-2 h-2 rounded-full bg-orange-500"
                          />
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${hero.accent}`}>
                          {isLive ? 'En tiempo real' : 'Estado actual'}
                        </span>
                      </div>
                      {selected.total > 0 && (
                        <span className="text-xs font-semibold text-gray-400 tabular-nums">
                          ${selected.total.toLocaleString('es-MX')} MXN
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">{hero.label}</h2>
                    <p className="text-sm text-gray-400 mt-1">
                      {selected.items?.length ?? 0} {selected.items?.length === 1 ? 'producto' : 'productos'}
                    </p>

                    {selected.status_final !== 'Cancelado' && (
                      <div className="flex gap-1.5 mt-4">
                        {TIMELINE.map((_, i) => (
                          <motion.div
                            key={i}
                            className="flex-1 h-1.5 rounded-full"
                            animate={{ backgroundColor: i <= currentStep ? '#E61A27' : '#e5e7eb' }}
                            transition={{ duration: 0.4, delay: i * 0.06 }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Delivery info */}
                  {(selected.repartidor?.nombre || selected.direccion_entrega || selected.fecha_entrega) && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                      {selected.fecha_entrega && (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 0v4m-10 2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2zm0 0V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Fecha de entrega</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {new Date(selected.fecha_entrega).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      )}
                      {selected.repartidor?.nombre && (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0M3 7h18M3 7l2-4h14l2 4M3 7v10h1m15 0h1V7" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Repartidor</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {selected.repartidor.nombre}
                              {selected.repartidor.vehiculo && (
                                <span className="text-gray-400 font-normal"> · {selected.repartidor.vehiculo}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                      {selected.direccion_entrega && (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Dirección de entrega</p>
                            <p className="text-sm font-medium text-gray-800">{selected.direccion_entrega}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-5">
                      Progreso del pedido
                    </h3>
                    <div>
                      {TIMELINE.map((step, i) => {
                        const isDone   = i < currentStep;
                        const isActive = i === currentStep;
                        const isFuture = i > currentStep;
                        return (
                          <div key={step.key} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="relative flex items-center justify-center w-8 h-8">
                                {isActive && (
                                  <motion.div
                                    animate={{ scale: [1, 1.7, 1], opacity: [0.6, 0, 0.6] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute inset-0 rounded-full bg-red-500/30"
                                  />
                                )}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300 ${
                                  isDone   ? 'bg-gray-900 border-gray-900' :
                                  isActive ? 'bg-white border-red-500'    :
                                             'bg-white border-gray-200'
                                }`}>
                                  {isDone ? (
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : isActive ? (
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                  ) : (
                                    <div className="w-2 h-2 rounded-full bg-gray-200" />
                                  )}
                                </div>
                              </div>
                              {i < TIMELINE.length - 1 && (
                                <motion.div
                                  animate={{ backgroundColor: isDone ? '#111827' : '#f3f4f6' }}
                                  transition={{ duration: 0.5 }}
                                  className="w-0.5 h-10 mt-0.5"
                                />
                              )}
                            </div>
                            <div className="pb-2 pt-1.5 flex-1 min-w-0">
                              <p className={`text-sm font-semibold transition-colors ${
                                isFuture ? 'text-gray-300' :
                                isActive  ? 'text-gray-900' :
                                            'text-gray-600'
                              }`}>
                                {step.label}
                              </p>
                              {!isFuture && (
                                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grouped order detail — compact with see more */}
                  {(selected.items ?? []).length > 0 && (() => {
                    const grouped   = groupItems(selected.items)
                    const LIMIT     = 3
                    const visible   = showAllItems ? grouped : grouped.slice(0, LIMIT)
                    const hiddenCnt = grouped.length - LIMIT
                    return (
                      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Detalle del pedido
                          </h3>
                          <span className="text-xs text-gray-400 tabular-nums">
                            {grouped.length} {grouped.length === 1 ? 'producto' : 'productos'}
                          </span>
                        </div>

                        <div className="divide-y divide-gray-100">
                          {visible.map((item, i) => (
                            <div key={i} className="flex items-center justify-between px-5 py-2.5">
                              <p className="text-sm text-gray-800 truncate flex-1 mr-3">{item.nombre}</p>
                              <div className="flex items-center gap-2.5 shrink-0">
                                <span className="text-xs font-semibold text-gray-400 tabular-nums">×{item.cantidad}</span>
                                {item.precio_unitario != null && (
                                  <span className="text-xs font-semibold text-gray-700 tabular-nums w-16 text-right">
                                    ${(item.cantidad * item.precio_unitario).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* See more / less toggle */}
                        {grouped.length > LIMIT && (
                          <button
                            onClick={() => setShowAllItems(v => !v)}
                            className="w-full px-5 py-2.5 border-t border-gray-100 text-xs font-semibold text-[#E61A27] hover:bg-gray-50 transition-colors text-left"
                          >
                            {showAllItems ? 'Ver menos ↑' : `Ver ${hiddenCnt} más ↓`}
                          </button>
                        )}

                        {/* Total row */}
                        {selected.total > 0 && (
                          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-700">Total</span>
                            <span className="text-sm font-bold text-gray-900 tabular-nums">
                              ${selected.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </motion.div>
              </AnimatePresence>
            )}
          </>
        )}
      </div>
    </div>
  );
}
