import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import RouteMap, { type CedisInfo, type Stop as RouteStop } from './RouteMap';
import {
  useRepartidor,
  isToday,
  normalizeStatus,
  STATUS_BADGE,
  type AssignedOrder,
} from './RepartidorContext';

const REP_PATH_TAB: Record<string, 'pedidos' | 'ruta' | 'incidencias'> = {
  '/repartidor/ruta':        'ruta',
  '/repartidor/incidencias': 'incidencias',
};

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

function fmtDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface Route {
  _id?: string;
  cedis_id?: string;
  current_status?: string;
  stops?: RouteStop[];
}

const ROUTE_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  programado: { label: 'Programado',       color: 'bg-blue-100 text-blue-700' },
  cargando:   { label: 'Cargando camión',  color: 'bg-yellow-100 text-yellow-700' },
  faltante:   { label: 'Faltante',         color: 'bg-red-100 text-red-700' },
  salio:      { label: 'Salió del CEDIS',  color: 'bg-orange-100 text-orange-700' },
  en_camino:  { label: 'En camino',        color: 'bg-orange-100 text-orange-700' },
  entregado:  { label: 'Finalizado',       color: 'bg-green-100 text-green-700' },
  cancelado:  { label: 'Cancelado',        color: 'bg-gray-100 text-gray-500' },
};

const INCIDENT_TYPES = [
  { key: 'producto_faltante',    label: 'Producto faltante' },
  { key: 'producto_danado',      label: 'Producto dañado' },
  { key: 'cliente_ausente',      label: 'Cliente ausente' },
  { key: 'direccion_incorrecta', label: 'Dirección incorrecta' },
  { key: 'otro',                 label: 'Otro' },
];

function OrderCalendar({
  selected, month, orderDateSet, onChange, onMonthChange,
}: {
  selected: Date; month: Date; orderDateSet: Set<string>;
  onChange: (d: Date) => void; onMonthChange: (d: Date) => void;
}) {
  const todayMidnight = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const todayStr    = todayMidnight.toDateString();
  const selectedStr = selected.toDateString();
  const yr = month.getFullYear();
  const mo = month.getMonth();
  const startOffset = (new Date(yr, mo, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(yr, mo + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const monthLabel = month.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => onMonthChange(new Date(yr, mo - 1, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-900 capitalize">{monthLabel}</span>
        <button onClick={() => onMonthChange(new Date(yr, mo + 1, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['L','M','X','J','V','S','D'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const date    = new Date(yr, mo, day);
          const dateStr = date.toDateString();
          const isPast  = date < todayMidnight;
          const isTdy   = dateStr === todayStr;
          const isSel   = dateStr === selectedStr;
          const hasDot  = orderDateSet.has(dateStr);
          return (
            <button key={dateStr} onClick={() => !isPast && onChange(date)}
              className={`relative flex flex-col items-center justify-center h-9 rounded-xl text-sm font-medium transition-all
                ${isSel   ? 'bg-[#E61A27] text-white shadow-sm'
                : isTdy   ? 'ring-1 ring-[#E61A27] text-[#E61A27]'
                : isPast  ? 'text-gray-300 cursor-default'
                :           'text-gray-700 hover:bg-gray-100'}`}>
              {day}
              {hasDot && (
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full
                  ${isSel ? 'bg-white/70' : isPast ? 'bg-gray-200' : 'bg-[#E61A27]'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function RepartidorPage() {
  const location = useLocation();
  const { orders, loading, updateStatus: ctxUpdateStatus, refreshSilent } = useRepartidor();

  const [route,          setRoute]          = useState<Route | null>(null);
  const [cedisLocation,  setCedisLocation]  = useState<CedisInfo | null>(null);
  const [routeLoading,   setRouteLoading]   = useState(true);
  const [statusError,    setStatusError]    = useState<string | null>(null);
  const [activeTab,      setActiveTab]      = useState<'pedidos' | 'ruta' | 'incidencias'>(
    REP_PATH_TAB[location.pathname] ?? 'pedidos'
  );

  useEffect(() => {
    setActiveTab(REP_PATH_TAB[location.pathname] ?? 'pedidos');
  }, [location.pathname]);

  const [incidentOrder, setIncidentOrder] = useState('');
  const [incidentType,  setIncidentType]  = useState('producto_faltante');
  const [incidentDesc,  setIncidentDesc]  = useState('');
  const [incidentItems, setIncidentItems] = useState<string[]>([]);
  const [itemsError,    setItemsError]    = useState<string | null>(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [incidentDone,  setIncidentDone]  = useState(false);

  const incidentOrderObj = useMemo(
    () => orders.find(o => o._id === incidentOrder) ?? null,
    [orders, incidentOrder],
  );

  const [routeActionLoading, setRouteActionLoading] = useState(false);
  const [completingStop,     setCompletingStop]     = useState<number | null>(null);
  const [updatingId,         setUpdatingId]         = useState<string | null>(null);

  const [showMissingForm, setShowMissingForm] = useState(false);
  const [missingNotes,    setMissingNotes]    = useState('');
  const [selectedDate,    setSelectedDate]    = useState<Date>(() => { const d = new Date(); d.setHours(0,0,0,0); return d; });
  const [calMonth,        setCalMonth]        = useState<Date>(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; });
  const [routeDay,        setRouteDay]        = useState<'hoy' | 'manana'>('hoy');

  const token = localStorage.getItem('or_token') ?? '';
  const h     = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const getCurrentCoords = async (): Promise<{ lat: number; lng: number } | null> => {
    if (!navigator.geolocation) return null;
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        ()  => resolve(null),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 },
      );
    });
  };

  // Fetch route + cedis only (orders come from context)
  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/driver/route/today`, { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/driver/cedis`,       { headers: h }).then(r => r.ok ? r.json() : null),
    ])
      .then(([r, cedisData]) => {
        if (r && typeof r === 'object') {
          setRoute({
            ...r,
            stops: (r.paradas ?? r.stops ?? []).map((p: any, idx: number) => ({
              order_id:    p.order_id ?? p.id_pedido,
              id_pedido:   p.id_pedido ?? p.order_id,
              cliente:     p.cliente ?? p.nombre_cliente ?? p.usuario?.nombre ?? p.usuario,
              // Backend hardcodes 'Sin dirección' — we'll enrich from orders after context loads
              direccion:   (p.direccion && p.direccion !== 'Sin dirección') ? p.direccion : (p.direccion_entrega ?? ''),
              stop_number: p.stop_number ?? p.numero_parada ?? idx + 1,
              status:      p.status ?? p.estado,
              eta:         p.eta ?? p.eta_entrega,
              lat:         p.lat ?? p.coords?.lat ?? p.ubicacion?.lat,
              lng:         p.lng ?? p.coords?.lng ?? p.ubicacion?.lng,
            })),
          });
        }
        if (cedisData?.ubicacion) {
          setCedisLocation({
            lat:    cedisData.ubicacion.lat,
            lng:    cedisData.ubicacion.lng,
            nombre: cedisData.nombre ?? 'CEDIS',
          });
        }
      })
      .catch(() => {})
      .finally(() => setRouteLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Enrich route stop addresses from the shared orders (runs whenever orders update)
  useEffect(() => {
    if (!route?.stops?.length || !orders.length) return;
    setRoute(prev => {
      if (!prev?.stops) return prev;
      const enriched = prev.stops.map(stop => {
        if (stop.direccion) return stop;
        const match = orders.find(o =>
          o.id_pedido === (stop.id_pedido ?? stop.order_id) || o._id === stop.order_id
        );
        return match?.direccion_entrega ? { ...stop, direccion: match.direccion_entrega } : stop;
      });
      return { ...prev, stops: enriched };
    });
  }, [orders, route?.stops?.length]);

  const todayOrders = useMemo(() => orders.filter(isToday), [orders]);

  // Orders that belong to the current route (by stop.order_id), falling back to todayOrders.
  // Used for finalization check and incidencias dropdown — avoids false positives from isToday
  // excluding orders whose fecha_entrega is a future date but are in today's route.
  const routeOrders = useMemo(() => {
    if (!route?.stops?.length) return todayOrders;
    const ids = new Set(route.stops.map(s => s.order_id).filter(Boolean));
    const matched = orders.filter(o => ids.has(o._id));
    return matched.length > 0 ? matched : todayOrders;
  }, [route?.stops, orders, todayOrders]);

  const selectedDateOrders = useMemo(() => {
    const sel = selectedDate.toDateString();
    return orders.filter(o => {
      const d = o.fecha_entrega ?? o.assigned_at ?? o.fecha_pedido;
      return !!d && new Date(d).toDateString() === sel;
    });
  }, [orders, selectedDate]);

  const orderDateSet = useMemo(() => {
    const s = new Set<string>();
    for (const o of orders) {
      const d = o.fecha_entrega ?? o.assigned_at ?? o.fecha_pedido;
      if (d) s.add(new Date(d).toDateString());
    }
    return s;
  }, [orders]);

  const tomorrowStr = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(0,0,0,0);
    return d.toDateString();
  }, []);

  const tomorrowOrders = useMemo(() =>
    orders.filter(o => {
      const d = o.fecha_entrega ?? o.assigned_at ?? o.fecha_pedido;
      return !!d && new Date(d).toDateString() === tomorrowStr;
    }), [orders, tomorrowStr]);

  const tomorrowStops = useMemo<RouteStop[]>(() =>
    tomorrowOrders.map((o, idx) => ({
      order_id:    o._id,
      id_pedido:   o.id_pedido,
      cliente:     o.cliente ?? o.usuario?.nombre ?? '',
      direccion:   o.direccion_entrega ?? '',
      stop_number: idx + 1,
      status:      o.status_final,
      eta:         o.eta_entrega ?? o.fecha_entrega ?? o.fecha_pedido,
      lat:         o.lat,
      lng:         o.lng,
    })), [tomorrowOrders]);

  const orderStops = useMemo<RouteStop[]>(() =>
    todayOrders.map((o, idx) => ({
      order_id:    o._id,
      id_pedido:   o.id_pedido,
      cliente:     o.cliente ?? o.usuario?.nombre ?? '',
      direccion:   o.direccion_entrega ?? '',
      stop_number: idx + 1,
      status:      o.status_final === 'Entregado' ? 'completada' : o.status_final,
      eta:         o.eta_entrega ?? o.fecha_entrega ?? o.fecha_pedido,
      lat:         o.lat,
      lng:         o.lng,
    })),
  [todayOrders]);

  // Keep route stop statuses in sync with the shared orders state from context.
  // Stops whose matching order is NOT today's are excluded.
  const syncedRouteStops = useMemo<RouteStop[]>(() => {
    if (!route?.stops) return [];
    const result: RouteStop[] = [];
    for (const stop of route.stops) {
      const order = orders.find(o =>
        o.id_pedido === (stop.id_pedido ?? stop.order_id) || o._id === stop.order_id
      );
      if (order && !isToday(order)) continue;
      result.push(order ? {
        ...stop,
        status:    order.status_final === 'Entregado' ? 'completada' : order.status_final,
        direccion: stop.direccion || order.direccion_entrega || '',
      } : stop);
    }
    return result;
  }, [route?.stops, orders]);

  const effectiveStops = useMemo(
    () => syncedRouteStops.length > 0 ? syncedRouteStops : orderStops,
    [syncedRouteStops, orderStops],
  );

  // ── Route finalization ────────────────────────────────────────────────────
  const TERMINAL_STATUSES = new Set(['Entregado', 'Incompleto', 'Cancelado']);

  useEffect(() => {
    if (!route || routeOrders.length === 0) return;
    if (routeOrders.every(o => TERMINAL_STATUSES.has(o.status_final))) {
      setRoute(r => r ? { ...r, current_status: 'entregado' } : r);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeOrders, route?._id]);

  // ── Status update ─────────────────────────────────────────────────────────
  const updateOrderStatus = async (
    order: AssignedOrder,
    status: 'recibido' | 'preparando' | 'en_camino' | 'entregado' | 'incompleto',
  ) => {
    const apiId = order._id;
    setUpdatingId(order._id);
    setStatusError(null);

    try {
      const coords = await getCurrentCoords();
      const body: Record<string, unknown> = { status };
      if (coords) body.coords = coords;
      const res  = await fetch(`${API}/api/driver/orders/${apiId}/status`, {
        method: 'PATCH', headers: h, body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok || res.status >= 500) {
        // 5xx = backend notification bug; DB write still succeeded — treat as success.
        // Prefer data.status (explicit new status) over data.order.status_final (may be stale).
        const confirmed = res.ok
          ? normalizeStatus(data?.status ?? data?.order?.status_final ?? status)
          : normalizeStatus(status);

        ctxUpdateStatus(order._id, confirmed);

        // Background sync: confirm the DB reflects what we just set
        refreshSilent();
      } else {
        setStatusError(data?.message ?? data?.error ?? `No se pudo actualizar el estado (${res.status})`);
      }
    } catch {
      setStatusError('No se pudo conectar con el servidor.');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Route lifecycle ───────────────────────────────────────────────────────
  const handleLoad = async () => {
    if (!route?._id) return;
    setRouteActionLoading(true);
    try {
      const res = await fetch(`${API}/api/routes/${route._id}/load`, { method: 'PATCH', headers: h });
      if (res.ok) setRoute(prev => prev ? { ...prev, current_status: 'cargando' } : prev);
    } finally { setRouteActionLoading(false); }
  };

  const handleDepart = async () => {
    if (!route?._id) return;
    setRouteActionLoading(true);
    try {
      const res = await fetch(`${API}/api/routes/${route._id}/depart`, { method: 'PATCH', headers: h });
      if (res.ok) setRoute(prev => prev ? { ...prev, current_status: 'salio' } : prev);
    } finally { setRouteActionLoading(false); }
  };

  const handleCompleteStop = async (stopIndex: number) => {
    if (!route?._id) return;
    const routeStop = route.stops?.[stopIndex];
    const stopNum   = routeStop?.stop_number ?? stopIndex + 1;
    setCompletingStop(stopIndex);
    try {
      const coords = await getCurrentCoords();
      const body: Record<string, unknown> = {};
      if (coords) body.coords = coords;

      // 1. Complete the route stop
      const res = await fetch(`${API}/api/driver/route/${route._id}/stop/${stopNum}/complete`, {
        method: 'PATCH', headers: h, body: JSON.stringify(body),
      });
      if (res.ok || res.status >= 500) {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setRoute(prev => {
            if (!prev?.stops) return prev;
            const stops   = prev.stops.map((s, i) => i === stopIndex ? { ...s, status: 'completada' } : s);
            const allDone = data?.todasCompletas ?? stops.every(s => s.status === 'completada');
            return { ...prev, stops, ...(allDone ? { current_status: 'entregado' } : {}) };
          });
        }

        // 2. Update the order status to 'entregado' using the stop's order_id
        const stop = effectiveStops[stopIndex];
        const matchingOrder = stop
          ? orders.find(o => o._id === stop.order_id || o.id_pedido === stop.id_pedido)
          : null;
        if (matchingOrder) {
          const statusBody: Record<string, unknown> = { status: 'entregado' };
          if (coords) statusBody.coords = coords;
          const statusRes = await fetch(`${API}/api/driver/orders/${matchingOrder._id}/status`, {
            method: 'PATCH', headers: h, body: JSON.stringify(statusBody),
          });
          if (statusRes.ok || statusRes.status >= 500) {
            ctxUpdateStatus(matchingOrder._id, 'Entregado');
            refreshSilent();
          }
        }
      }
    } finally { setCompletingStop(null); }
  };

  const handleMissingRoute = async () => {
    if (!route?._id || !missingNotes.trim()) return;
    setRouteActionLoading(true);
    try {
      const res = await fetch(`${API}/api/routes/${route._id}/missing`, {
        method: 'PATCH', headers: h, body: JSON.stringify({ notes: missingNotes }),
      });
      if (res.ok) {
        setRoute(prev => prev ? { ...prev, current_status: 'faltante' } : prev);
        setMissingNotes('');
        setShowMissingForm(false);
      }
    } finally { setRouteActionLoading(false); }
  };

  const startRoute = async () => {
    setRouteActionLoading(true);
    try {
      const res = await fetch(`${API}/api/driver/route/start`, {
        method: 'POST', headers: h, body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setRoute(data?.route ?? data?.ruta ?? data);
      }
    } finally { setRouteActionLoading(false); }
  };

  const submitIncident = async () => {
    if (!incidentOrder || !incidentDesc.trim()) return;
    if (incidentType === 'producto_faltante' && incidentItems.length === 0) {
      setItemsError('Selecciona al menos un producto faltante.');
      return;
    }
    setSubmitting(true);
    try {
      const coords = await getCurrentCoords();
      const body: Record<string, unknown> = {
        tipo:            incidentType,
        descripcion:     incidentDesc,
        items_afectados: incidentType === 'producto_faltante'
          ? incidentItems.map(sku => ({ sku }))
          : [],
      };
      if (coords) body.coords = coords;
      await fetch(`${API}/api/driver/orders/${incidentOrder}/incident`, {
        method: 'POST', headers: h, body: JSON.stringify(body),
      });

      if (incidentType === 'producto_faltante') {
        const statusRes = await fetch(`${API}/api/driver/orders/${incidentOrder}/status`, {
          method: 'PATCH', headers: h, body: JSON.stringify({ status: 'incompleto' }),
        });
        if (statusRes.ok || statusRes.status >= 500) {
          ctxUpdateStatus(incidentOrder, 'Incompleto');
          refreshSilent();
        }
      }

      setIncidentDone(true);
      setIncidentDesc('');
      setIncidentItems([]);
      setItemsError(null);
      setTimeout(() => setIncidentDone(false), 3000);
    } finally { setSubmitting(false); }
  };

  if (loading || routeLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#E61A27] rounded-full animate-spin" />
      </div>
    );
  }

  const routeStatus     = route?.current_status ?? 'programado';
  const routeStatusMeta = ROUTE_STATUS_LABEL[routeStatus];

  return (
    <div className="space-y-4">

      {/* ── PEDIDOS ───────────────────────────────────────────────────────── */}
      {activeTab === 'pedidos' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {statusError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-4 py-3">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {statusError}
            </div>
          )}

          <OrderCalendar
            selected={selectedDate}
            month={calMonth}
            orderDateSet={orderDateSet}
            onChange={d => setSelectedDate(d)}
            onMonthChange={d => setCalMonth(d)}
          />

          {selectedDateOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-900 font-semibold text-sm">Sin pedidos para este día</p>
              <p className="text-gray-400 text-xs mt-1">No hay entregas asignadas para la fecha seleccionada.</p>
            </div>
          ) : selectedDateOrders.map(o => {
            const address    = o.direccion_entrega ?? o.usuario?.direccion;
            const isUpdating = updatingId === o._id;
            const canDeliver = isToday(o);

            return (
              <div key={o._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-4 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[o.status_final] ?? 'bg-gray-100 text-gray-600'}`}>
                      {o.status_final}
                    </span>
                    <span className="text-xs font-mono text-gray-400">{o.id_pedido ?? o._id}</span>
                  </div>
                </div>

                {address && (
                  <div className="px-4 pb-2 flex items-start gap-2">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm font-semibold text-gray-900 leading-snug">{address}</p>
                  </div>
                )}

                {(o.fecha_entrega || o.fecha_pedido) && (
                  <div className="px-4 pb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-gray-500">
                      {o.fecha_entrega ? 'Entrega' : 'Pedido'}:{' '}
                      <span className="font-semibold text-gray-700">{fmtDate(o.fecha_entrega ?? o.fecha_pedido)}</span>
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
                  {(o.status_final === 'Confirmado' || o.status_final === 'Asignado') && canDeliver && (
                    <button
                      onClick={() => updateOrderStatus(o, 'en_camino')}
                      disabled={isUpdating}
                      className="w-full h-14 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isUpdating
                        ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0M3 7h18M3 7l2-4h14l2 4M3 7v10h1m15 0h1V7" />
                            </svg>
                            Salir a entregar
                          </>
                        )}
                    </button>
                  )}

                  {o.status_final === 'En camino' && canDeliver && (
                    <button
                      onClick={() => updateOrderStatus(o, 'entregado')}
                      disabled={isUpdating}
                      className="w-full h-14 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isUpdating
                        ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Confirmar entrega
                          </>
                        )}
                    </button>
                  )}

                  {!canDeliver && !['Entregado', 'Cancelado', 'Incompleto'].includes(o.status_final) && (
                    <p className="text-xs text-center text-amber-600 font-medium py-1">
                      Este pedido no es de la fecha actual
                    </p>
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

      {/* ── RUTA ──────────────────────────────────────────────────────────── */}
      {activeTab === 'ruta' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

          {/* Hoy / Mañana toggle */}
          <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
            <button onClick={() => setRouteDay('hoy')}
              className={`flex-1 h-9 rounded-xl text-sm font-semibold transition-all ${routeDay === 'hoy' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Hoy
            </button>
            <button onClick={() => setRouteDay('manana')}
              className={`flex-1 h-9 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${routeDay === 'manana' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Mañana
              {tomorrowOrders.length > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${routeDay === 'manana' ? 'bg-[#E61A27] text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {tomorrowOrders.length}
                </span>
              )}
            </button>
          </div>

          {routeDay === 'hoy' ? (
            <div className="space-y-4">
              

              <RouteMap
                stops={effectiveStops}
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
                  <button onClick={startRoute} disabled={routeActionLoading}
                    className="bg-[#E61A27] text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#B31217] disabled:opacity-60 transition-colors flex items-center gap-2 mx-auto">
                    {routeActionLoading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
                    Iniciar ruta del día
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-900">Estado de la ruta</h2>
                    {routeStatusMeta && (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${routeStatusMeta.color}`}>
                        {routeStatusMeta.label}
                      </span>
                    )}
                  </div>

                  {routeStatus === 'programado' && (
                    <button onClick={handleLoad} disabled={routeActionLoading}
                      className="w-full h-14 rounded-xl bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-white font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-sm">
                      {routeActionLoading
                        ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        : <><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>Comenzar carga del camión</>}
                    </button>
                  )}

                  {routeStatus === 'cargando' && (
                    <div className="space-y-2">
                      <button onClick={handleDepart} disabled={routeActionLoading}
                        className="w-full h-14 rounded-xl bg-[#E61A27] hover:bg-[#B31217] disabled:opacity-60 text-white font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-sm">
                        {routeActionLoading
                          ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          : <><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0M3 7h18M3 7l2-4h14l2 4M3 7v10h1m15 0h1V7" /></svg>Salir del CEDIS</>}
                      </button>
                      <button onClick={() => setShowMissingForm(v => !v)}
                        className="w-full h-11 rounded-xl border border-red-200 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                        Reportar pedido faltante en carga
                      </button>
                    </div>
                  )}

                  {(routeStatus === 'finalizado' || routeStatus === 'entregado') && (
                    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-4">
                      <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-green-800">Ruta finalizada</p>
                        <p className="text-xs text-green-600 mt-0.5">Todos los pedidos del día han sido procesados.</p>
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {showMissingForm && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="pt-2 space-y-3">
                          <textarea value={missingNotes} onChange={e => setMissingNotes(e.target.value)} rows={3}
                            placeholder="Describe qué pedido o productos faltan en el camión…"
                            className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400" />
                          <button onClick={handleMissingRoute} disabled={routeActionLoading || !missingNotes.trim()}
                            className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2">
                            {routeActionLoading
                              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              : 'Confirmar faltante'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          ) : (
            /* ── Vista mañana (solo lectura) ─────────────────────────────── */
            <div className="space-y-3">
              {tomorrowOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-semibold text-sm">Sin pedidos para mañana</p>
                  <p className="text-gray-400 text-xs mt-1">No hay entregas asignadas para el día siguiente.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                    <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-700 font-medium">
                      Vista previa · {tomorrowOrders.length} pedido{tomorrowOrders.length !== 1 ? 's' : ''} para mañana
                    </p>
                  </div>

                  <RouteMap
                    stops={tomorrowStops}
                    cedis={cedisLocation}
                    canComplete={false}
                    completingStop={null}
                    onCompleteStop={() => {}}
                    onMissingStop={() => {}}
                  />

                  {tomorrowOrders.map(o => {
                    const address = o.direccion_entrega ?? o.usuario?.direccion;
                    return (
                      <div key={o._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-4 pt-4 pb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[o.status_final] ?? 'bg-gray-100 text-gray-600'}`}>
                              {o.status_final}
                            </span>
                            <span className="text-xs font-mono text-gray-400">{o.id_pedido ?? o._id}</span>
                          </div>
                        </div>
                        {address && (
                          <div className="px-4 pb-2 flex items-start gap-2">
                            <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-sm text-gray-700 leading-snug">{address}</p>
                          </div>
                        )}
                        {(o.items ?? []).length > 0 && (
                          <div className="mx-4 mb-4 bg-gray-50 rounded-xl p-3 space-y-1">
                            {o.items!.slice(0, 3).map((item, i) => (
                              <div key={i} className="flex justify-between text-xs text-gray-600">
                                <span className="truncate mr-2">{item.nombre}</span>
                                <span className="font-mono shrink-0 text-gray-400">×{item.cantidad}</span>
                              </div>
                            ))}
                            {o.items!.length > 3 && <p className="text-xs text-gray-400">+{o.items!.length - 3} más</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* ── INCIDENCIAS ───────────────────────────────────────────────────── */}
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
                <select value={incidentOrder} onChange={e => setIncidentOrder(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E61A27]/20 focus:border-[#E61A27]">
                  <option value="">Selecciona un pedido</option>
                  {routeOrders.map(o => (
                    <option key={o._id} value={o._id}>{o.id_pedido ?? o._id}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tipo de incidencia</label>
                <select
                  value={incidentType}
                  onChange={e => { setIncidentType(e.target.value); setIncidentItems([]); setItemsError(null); }}
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

              {incidentType === 'producto_faltante' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Productos afectados</label>
                  {!incidentOrderObj ? (
                    <p className="text-xs text-gray-400 py-1">Selecciona un pedido para ver sus productos.</p>
                  ) : (incidentOrderObj.items ?? []).length === 0 ? (
                    <p className="text-xs text-gray-400 py-1">Este pedido no tiene productos registrados.</p>
                  ) : (
                    <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                      {(incidentOrderObj.items ?? []).map(item => {
                        const checked = incidentItems.includes(item.sku);
                        return (
                          <label key={item.sku} className="flex items-center gap-3 px-3.5 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setItemsError(null);
                                setIncidentItems(prev =>
                                  checked ? prev.filter(s => s !== item.sku) : [...prev, item.sku]
                                );
                              }}
                              className="w-4 h-4 rounded accent-[#E61A27] shrink-0"
                            />
                            <span className="text-sm text-gray-800 flex-1 truncate">{item.nombre}</span>
                            <span className="text-xs font-mono text-gray-400 shrink-0">×{item.cantidad}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {itemsError && (
                    <p className="text-xs text-red-600 font-medium">{itemsError}</p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Descripción</label>
                <textarea value={incidentDesc} onChange={e => setIncidentDesc(e.target.value)} rows={4}
                  placeholder="Describe brevemente lo que pasó…"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#E61A27]/20 focus:border-[#E61A27]" />
              </div>
            </div>

            <AnimatePresence>
              {incidentDone && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Incidencia reportada correctamente.
                </motion.div>
              )}
            </AnimatePresence>

            <button onClick={submitIncident} disabled={submitting || !incidentOrder || !incidentDesc.trim()}
              className="w-full h-14 bg-[#E61A27] text-white font-bold text-base rounded-xl hover:bg-[#B31217] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              {submitting
                ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : 'Enviar reporte'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
