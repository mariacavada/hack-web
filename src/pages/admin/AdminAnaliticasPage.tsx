import { useEffect, useRef, useState } from 'react';
import {
  PieChart, Pie, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ── Mapa de calor nativo ─────────────────────────────────────────────────── */
interface MapPoint { lat: number; lng: number; nombre: string; colonia?: string; municipio?: string; pedidos: number; }

function OrderHeatMap({ points, maxCount }: { points: MapPoint[]; maxCount: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;
    const center: L.LatLngTuple = [points[0].lat, points[0].lng];
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(center, 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    points.forEach(pt => {
      const intensity = pt.pedidos / maxCount;
      const label = [
        `<b style="font-size:12px">${pt.nombre}</b>`,
        pt.colonia ? `<span style="color:#6b7280;font-size:11px">${pt.colonia}${pt.municipio ? `, ${pt.municipio}` : ''}</span>` : '',
        `<span style="color:#E61A27;font-weight:600;font-size:11px">${pt.pedidos} pedido${pt.pedidos !== 1 ? 's' : ''}</span>`,
      ].filter(Boolean).join('<br>');

      L.circleMarker([pt.lat, pt.lng], {
        radius: 10 + intensity * 22,
        fillColor: '#E61A27',
        fillOpacity: 0.18 + intensity * 0.52,
        stroke: false,
      }).bindTooltip(label, { sticky: true }).addTo(map);
    });

    return () => { map.remove(); };
  }, [points, maxCount]);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
}

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
const COLORS = ['#E61A27', '#F87171', '#FCA5A5', '#FBBFCA', '#FB923C', '#F59E0B', '#8B5CF6', '#EC4899'];

/* ── Types ───────────────────────────────────────────────────────────────── */
interface Stats {
  total:         number;
  hoy:           number;
  ayer:          number;
  activos:       number;
  pendientes:    number;
  entregados:    number;
  cancelados:    number;
  incompletos:   number;
  nivel_servicio: number;
  revenue_total: number;
  por_status:    Record<string, number>;
}
interface AnyOrder {
  _id: string;
  status_final: string;
  customer_id?: string;
  total?: number;
  subtotal?: number;
  valor_pedido?: number;
  fecha_pedido?: string;
  created_at?: string;
}
interface AnyUser {
  _id: string;
  customer_id?: string;
  nombre_negocio?: string;
  nombre?: string;
  email?: string;
  ubicacion?: {
    lat?: number;
    lng?: number;
    colonia?: string;
    municipio?: string;
  };
}
interface ProductSale {
  sku: string;
  productName?: string;
  quantity?: number;
  percentage?: number;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function sectionTitle(title: string, sub?: string) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function KPICard({ label, value, sub, accent = false }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 shadow-sm text-center ${accent ? 'bg-[#E61A27] border-[#C5002E]' : 'bg-white border-gray-200'}`}>
      <p className={`text-3xl font-bold ${accent ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      <p className={`text-xs mt-1 ${accent ? 'text-red-100' : 'text-gray-400'}`}>{label}</p>
      {sub && <p className={`text-xs font-medium mt-0.5 ${accent ? 'text-red-200' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  );
}

const STATUS_COLOR: Record<string, string> = {
  entregado:   '#10B981',
  en_camino:   '#F97316',
  preparando:  '#8B5CF6',
  asignado:    '#3B82F6',
  recibido:    '#60A5FA',
  confirmado:  '#93C5FD',
  pendiente:   '#F59E0B',
  incompleto:  '#FCD34D',
  cancelado:   '#EF4444',
};

/* ── Component ───────────────────────────────────────────────────────────── */
export default function AdminAnaliticasPage() {
  const [stats,        setStats]        = useState<Stats | null>(null);
  const [orders,       setOrders]       = useState<AnyOrder[]>([]);
  const [users,        setUsers]        = useState<AnyUser[]>([]);
  const [productSales, setProductSales] = useState<ProductSale[]>([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('or_token') ?? '';
    const h = { Authorization: `Bearer ${token}` };

    (async () => {
      try {
        const [st, o, u, ps] = await Promise.all([
          fetch(`${API}/api/admin/stats`,              { headers: h }).then(r => r.ok ? r.json() : null),
          fetch(`${API}/api/admin/orders?limit=500`,   { headers: h }).then(r => r.ok ? r.json() : {} as any),
          fetch(`${API}/api/admin/users?limit=500`,    { headers: h }).then(r => r.ok ? r.json() : {} as any),
          fetch(`${API}/api/dashboard/product-sales`,  { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
        ]);

        setStats(st);
        setOrders(Array.isArray(o) ? o : (o?.orders ?? []));
        setUsers(Array.isArray(u) ? u : (u?.users ?? []));
        setProductSales(Array.isArray(ps) ? ps : []);
      } catch (_) {
        // silently ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Derived data ────────────────────────────────────────────────────────── */

  // Status bar — from stats.por_status (full DB aggregation, no pagination gaps)
  const statusData = stats
    ? Object.entries(stats.por_status)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value }))
    : [];

  // Pie — product-sales endpoint
  const pieData = productSales.slice(0, 8).map((p, idx) => ({
    name:  p.productName ?? p.sku,
    value: p.quantity ?? p.percentage ?? 0,
    fill:  COLORS[idx % COLORS.length],
  }));

  // Pedidos por día (last 14 days) — from orders list
  const deliveryByDay = (() => {
    const map: Record<string, number> = {};
    orders.forEach(o => {
      const raw = o.fecha_pedido ?? o.created_at;
      if (!raw) return;
      const day = new Date(raw).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
      map[day] = (map[day] ?? 0) + 1;
    });
    return Object.entries(map).map(([fecha, pedidos]) => ({ fecha, pedidos })).slice(-14);
  })();


  const diffHoy = stats ? stats.hoy - stats.ayer : 0;

  // Mapa — clientes con ubicacion.lat/lng + conteo de pedidos
  const mapPoints = (() => {
    const countByUser: Record<string, number> = {};
    orders.forEach(o => {
      if (o.customer_id) countByUser[o.customer_id] = (countByUser[o.customer_id] ?? 0) + 1;
    });
    return users
      .filter(u => u.ubicacion?.lat && u.ubicacion?.lng)
      .map(u => ({
        lat:       u.ubicacion!.lat!,
        lng:       u.ubicacion!.lng!,
        nombre:    u.nombre_negocio ?? u.nombre ?? u.email ?? '—',
        colonia:   u.ubicacion?.colonia,
        municipio: u.ubicacion?.municipio,
        pedidos:   countByUser[u._id] ?? countByUser[u.customer_id ?? ''] ?? 0,
      }));
  })();
  const maxPedidos = Math.max(...mapPoints.map(p => p.pedidos), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#E61A27] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analítica</h1>
        <p className="text-sm text-gray-400 mt-0.5">Dashboard operativo en tiempo real</p>
      </div>

      {/* KPI strip — from /api/admin/stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard label="Total pedidos"     value={stats?.total ?? 0} />
        <KPICard label="Pedidos hoy"       value={stats?.hoy ?? 0}
          sub={diffHoy >= 0 ? `↗ +${diffHoy} vs ayer` : `↘ ${diffHoy} vs ayer`} />
        <KPICard label="Nivel de servicio" value={`${stats?.nivel_servicio ?? 0}%`} accent />
        <KPICard label="Revenue entregado"
          value={`$${(stats?.revenue_total ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`} />
      </div>

      {/* Row: Pie + Status bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Porcentaje de venta por producto */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          {sectionTitle('Venta por producto', 'Distribución de unidades vendidas por SKU')}
          {pieData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Sin datos de productos</p>
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="42%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    const total = pieData.reduce((s, p) => s + p.value, 0);
                    return [`${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%`, name];
                  }}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center"
                  wrapperStyle={{ paddingTop: 16, fontSize: 11 }}
                  formatter={v => <span style={{ fontSize: 11, color: '#6b7280' }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Distribución por estado — from stats.por_status */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          {sectionTitle('Pedidos por estado', 'Conteo total por estado (datos en tiempo real)')}
          {statusData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Sin datos</p>
          ) : (
            <>
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#E61A27" strokeWidth="12"
                      strokeDasharray={`${(stats?.nivel_servicio ?? 0) * 2.51} 251`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-gray-900">{stats?.nivel_servicio ?? 0}%</span>
                    <span className="text-[10px] text-gray-400">entregados</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={Math.max(130, statusData.length * 28)}>
                <BarChart data={statusData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="value" name="Pedidos" radius={[0, 4, 4, 0]}
                    shape={(props: any) => {
                      const { x, y, width, height, index } = props;
                      const fill = STATUS_COLOR[statusData[index]?.name] ?? '#FBBFCA';
                      return <rect x={x} y={y} width={width} height={height} rx={4} ry={4} fill={fill} />;
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>

      {/* Pedidos por día */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        {sectionTitle('Pedidos por día', 'Volumen registrado en los últimos 14 días')}
        {deliveryByDay.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Sin datos de fechas</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={deliveryByDay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                formatter={(v: any) => [`${v} pedidos`, 'Pedidos']} />
              <Line type="monotone" dataKey="pedidos" stroke="#E61A27" strokeWidth={2.5}
                dot={{ fill: '#E61A27', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Mapa de calor */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        {sectionTitle('Densidad de pedidos por zona', 'Ubicación geográfica de clientes — tamaño proporcional al volumen de pedidos')}
        {mapPoints.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Sin datos de ubicación de clientes</p>
        ) : (
          <div className="h-96 rounded-xl overflow-hidden border border-gray-100">
            <OrderHeatMap points={mapPoints} maxCount={maxPedidos} />
          </div>
        )}
      </div>

    </div>
  );
}
