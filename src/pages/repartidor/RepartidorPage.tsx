import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import RouteMap from './RouteMap';
import { useAuth } from '../../auth/AuthContext';

const REP_PATH_TAB: Record<string, 'pedidos' | 'ruta' | 'incidencias' | 'perfil'> = {
  '/repartidor/ruta':        'ruta',
  '/repartidor/incidencias': 'incidencias',
  '/repartidor/perfil':      'perfil',
};

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

interface OrderItem { nombre: string; cantidad: number; sku: string; }
interface AssignedOrder {
  _id: string;
  id_pedido?: string;
  status_final: string;
  usuario?: { nombre?: string; email?: string; direccion?: string };
  direccion_entrega?: string;
  items?: OrderItem[];
  total?: number;
}

interface RouteStop {
  order_id: string;
  id_pedido?: string;
  cliente?: string;
  direccion?: string;
  status?: string;
  eta?: string;
  stop_number?: number;
}

interface Route {
  _id?: string;
  cedis_id?: string;
  status?: string;
  stops?: RouteStop[];
}

const STATUS_BADGE: Record<string, string> = {
  'Pendiente':      'bg-yellow-100 text-yellow-700',
  'Confirmado':     'bg-blue-100 text-blue-700',
  'En preparación': 'bg-indigo-100 text-indigo-700',
  'En camino':      'bg-orange-100 text-orange-700',
  'Entregado':      'bg-green-100 text-green-700',
};

const INCIDENT_TYPES = [
  { key: 'producto_faltante',   label: 'Producto faltante' },
  { key: 'producto_incorrecto', label: 'Producto incorrecto' },
  { key: 'cliente_ausente',     label: 'Cliente ausente' },
  { key: 'accidente',           label: 'Accidente / vehículo' },
];

interface DriverProfile {
  calificacion?: number;
  total_entregas?: number;
  tiempo_promedio?: number;
  area?: string;
  zona?: string;
}

export default function RepartidorPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<AssignedOrder[]>([]);
  const [route, setRoute] = useState<Route | null>(null);
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pedidos' | 'ruta' | 'incidencias' | 'perfil'>(
    REP_PATH_TAB[location.pathname] ?? 'pedidos'
  );

  useEffect(() => {
    setActiveTab(REP_PATH_TAB[location.pathname] ?? 'pedidos');
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/', { replace: true }); };

  const [incidentOrder, setIncidentOrder] = useState('');
  const [incidentType, setIncidentType] = useState('producto_faltante');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [incidentDone, setIncidentDone] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const token = localStorage.getItem('or_token') ?? '';
  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/driver/orders`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/driver/route/today`, { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/driver/profile`, { headers: h }).then(r => r.ok ? r.json() : null),
    ])
      .then(([o, r, p]) => {
        setOrders(Array.isArray(o) ? o : o?.orders ?? []);
        setRoute(r && typeof r === 'object' ? r : null);
        setProfile(p && typeof p === 'object' ? p : null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (orderId: string, status: 'en_camino' | 'entregado') => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`${API}/api/driver/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: h,
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const label = status === 'en_camino' ? 'En camino' : 'Entregado';
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status_final: label } : o));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const submitIncident = async () => {
    if (!incidentOrder || !incidentDesc.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`${API}/api/driver/orders/${incidentOrder}/incident`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ tipo: incidentType, descripcion: incidentDesc }),
      });
      setIncidentDone(true);
      setIncidentDesc('');
      setTimeout(() => setIncidentDone(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const startRoute = async () => {
    const res = await fetch(`${API}/api/driver/route/start`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ cedis_id: '3012' }),
    });
    if (res.ok) {
      const r = await res.json();
      setRoute(r?.route ?? r);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#E61A27] rounded-full animate-spin" />
      </div>
    );
  }

  const deliveredOrders = orders.filter(o => o.status_final === 'Entregado');

  return (
    <div className="space-y-4">

      {/* ── PEDIDOS ASIGNADOS ─────────────────────────────────────────── */}
      {activeTab === 'pedidos' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-gray-900 font-semibold text-sm">Sin pedidos asignados</p>
              <p className="text-gray-400 text-xs mt-1">Los pedidos aparecerán aquí cuando sean asignados.</p>
            </div>
          ) : orders.map(o => {
            const address = o.direccion_entrega ?? o.usuario?.direccion;
            const isUpdating = updatingId === o._id;

            return (
              <div key={o._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Card header: status + ID + amount */}
                <div className="flex items-center justify-between px-4 pt-4 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[o.status_final] ?? 'bg-gray-100 text-gray-600'}`}>
                      {o.status_final}
                    </span>
                    <span className="text-xs font-mono text-gray-400">{o.id_pedido ?? o._id}</span>
                  </div>
                  {o.total !== undefined && (
                    <span className="text-sm font-bold text-gray-900 tabular-nums">${o.total.toLocaleString('es-MX')} MXN</span>
                  )}
                </div>

                {/* Primary info: address */}
                {address && (
                  <div className="px-4 pb-3 flex items-start gap-2">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm font-semibold text-gray-900 leading-snug">{address}</p>
                  </div>
                )}

                {/* Customer */}
                {o.usuario?.nombre && (
                  <div className="px-4 pb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-sm text-gray-600">{o.usuario.nombre}</p>
                  </div>
                )}

                {/* Items */}
                {(o.items ?? []).length > 0 && (
                  <div className="mx-4 mb-3 bg-gray-50 rounded-xl p-3 space-y-1">
                    {o.items!.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex justify-between text-xs text-gray-600">
                        <span className="truncate mr-2">{item.nombre}</span>
                        <span className="font-mono shrink-0 text-gray-400">×{item.cantidad}</span>
                      </div>
                    ))}
                    {(o.items!.length > 3) && (
                      <p className="text-xs text-gray-400">+{o.items!.length - 3} más</p>
                    )}
                  </div>
                )}

                {/* Action buttons — large, thumb-friendly */}
                <div className="px-4 pb-4 flex flex-col gap-2">
                  {o.status_final === 'Confirmado' && (
                    <button
                      onClick={() => updateStatus(o._id, 'en_camino')}
                      disabled={isUpdating}
                      className="w-full h-14 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isUpdating ? (
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0M3 7h18M3 7l2-4h14l2 4M3 7v10h1m15 0h1V7" />
                          </svg>
                          Salir a entregar
                        </>
                      )}
                    </button>
                  )}
                  {o.status_final === 'En camino' && (
                    <button
                      onClick={() => updateStatus(o._id, 'entregado')}
                      disabled={isUpdating}
                      className="w-full h-14 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isUpdating ? (
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Confirmar entrega
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => { setActiveTab('incidencias'); setIncidentOrder(o._id); }}
                    className="w-full h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                  >
                    Reportar incidencia
                  </button>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* ── RUTA ─────────────────────────────────────────────────────── */}
      {activeTab === 'ruta' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <RouteMap stops={route?.stops ?? []} />

          {!route ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center space-y-4">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <p className="text-gray-900 font-semibold text-sm">Sin ruta activa</p>
                <p className="text-gray-400 text-xs mt-1">Inicia tu ruta del día para ver las paradas.</p>
              </div>
              <button
                onClick={startRoute}
                className="bg-[#E61A27] text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#B31217] transition-colors"
              >
                Iniciar ruta del día
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Paradas de hoy</h2>
                {route.status && (
                  <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full capitalize">{route.status}</span>
                )}
              </div>

              {(route.stops ?? []).length === 0 ? (
                <p className="text-sm text-gray-400">Sin paradas en esta ruta.</p>
              ) : (
                <div className="space-y-3">
                  {route.stops!.map((stop, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-full bg-[#E61A27]/10 flex items-center justify-center text-xs font-extrabold text-[#E61A27] shrink-0 tabular-nums">
                        {stop.stop_number ?? i + 1}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm font-semibold text-gray-900">{stop.cliente ?? stop.id_pedido ?? stop.order_id}</p>
                        {stop.direccion && <p className="text-xs text-gray-400 mt-0.5">{stop.direccion}</p>}
                        {stop.eta && <p className="text-xs text-gray-400 mt-0.5">ETA: {stop.eta}</p>}
                      </div>
                      {stop.status && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          stop.status === 'completada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>{stop.status}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* ── INCIDENCIAS ──────────────────────────────────────────────── */}
      {activeTab === 'incidencias' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
            <div>
              <h2 className="text-base font-bold text-gray-900">Reportar incidencia</h2>
              <p className="text-xs text-gray-400 mt-0.5">Describe el problema para que el equipo pueda atenderlo.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pedido</label>
                <select
                  value={incidentOrder}
                  onChange={e => setIncidentOrder(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E61A27]/20 focus:border-[#E61A27]"
                >
                  <option value="">Selecciona un pedido</option>
                  {orders.map(o => (
                    <option key={o._id} value={o._id}>{o.id_pedido ?? o._id}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tipo de incidencia</label>
                <select
                  value={incidentType}
                  onChange={e => setIncidentType(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E61A27]/20 focus:border-[#E61A27]"
                >
                  {INCIDENT_TYPES.map(t => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Descripción</label>
                <textarea
                  value={incidentDesc}
                  onChange={e => setIncidentDesc(e.target.value)}
                  rows={4}
                  placeholder="Describe brevemente lo que pasó…"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#E61A27]/20 focus:border-[#E61A27]"
                />
              </div>
            </div>

            <AnimatePresence>
              {incidentDone && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 font-semibold flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Incidencia reportada correctamente.
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={submitIncident}
              disabled={submitting || !incidentOrder || !incidentDesc.trim()}
              className="w-full h-14 bg-[#E61A27] text-white font-bold text-base rounded-xl hover:bg-[#B31217] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : 'Enviar reporte'}
            </button>
          </div>
        </motion.div>
      )}

      {/* ── PERFIL ───────────────────────────────────────────────────── */}
      {activeTab === 'perfil' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

          {/* Profile header */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#E61A27] flex items-center justify-center shrink-0">
              <span className="text-white font-extrabold text-2xl">
                {(user?.nombre ?? 'R')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user?.nombre ?? 'Repartidor'}</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {profile?.area ?? profile?.zona ?? (route as any)?.area ?? (route as any)?.zona ?? 'Repartidor de campo'}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-xl font-bold text-gray-900 tabular-nums">
                {profile?.calificacion != null ? profile.calificacion.toFixed(1) : '—'}
              </p>
              <p className="text-[11px] text-gray-400 mt-1 leading-tight font-medium">Calificación</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-xl font-bold text-gray-900 tabular-nums">
                {profile?.total_entregas != null
                  ? profile.total_entregas.toLocaleString('es-MX')
                  : deliveredOrders.length > 0 ? deliveredOrders.length : '—'}
              </p>
              <p className="text-[11px] text-gray-400 mt-1 leading-tight font-medium">Entregas</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-xl font-bold text-gray-900 tabular-nums">
                {profile?.tiempo_promedio != null ? `${profile.tiempo_promedio}m` : '—'}
              </p>
              <p className="text-[11px] text-gray-400 mt-1 leading-tight font-medium">T. promedio</p>
            </div>
          </div>

          {/* Quick nav */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              onClick={() => navigate('/repartidor/ruta')}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-sm font-medium text-gray-900">Mis rutas</span>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full h-14 bg-white border border-red-100 text-[#E61A27] font-bold text-base rounded-2xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </button>
        </motion.div>
      )}
    </div>
  );
}
