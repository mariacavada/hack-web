import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import RouteMap, { type CedisInfo, type Stop as RouteStop } from './RouteMap';
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
  eta_entrega?: string;
  status_actual?: string;
}

/** Shape returned by GET /api/driver/orders */
interface DriverOrderResponse {
  order?: Record<string, any>;
  detalles?: Record<string, any>[];
  tracking?: { status_actual?: string; eta_entrega?: string };
}

const STATUS_NORMALIZE: Record<string, string> = {
  pendiente:        'Pendiente',
  confirmado:       'Confirmado',
  en_preparacion:   'En preparación',
  'en preparación': 'En preparación',
  en_camino:        'En camino',
  'en camino':      'En camino',
  entregado:        'Entregado',
  cancelado:        'Cancelado',
};

function normalizeStatus(s?: string): string {
  if (!s) return 'Pendiente';
  return STATUS_NORMALIZE[s.toLowerCase()] ?? STATUS_NORMALIZE[s.toLowerCase().replace(/\s+/g, '_')] ?? s;
}

function parseDriverOrders(raw: any): AssignedOrder[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: DriverOrderResponse | AssignedOrder) => {
    // Nested shape: { order, detalles[], tracking }
    if ('order' in item && item.order) {
      const o   = item.order as Record<string, any>;
      const det = (item.detalles ?? []) as Record<string, any>[];
      const trk = item.tracking ?? {};
      return {
        _id:               o._id ?? o.id_pedido,
        id_pedido:         o.id_pedido,
        status_final:      normalizeStatus(o.status_final ?? trk.status_actual),
        usuario:           o.usuario ?? o.customer ?? null,
        direccion_entrega: o.direccion_entrega ?? o.direccion ?? o.usuario?.direccion ?? null,
        total:             o.total ?? o.subtotal,
        eta_entrega:       trk.eta_entrega ?? undefined,
        status_actual:     trk.status_actual ?? undefined,
        items: det.map(d => ({
          sku:      d.sku_solicitado ?? d.sku ?? '',
          nombre:   d.nombre_sku_solicitado ?? d.nombre ?? d.sku_solicitado ?? 'Producto',
          cantidad: d.quantity ?? d.cantidad ?? 1,
        })),
      } satisfies AssignedOrder;
    }
    // Flat shape (already an order object)
    const o = item as any;
    return {
      _id:               o._id ?? o.id_pedido,
      id_pedido:         o.id_pedido,
      status_final:      normalizeStatus(o.status_final),
      usuario:           o.usuario ?? null,
      direccion_entrega: o.direccion_entrega ?? o.direccion ?? null,
      total:             o.total ?? o.subtotal,
      items:             o.items ?? o.detalles ?? [],
    } satisfies AssignedOrder;
  });
}


interface Route {
  _id?: string;
  cedis_id?: string;
  current_status?: string;
  loaded_at?: string;
  departed_at?: string;
  finished_at?: string;
  stops?: RouteStop[];
}

interface DriverProfile {
  calificacion?: number;
  total_entregas?: number;
  tiempo_promedio?: number;
  area?: string;
  zona?: string;
}

const STATUS_BADGE: Record<string, string> = {
  'Pendiente':      'bg-yellow-100 text-yellow-700',
  'Confirmado':     'bg-blue-100 text-blue-700',
  'En preparación': 'bg-indigo-100 text-indigo-700',
  'En camino':      'bg-orange-100 text-orange-700',
  'Entregado':      'bg-green-100 text-green-700',
};

const ROUTE_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  programado: { label: 'Programado',       color: 'bg-blue-100 text-blue-700' },
  cargando:   { label: 'Cargando camión',  color: 'bg-yellow-100 text-yellow-700' },
  faltante:   { label: 'Faltante',         color: 'bg-red-100 text-red-700' },
  salio:      { label: 'Salió del CEDIS',  color: 'bg-orange-100 text-orange-700' },
  en_camino:  { label: 'En camino',        color: 'bg-orange-100 text-orange-700' },
  entregado:  { label: 'Entregado',        color: 'bg-green-100 text-green-700' },
  cancelado:  { label: 'Cancelado',        color: 'bg-gray-100 text-gray-500' },
};

const INCIDENT_TYPES = [
  { key: 'producto_faltante',    label: 'Producto faltante' },
  { key: 'producto_danado',      label: 'Producto dañado' },
  { key: 'cliente_ausente',      label: 'Cliente ausente' },
  { key: 'direccion_incorrecta', label: 'Dirección incorrecta' },
  { key: 'otro',                 label: 'Otro' },
];

export default function RepartidorPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [orders, setOrders]               = useState<AssignedOrder[]>([]);
  const [route, setRoute]                 = useState<Route | null>(null);
  const [cedisLocation, setCedisLocation] = useState<CedisInfo | null>(null);
  const [profile, setProfile]             = useState<DriverProfile | null>(null);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState<'pedidos' | 'ruta' | 'incidencias' | 'perfil'>(
    REP_PATH_TAB[location.pathname] ?? 'pedidos'
  );

  useEffect(() => {
    setActiveTab(REP_PATH_TAB[location.pathname] ?? 'pedidos');
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/', { replace: true }); };

  // Incident form state
  const [incidentOrder, setIncidentOrder] = useState('');
  const [incidentType, setIncidentType]   = useState('producto_faltante');
  const [incidentDesc, setIncidentDesc]   = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [incidentDone, setIncidentDone]   = useState(false);

  // Route action state
  const [routeActionLoading, setRouteActionLoading] = useState(false);
  const [completingStop, setCompletingStop]         = useState<number | null>(null);
  const [updatingId, setUpdatingId]                 = useState<string | null>(null);

  // Missing items form (route-level)
  const [showMissingForm, setShowMissingForm] = useState(false);
  const [missingNotes, setMissingNotes]       = useState('');

  const token = localStorage.getItem('or_token') ?? '';
  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/driver/orders`,      { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/driver/route/today`, { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/driver/profile`,     { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/map/overview`,       { headers: h }).then(r => r.ok ? r.json() : null),
    ])
      .then(([o, r, p, mapData]) => {
        const fetchedOrders: AssignedOrder[] = parseDriverOrders(Array.isArray(o) ? o : o?.orders ?? []);
        const fetchedRoute: Route | null     = r && typeof r === 'object' ? r : null;

        setOrders(fetchedOrders);
        setRoute(fetchedRoute);
        setProfile(p && typeof p === 'object' ? p : null);

        // Match CEDIS from map overview to the driver's route
        if (mapData?.cedis?.length) {
          const allCedis: any[] = mapData.cedis;
          let match = fetchedRoute?.cedis_id
            ? allCedis.find(c => c.cedis_id === fetchedRoute.cedis_id)
            : null;
          if (!match) match = allCedis[0];
          if (match?.ubicacion) {
            setCedisLocation({
              lat: match.ubicacion.lat,
              lng: match.ubicacion.lng,
              nombre: match.nombre ?? 'CEDIS',
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Order-level status update ──────────────────────────────────────────────
  // The API uses id_pedido (string), not mongo _id
  const updateOrderStatus = async (order: AssignedOrder, status: 'en_camino' | 'entregado') => {
    const apiId = order.id_pedido ?? order._id;
    setUpdatingId(order._id);
    try {
      const res = await fetch(`${API}/api/driver/orders/${apiId}/status`, {
        method: 'PATCH',
        headers: h,
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const label = status === 'en_camino' ? 'En camino' : 'Entregado';
        setOrders(prev => prev.map(o => o._id === order._id ? { ...o, status_final: label } : o));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Route lifecycle actions ────────────────────────────────────────────────
  const handleLoad = async () => {
    if (!route?._id) return;
    setRouteActionLoading(true);
    try {
      const res = await fetch(`${API}/api/routes/${route._id}/load`, { method: 'PATCH', headers: h });
      if (res.ok) setRoute(prev => prev ? { ...prev, current_status: 'cargando' } : prev);
    } finally {
      setRouteActionLoading(false);
    }
  };

  const handleDepart = async () => {
    if (!route?._id) return;
    setRouteActionLoading(true);
    try {
      const res = await fetch(`${API}/api/routes/${route._id}/depart`, { method: 'PATCH', headers: h });
      if (res.ok) setRoute(prev => prev ? { ...prev, current_status: 'salio' } : prev);
    } finally {
      setRouteActionLoading(false);
    }
  };

  const handleCompleteStop = async (stopIndex: number) => {
    if (!route?._id) return;
    const stop = route.stops?.[stopIndex];
    const stopNum = stop?.stop_number ?? stopIndex + 1;
    setCompletingStop(stopIndex);
    try {
      const res = await fetch(`${API}/api/driver/route/${route._id}/stop/${stopNum}/complete`, {
        method: 'PATCH',
        headers: h,
      });
      if (res.ok) {
        setRoute(prev => {
          if (!prev?.stops) return prev;
          const stops = prev.stops.map((s, i) =>
            i === stopIndex ? { ...s, status: 'completada' } : s
          );
          return { ...prev, stops };
        });
      }
    } finally {
      setCompletingStop(null);
    }
  };

  const handleMissingRoute = async () => {
    if (!route?._id || !missingNotes.trim()) return;
    setRouteActionLoading(true);
    try {
      const res = await fetch(`${API}/api/routes/${route._id}/missing`, {
        method: 'PATCH',
        headers: h,
        body: JSON.stringify({ notes: missingNotes }),
      });
      if (res.ok) {
        setRoute(prev => prev ? { ...prev, current_status: 'faltante' } : prev);
        setMissingNotes('');
        setShowMissingForm(false);
      }
    } finally {
      setRouteActionLoading(false);
    }
  };

  // Start route via Gemini (when no route exists yet)
  const startRoute = async () => {
    setRouteActionLoading(true);
    try {
      const res = await fetch(`${API}/api/driver/route/start`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setRoute(data?.route ?? data?.ruta ?? data);
      }
    } finally {
      setRouteActionLoading(false);
    }
  };

  // ── Incident submission ────────────────────────────────────────────────────
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#E61A27] rounded-full animate-spin" />
      </div>
    );
  }

  const deliveredOrders = orders.filter(o => o.status_final === 'Entregado');
  const routeStatus     = route?.current_status ?? 'programado';
  const routeStatusMeta = ROUTE_STATUS_LABEL[routeStatus];

  return (
    <div className="space-y-4">

      {/* ── PEDIDOS ASIGNADOS ──────────────────────────────────────────────── */}
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
            const address   = o.direccion_entrega ?? o.usuario?.direccion;
            const isUpdating = updatingId === o._id;

            return (
              <div key={o._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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

                {address && (
                  <div className="px-4 pb-2 flex items-start gap-2">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm font-semibold text-gray-900 leading-snug">{address}</p>
                  </div>
                )}

                {o.eta_entrega && (
                  <div className="px-4 pb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-gray-500">
                      ETA: <span className="font-semibold text-gray-700">{o.eta_entrega}</span>
                    </p>
                  </div>
                )}

                {o.usuario?.nombre && (
                  <div className="px-4 pb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-sm text-gray-600">{o.usuario.nombre}</p>
                  </div>
                )}

                {(o.items ?? []).length > 0 && (
                  <div className="mx-4 mb-3 bg-gray-50 rounded-xl p-3 space-y-1">
                    {o.items!.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex justify-between text-xs text-gray-600">
                        <span className="truncate mr-2">{item.nombre}</span>
                        <span className="font-mono shrink-0 text-gray-400">×{item.cantidad}</span>
                      </div>
                    ))}
                    {o.items!.length > 3 && (
                      <p className="text-xs text-gray-400">+{o.items!.length - 3} más</p>
                    )}
                  </div>
                )}

                <div className="px-4 pb-4 flex flex-col gap-2">
                  {o.status_final === 'Confirmado' && (
                    <button
                      onClick={() => updateOrderStatus(o, 'en_camino')}
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
                      onClick={() => updateOrderStatus(o, 'entregado')}
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
                    onClick={() => { setActiveTab('incidencias'); setIncidentOrder(o.id_pedido ?? o._id); }}
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

      {/* ── RUTA ──────────────────────────────────────────────────────────── */}
      {activeTab === 'ruta' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

          {/* Map + stop list */}
          <RouteMap
            stops={route?.stops ?? []}
            cedis={cedisLocation}
            canComplete={['salio', 'en_camino'].includes(routeStatus)}
            completingStop={completingStop}
            onCompleteStop={handleCompleteStop}
            onMissingStop={(_, orderId) => {
              setActiveTab('incidencias');
              if (orderId) setIncidentOrder(orderId);
              setIncidentType('producto_faltante');
            }}
          />

          {!route ? (
            /* No route yet */
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center space-y-4">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <p className="text-gray-900 font-semibold text-sm">Sin ruta activa</p>
                <p className="text-gray-400 text-xs mt-1">Inicia tu ruta del día para ver las paradas optimizadas.</p>
              </div>
              <button
                onClick={startRoute}
                disabled={routeActionLoading}
                className="bg-[#E61A27] text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#B31217] disabled:opacity-60 transition-colors flex items-center gap-2 mx-auto"
              >
                {routeActionLoading
                  ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : null}
                Iniciar ruta del día
              </button>
            </div>
          ) : (
            <>
              {/* Route status + lifecycle actions */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900">Estado de la ruta</h2>
                  {routeStatusMeta && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${routeStatusMeta.color}`}>
                      {routeStatusMeta.label}
                    </span>
                  )}
                </div>

                {/* Action button based on current status */}
                {routeStatus === 'programado' && (
                  <button
                    onClick={handleLoad}
                    disabled={routeActionLoading}
                    className="w-full h-14 rounded-xl bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-white font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    {routeActionLoading ? (
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Comenzar carga del camión
                      </>
                    )}
                  </button>
                )}

                {routeStatus === 'cargando' && (
                  <div className="space-y-2">
                    <button
                      onClick={handleDepart}
                      disabled={routeActionLoading}
                      className="w-full h-14 rounded-xl bg-[#E61A27] hover:bg-[#B31217] disabled:opacity-60 text-white font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      {routeActionLoading ? (
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0M3 7h18M3 7l2-4h14l2 4M3 7v10h1m15 0h1V7" />
                          </svg>
                          Salir del CEDIS
                        </>
                      )}
                    </button>
                    {/* Report missing items for the whole route */}
                    <button
                      onClick={() => setShowMissingForm(v => !v)}
                      className="w-full h-11 rounded-xl border border-red-200 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Reportar pedido faltante en carga
                    </button>
                  </div>
                )}

                <AnimatePresence>
                  {showMissingForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 space-y-3">
                        <textarea
                          value={missingNotes}
                          onChange={e => setMissingNotes(e.target.value)}
                          rows={3}
                          placeholder="Describe qué pedido o productos faltan en el camión…"
                          className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                        />
                        <button
                          onClick={handleMissingRoute}
                          disabled={routeActionLoading || !missingNotes.trim()}
                          className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          {routeActionLoading
                            ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            : 'Confirmar faltante'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </>
          )}
        </motion.div>
      )}

      {/* ── INCIDENCIAS ────────────────────────────────────────────────────── */}
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
                    <option key={o._id} value={o.id_pedido ?? o._id}>{o.id_pedido ?? o._id}</option>
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
                {incidentType === 'producto_faltante' && (
                  <p className="text-xs text-orange-600 font-medium flex items-center gap-1 mt-1">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    El cliente recibirá una notificación automática.
                  </p>
                )}
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

      {/* ── PERFIL ─────────────────────────────────────────────────────────── */}
      {activeTab === 'perfil' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
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
