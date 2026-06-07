import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

const TIMELINE = [
  { key: 'Pendiente',       label: 'Pedido recibido',     desc: 'Tu pedido fue registrado correctamente.' },
  { key: 'Confirmado',      label: 'Confirmado',          desc: 'Inventario verificado y asignado.' },
  { key: 'En preparación',  label: 'Preparando pedido',   desc: 'Estamos preparando tu pedido en CEDIS.' },
  { key: 'En camino',       label: 'En camino',           desc: 'Tu pedido está en ruta hacia tu dirección.' },
  { key: 'Entregado',       label: 'Entregado',           desc: 'Tu pedido fue entregado con éxito.' },
];

const STATUS_ORDER: Record<string, number> = {
  'Pendiente': 0, 'Confirmado': 1, 'En preparación': 2, 'En camino': 3, 'Entregado': 4,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#E61A27] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <h1 className="text-2xl font-bold text-gray-900">Seguimiento</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-4">{error}</div>
        )}

        {orders.length === 0 && !error ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
            <svg className="mx-auto h-10 w-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0M3 7h18M3 7l2-4h14l2 4M3 7v10h1m15 0h1V7" />
            </svg>
            <p className="text-gray-500 text-sm font-medium">No tienes pedidos para seguir.</p>
          </div>
        ) : (
          <>
            {/* Order selector */}
            {orders.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {orders.slice(0, 6).map(o => (
                  <button
                    key={o.id_pedido}
                    onClick={() => setSelected(o)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selected?.id_pedido === o.id_pedido
                        ? 'bg-[#E61A27] text-white border-[#E61A27]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {o.id_pedido}
                  </button>
                ))}
              </div>
            )}

            {selected && (
              <motion.div
                key={selected.id_pedido}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Summary card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-gray-400 tracking-wide">{selected.id_pedido}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      selected.status_final === 'Entregado'      ? 'bg-green-100 text-green-700' :
                      selected.status_final === 'En camino'      ? 'bg-orange-100 text-orange-700' :
                      selected.status_final === 'Cancelado'      ? 'bg-red-100 text-red-700' :
                      selected.status_final === 'En preparación' ? 'bg-indigo-100 text-indigo-700' :
                                                                    'bg-blue-100 text-blue-700'
                    }`}>
                      {selected.status_final}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {selected.items?.length ?? 0} productos · ${selected.total?.toLocaleString('es-MX')} MXN
                  </p>
                  {selected.repartidor?.nombre && (
                    <p className="text-xs text-gray-400">
                      Repartidor: <span className="font-medium text-gray-600">{selected.repartidor.nombre}</span>
                      {selected.repartidor.vehiculo ? ` · ${selected.repartidor.vehiculo}` : ''}
                    </p>
                  )}
                  {selected.direccion_entrega && (
                    <p className="text-xs text-gray-400">📍 {selected.direccion_entrega}</p>
                  )}
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-6">Estado del pedido</h3>
                  <div>
                    {TIMELINE.map((step, i) => {
                      const isDone   = i < currentStep;
                      const isActive = i === currentStep;
                      const isFuture = i > currentStep;
                      return (
                        <div key={step.key} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 transition-all ${
                              isDone   ? 'bg-[#E61A27] border-[#E61A27]' :
                              isActive ? 'bg-white border-[#E61A27]' :
                                         'bg-white border-gray-200'
                            }`}>
                              {isDone ? (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              ) : isActive ? (
                                <div className="w-3 h-3 rounded-full bg-[#E61A27]" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-gray-300" />
                              )}
                            </div>
                            {i < TIMELINE.length - 1 && (
                              <div className={`w-0.5 h-10 mt-0.5 ${isDone ? 'bg-[#E61A27]' : 'bg-gray-200'}`} />
                            )}
                          </div>
                          <div className="pb-2 pt-1 flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${
                              isFuture ? 'text-gray-400' : isActive ? 'text-[#E61A27]' : 'text-gray-900'
                            }`}>
                              {step.label}
                            </p>
                            {!isFuture && (
                              <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Products */}
                {(selected.items ?? []).length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Productos</h3>
                    <div className="space-y-2">
                      {selected.items.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-700 truncate mr-4">{item.nombre}</span>
                          <span className="text-gray-400 font-mono shrink-0">×{item.cantidad}</span>
                        </div>
                      ))}
                      {selected.items.length > 5 && (
                        <p className="text-xs text-[#E61A27] font-medium">+{selected.items.length - 5} más</p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
