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
  { key: 'producto_faltante',  label: 'Producto faltante' },
  { key: 'producto_incorrecto', label: 'Producto incorrecto' },
  { key: 'cliente_ausente',    label: 'Cliente ausente' },
  { key: 'accidente',          label: 'Accidente / vehículo' },
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

  // Incident form
  const [incidentOrder, setIncidentOrder] = useState('');
  const [incidentType, setIncidentType] = useState('producto_faltante');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [incidentDone, setIncidentDone] = useState(false);

  // Status update
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
    <div className="space-y-6">

      {/* PEDIDOS ASIGNADOS */}
      {activeTab === 'pedidos' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
              <p className="text-gray-400 text-sm">No tienes pedidos asignados.</p>
            </div>
          ) : orders.map(o => (
            <div key={o._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-mono font-bold text-gray-700">{o.id_pedido ?? o._id}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[o.status_final] ?? 'bg-gray-100 text-gray-600'}`}>
                      {o.status_final}
                    </span>
                  </div>
                  {o.usuario?.nombre && (
                    <p className="text-xs text-gray-500 mt-1">{o.usuario.nombre}</p>
                  )}
                  {(o.direccion_entrega ?? o.usuario?.direccion) && (
                    <p className="text-xs text-gray-400 mt-0.5">📍 {o.direccion_entrega ?? o.usuario?.direccion}</p>
                  )}
                </div>
                {o.total !== undefined && (
                  <p className="text-sm font-bold text-gray-900 shrink-0">${o.total.toLocaleString('es-MX')} MXN</p>
                )}
              </div>

              {(o.items ?? []).length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  {o.items!.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-gray-600">
                      <span className="truncate mr-2">{item.nombre}</span>
                      <span className="font-mono shrink-0">×{item.cantidad}</span>
                    </div>
                  ))}
                  {(o.items!.length > 3) && (
                    <p className="text-xs text-gray-400">+{o.items!.length - 3} más</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {o.status_final === 'Confirmado' && (
                  <button
                    onClick={() => updateStatus(o._id, 'en_camino')}
                    disabled={updatingId === o._id}
                    className="flex-1 text-sm font-semibold bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                  >
                    {updatingId === o._id ? 'Actualizando…' : 'Marcar en camino'}
                  </button>
                )}
                {o.status_final === 'En camino' && (
                  <button
                    onClick={() => updateStatus(o._id, 'entregado')}
                    disabled={updatingId === o._id}
                    className="flex-1 text-sm font-semibold bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {updatingId === o._id ? 'Actualizando…' : 'Marcar entregado'}
                  </button>
                )}
                <button
                  onClick={() => { setActiveTab('incidencias'); setIncidentOrder(o._id); }}
                  className="text-sm font-medium text-gray-500 border border-gray-200 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Incidencia
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* RUTA */}
      {activeTab === 'ruta' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Map showing stops (mock coordinates when missing) */}
          <RouteMap stops={route?.stops ?? []} />

          {!route ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center space-y-3">
              <p className="text-gray-500 text-sm">No hay ruta activa para hoy.</p>
              <button
                onClick={startRoute}
                className="bg-[#E61A27] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#B31217] transition-colors"
              >
                Iniciar ruta del día
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Ruta de hoy</h2>
                {route.status && (
                  <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full capitalize">{route.status}</span>
                )}
              </div>

              {(route.stops ?? []).length === 0 ? (
                <p className="text-sm text-gray-400">Sin paradas en esta ruta.</p>
              ) : (
                <div className="space-y-3">
                  {route.stops!.map((stop, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-7 h-7 rounded-full bg-[#E61A27]/10 flex items-center justify-center text-xs font-bold text-[#E61A27] shrink-0">
                        {stop.stop_number ?? i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{stop.cliente ?? stop.id_pedido ?? stop.order_id}</p>
                        {stop.direccion && <p className="text-xs text-gray-400 mt-0.5">📍 {stop.direccion}</p>}
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

      {/* INCIDENCIAS */}
      {activeTab === 'incidencias' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h2 className="text-base font-bold text-gray-900">Reportar incidencia</h2>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pedido</label>
              <select
                value={incidentOrder}
                onChange={e => setIncidentOrder(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#E61A27]"
              >
                <option value="">Selecciona un pedido</option>
                {orders.map(o => (
                  <option key={o._id} value={o._id}>{o.id_pedido ?? o._id}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo de incidencia</label>
              <select
                value={incidentType}
                onChange={e => setIncidentType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#E61A27]"
              >
                {INCIDENT_TYPES.map(t => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Descripción</label>
              <textarea
                value={incidentDesc}
                onChange={e => setIncidentDesc(e.target.value)}
                rows={3}
                placeholder="Describe brevemente lo que pasó…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#E61A27]"
              />
            </div>

            <AnimatePresence>
              {incidentDone && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 font-medium"
                >
                  ✓ Incidencia reportada correctamente.
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={submitIncident}
              disabled={submitting || !incidentOrder || !incidentDesc.trim()}
              className="w-full bg-[#E61A27] text-white font-semibold py-3 rounded-xl hover:bg-[#B31217] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Enviando…' : 'Reportar incidencia'}
            </button>
          </div>
        </motion.div>
      )}

      {/* PERFIL */}
      {activeTab === 'perfil' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

          {/* Header card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#E61A27] flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-2xl">
                  {(user?.nombre ?? 'R')[0].toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user?.nombre ?? 'Repartidor'}</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {profile?.area ?? profile?.zona ?? (route as any)?.area ?? (route as any)?.zona ?? 'Repartidor'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center">
              <p className="text-xl font-bold text-gray-900">
                {profile?.calificacion != null ? profile.calificacion.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-gray-400 mt-1 leading-tight">de calificación</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center">
              <p className="text-xl font-bold text-gray-900">
                {profile?.total_entregas != null
                  ? profile.total_entregas.toLocaleString('es-MX')
                  : deliveredOrders.length > 0 ? deliveredOrders.length : '—'}
              </p>
              <p className="text-xs text-gray-400 mt-1 leading-tight">entregas realizadas</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center">
              <p className="text-xl font-bold text-gray-900">
                {profile?.tiempo_promedio != null ? `${profile.tiempo_promedio} min` : '—'}
              </p>
              <p className="text-xs text-gray-400 mt-1 leading-tight">tiempo promedio</p>
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
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
            className="w-full bg-white border border-red-200 text-[#E61A27] font-semibold py-4 rounded-2xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
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
