import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

const STATUS_HERO: Record<string, { bg: string; label: string }> = {
  'Pendiente':       { bg: 'bg-gray-900',    label: 'Pedido recibido' },
  'Confirmado':      { bg: 'bg-blue-600',    label: 'Pedido confirmado' },
  'En preparación':  { bg: 'bg-indigo-600',  label: 'Preparando tu pedido' },
  'En camino':       { bg: 'bg-orange-500',  label: 'Tu pedido va en camino' },
  'Entregado':       { bg: 'bg-green-600',   label: '¡Entregado con éxito!' },
  'Cancelado':       { bg: 'bg-red-600',     label: 'Pedido cancelado' },
};

interface OrderItem { nombre: string; cantidad: number; }
interface Order {
  id_pedido: string;
  status_final: string;
  fecha_pedido: string;
  total: number;
  items: OrderItem[];
  repartidor?: { nombre: string; vehiculo?: string };
  direccion_entrega?: string;
}

export default function SeguirPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('or_token');
    if (!token) { setLoading(false); return; }

    fetch(`${API}/api/orders/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error('Error al cargar pedidos'); return r.json(); })
      .then((data: Order[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setOrders(data);
          const active = data.find(o => !['Entregado', 'Cancelado'].includes(o.status_final));
          setSelected(active ?? data[0]);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const currentStep = selected ? (STATUS_ORDER[selected.status_final] ?? 0) : 0;
  const hero = selected ? (STATUS_HERO[selected.status_final] ?? STATUS_HERO['Pendiente']) : null;
  const isLive = selected?.status_final === 'En camino';

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
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-4">{error}</div>
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
                {orders.slice(0, 6).map(o => (
                  <button
                    key={o.id_pedido}
                    onClick={() => setSelected(o)}
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
                  <div className={`${hero.bg} rounded-2xl p-5 text-white`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {isLive && (
                          <motion.span
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                            className="block w-2 h-2 rounded-full bg-white"
                          />
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                          {isLive ? 'En tiempo real' : 'Estado actual'}
                        </span>
                      </div>
                      {selected.total > 0 && (
                        <span className="text-xs font-semibold text-white/70">
                          ${selected.total.toLocaleString('es-MX')} MXN
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl font-bold leading-tight">{hero.label}</h2>
                    <p className="text-white/70 text-sm mt-1">
                      {selected.items?.length ?? 0} {selected.items?.length === 1 ? 'producto' : 'productos'}
                    </p>

                    {/* Progress bar — hide for cancelled */}
                    {selected.status_final !== 'Cancelado' && (
                      <div className="flex gap-1.5 mt-4">
                        {TIMELINE.map((_, i) => (
                          <motion.div
                            key={i}
                            className="flex-1 h-1 rounded-full"
                            animate={{ backgroundColor: i <= currentStep ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.25)' }}
                            transition={{ duration: 0.4, delay: i * 0.06 }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Delivery info card */}
                  {(selected.repartidor?.nombre || selected.direccion_entrega) && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
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
                            {/* Step indicator column */}
                            <div className="flex flex-col items-center">
                              <div className="relative flex items-center justify-center w-8 h-8">
                                {/* Pulsing ring on active step */}
                                {isActive && (
                                  <motion.div
                                    animate={{ scale: [1, 1.7, 1], opacity: [0.6, 0, 0.6] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute inset-0 rounded-full bg-red-500/30"
                                  />
                                )}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300 ${
                                  isDone   ? 'bg-gray-900 border-gray-900' :
                                  isActive ? 'bg-white border-red-500' :
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

                            {/* Step content */}
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

                  {/* Products compact */}
                  {(selected.items ?? []).length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                        Productos del pedido
                      </h3>
                      <div className="space-y-2.5">
                        {selected.items.slice(0, 5).map((item, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 truncate mr-4">{item.nombre}</span>
                            <span className="text-xs font-semibold text-gray-500 tabular-nums bg-gray-50 px-2.5 py-0.5 rounded-full shrink-0">
                              ×{item.cantidad}
                            </span>
                          </div>
                        ))}
                        {selected.items.length > 5 && (
                          <p className="text-xs text-red-600 font-semibold">+{selected.items.length - 5} más</p>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </>
        )}
      </div>
    </div>
  );
}
