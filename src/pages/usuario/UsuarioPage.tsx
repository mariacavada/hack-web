import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';

const API     = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
const ML_API  = 'https://ml-service-hack.up.railway.app';

const STATUS_STEP: Record<string, number> = {
  'Pendiente': 0, 'Confirmado': 1, 'En preparación': 2, 'En camino': 3, 'Entregado': 4,
};
const STATUS_LABEL: Record<string, string> = {
  'Pendiente': 'Pedido recibido', 'Confirmado': 'Confirmado',
  'En preparación': 'Preparando tu pedido', 'En camino': 'Tu pedido está en camino',
  'Entregado': 'Entregado', 'Cancelado': 'Cancelado',
};
const TIMELINE = ['Pendiente', 'Confirmado', 'En preparación', 'En camino', 'Entregado'];

interface OrderItem   { nombre: string; cantidad: number; }
interface Order       { id_pedido: string; status_final: string; total: number; items: OrderItem[]; }
interface Notification{ _id: string; leida: boolean; }

interface AltProduct {
  sku?: string;
  nombre?: string;
  affinity_pct?: number;
  times_accepted?: number;
  imagen?: string;
}
interface Suggestion {
  sku?: string;
  nombre?: string;
  cantidad?: string | number;
  shortage_pct?: number;
  imagen?: string;
  sugerido?: AltProduct;
  alternative?: AltProduct;
}

/* ── AI Suggestion Card ─────────────────────────────────────────── */
function AICard({ userId }: { userId: string }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [open,        setOpen]        = useState(false);
  const [active,      setActive]      = useState(0);         // which suggestion is shown
  const [tab,         setTab]         = useState<'sugerida' | 'otra'>('sugerida');
  const [accepted,    setAccepted]    = useState(false);
  const [declined,    setDeclined]    = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // trigger generation (fire and forget is fine)
        fetch(`${ML_API}/suggest/${userId}`, { method: 'POST' }).catch(() => {});
        // get saved suggestions
        const res  = await fetch(`${ML_API}/suggest/${userId}`);
        const data = await res.json();
        if (cancelled) return;

        // normalise: could be array or { suggestions: [...] }
        let list: Suggestion[] = [];
        if (Array.isArray(data))                 list = data;
        else if (Array.isArray(data?.suggestions)) list = data.suggestions;
        else if (data && !data.detail)             list = [data];
        setSuggestions(list.filter(s => s && (s.sku || s.nombre)));
      } catch {
        /* network error → treat as no suggestions */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  const hasAlert = suggestions.length > 0;
  const current  = suggestions[active] ?? null;
  const alt      = current?.sugerido ?? current?.alternative ?? null;

  function openModal(i: number) {
    setActive(i);
    setTab('sugerida');
    setAccepted(false);
    setDeclined(false);
    setOpen(true);
  }

  if (loading) {
    return <div className="h-16 bg-white rounded-2xl border border-gray-200 animate-pulse" />;
  }

  return (
    <>
      {/* ── Banner card(s) ── */}
      {hasAlert ? (
        suggestions.map((_s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => openModal(i)}
            className="w-full flex items-center gap-3 rounded-2xl border-2 border-red-400 bg-red-50 px-4 py-3.5 text-left shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-700 leading-tight">Un producto podría agotarse</p>
              <p className="text-xs text-red-500 mt-0.5">Toca para decidir qué hacer. Es rápido.</p>
            </div>
            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        ))
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-green-700">Pedido completo · Todo en orden</p>
            <p className="text-xs text-green-500 mt-0.5">Todos tus productos están disponibles.</p>
          </div>
        </motion.div>
      )}

      {/* ── Bottom sheet modal ── */}
      <AnimatePresence>
        {open && current && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/40 z-40"
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 40 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>

              <div className="px-5 pb-8 pt-2">
                {/* IA badge */}
                <div className="flex items-center gap-1.5 mb-4">
                  <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                    </svg>
                    Sugerencia con IA
                  </span>
                </div>

                <h2 className="text-xl font-black text-gray-900 leading-tight">
                  Este producto podría agotarse
                </h2>
                <p className="text-sm text-gray-400 mt-1 mb-5">
                  No cambiamos nada sin preguntarte. Tú decides. 🙂
                </p>

                {/* Product at risk */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4 mb-5">
                  <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                    {current.imagen ? (
                      <img src={current.imagen} alt={current.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400 text-center px-1 leading-tight font-medium">
                        {current.sku ?? '—'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{current.nombre ?? current.sku ?? 'Producto'}</p>
                    {current.cantidad != null && (
                      <p className="text-xs text-gray-400 mt-0.5">{current.cantidad}</p>
                    )}
                  </div>
                  {current.shortage_pct != null && (
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-black text-red-600">{current.shortage_pct}%</p>
                      <p className="text-[10px] text-gray-400">de faltante</p>
                    </div>
                  )}
                </div>

                {/* Tabs */}
                {alt && (
                  <>
                    <div className="flex rounded-xl bg-gray-100 p-1 mb-4 gap-1">
                      {(['sugerida', 'otra'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setTab(t)}
                          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                            tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
                          }`}
                        >
                          {t === 'sugerida' ? 'Aceptar sugerida' : 'Elegir otra'}
                        </button>
                      ))}
                    </div>

                    {tab === 'sugerida' && (
                      <div className="border-2 border-red-400 rounded-2xl p-4 mb-5 flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                          {alt.imagen ? (
                            <img src={alt.imagen} alt={alt.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs text-gray-400 text-center px-1 leading-tight font-medium">
                              {alt.sku ?? '—'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <p className="font-bold text-gray-900 text-sm">{alt.nombre ?? alt.sku ?? 'Sustituto'}</p>
                            <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full shrink-0">
                              Mejor opción
                            </span>
                          </div>
                          {alt.times_accepted != null && (
                            <p className="text-xs text-gray-400">Lo aceptaste {alt.times_accepted} veces antes</p>
                          )}
                          {alt.affinity_pct != null && (
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-green-500"
                                  style={{ width: `${alt.affinity_pct}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-gray-400 shrink-0">{alt.affinity_pct}% afín</span>
                            </div>
                          )}
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        </div>
                      </div>
                    )}

                    {tab === 'otra' && (
                      <div className="rounded-2xl border border-gray-200 p-4 mb-5 text-center text-sm text-gray-400">
                        Función disponible próximamente.
                      </div>
                    )}
                  </>
                )}

                {/* Action buttons */}
                {accepted ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-green-600 font-bold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Sustitución aceptada
                  </div>
                ) : declined ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-gray-500 font-semibold">
                    Registrado. Te reembolsaremos si falta el producto.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setAccepted(true)}
                      className="w-full bg-[#E61A27] hover:bg-[#B31217] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Aceptar esta sustitución
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDeclined(true)}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-4 rounded-2xl transition-colors"
                    >
                      No sustituir, mejor reembólsame
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Quick links ────────────────────────────────────────────────── */
const quickLinks = [
  {
    path: '/usuario/pedidos',
    label: 'Mis pedidos',
    sub: 'Historial completo',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    ),
    color: 'bg-violet-50 text-violet-600',
  },
  {
    path: '/usuario/seguir',
    label: 'Seguimiento',
    sub: '¿Dónde está mi pedido?',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0M3 7h18M3 7l2-4h14l2 4M3 7v10h1m15 0h1V7" />
    ),
    color: 'bg-orange-50 text-orange-600',
  },
];

/* ── Main page ──────────────────────────────────────────────────── */
export default function UsuarioPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [unread,      setUnread]      = useState(0);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('or_token');
    if (!token) { setLoading(false); return; }
    const h = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/api/orders/my`,                              { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/notifications?solo_no_leidas=true`,      { headers: h }).then(r => r.ok ? r.json() : []),
    ])
      .then(([orders, notifs]: [Order[], Notification[]]) => {
        if (Array.isArray(orders) && orders.length > 0) {
          const active = orders.find(o => !['Entregado', 'Cancelado'].includes(o.status_final));
          setActiveOrder(active ?? orders[0]);
        }
        if (Array.isArray(notifs)) setUnread(notifs.filter(n => !n.leida).length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.nombre?.split(' ')[0] ?? 'Usuario';
  const step      = activeOrder ? (STATUS_STEP[activeOrder.status_final] ?? 0) : 0;
  const isActive  = activeOrder && !['Entregado', 'Cancelado'].includes(activeOrder.status_final);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        {/* Greeting */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400 font-medium">Bienvenido de vuelta</p>
            <h1 className="text-2xl font-bold text-gray-900">{firstName}</h1>
          </div>
          {unread > 0 && (
            <button
              onClick={() => navigate('/usuario/perfil')}
              className="relative mt-1 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:border-gray-300 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white tabular-nums">
                {unread}
              </span>
            </button>
          )}
        </div>

        {/* Active order card */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 h-40 animate-pulse" />
        ) : isActive ? (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/usuario/seguir')}
            className="w-full bg-[#E61A27] rounded-2xl p-5 text-white shadow-lg text-left"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Pedido activo</span>
              <span className="text-xs font-mono font-semibold bg-white/15 px-2.5 py-1 rounded-full">
                {activeOrder!.id_pedido}
              </span>
            </div>
            <h2 className="text-xl font-bold mt-2">{STATUS_LABEL[activeOrder!.status_final]}</h2>
            <p className="text-white/75 text-sm mt-1">
              {activeOrder!.items?.length ?? 0} productos · ${activeOrder!.total?.toLocaleString('es-MX')} MXN
            </p>
            <div className="flex gap-1 mt-4">
              {TIMELINE.map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-white' : 'bg-white/25'}`}
                />
              ))}
            </div>
            <p className="text-white/60 text-xs mt-2 font-medium">Ver seguimiento →</p>
          </motion.button>
        ) : activeOrder ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-green-200 p-5 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Último pedido entregado</p>
              <p className="text-xs text-gray-400 mt-0.5">{activeOrder.id_pedido} · ${activeOrder.total?.toLocaleString('es-MX')} MXN</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-gray-900 font-semibold text-sm">Sin pedidos activos</p>
            <p className="text-gray-400 text-xs mt-1">¡Haz tu primer pedido!</p>
          </motion.div>
        )}

        {/* AI suggestion card — always visible */}
        {user?.id && <AICard userId={user.id} />}

        {/* CTA */}
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => navigate('/usuario/tienda')}
          className="w-full bg-[#E61A27] hover:bg-[#C9141A] text-white font-bold py-4 rounded-2xl shadow-sm transition-colors flex items-center justify-center gap-2 text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Hacer un pedido
        </motion.button>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map(item => (
            <motion.button
              key={item.path}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(item.path)}
              className="bg-white border border-gray-100 rounded-2xl p-4 text-left hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div className={`w-9 h-9 ${item.color} rounded-xl flex items-center justify-center mb-3`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  {item.icon}
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
