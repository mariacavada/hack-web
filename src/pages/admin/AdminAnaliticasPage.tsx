import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

const COLORS = ['#E61A27', '#F87171', '#FCA5A5', '#FBBFCA', '#FB923C', '#F59E0B', '#8B5CF6', '#EC4899'];

/* ── Types ───────────────────────────────────────────────────────────────── */
interface AnyOrder {
  _id: string;
  status_final: string;
  customer_id?: string;
  total?: number;
  subtotal?: number;
  items?: { nombre?: string; cantidad?: number }[];
  createdAt?: string;
  fecha_pedido?: string;
  updatedAt?: string;
}

interface AnyUser {
  _id: string;
  customer_id?: string;
  nombre_negocio?: string;
  nombre?: string;
  email?: string;
  role?: string;
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

/* ── Main component ──────────────────────────────────────────────────────── */
export default function AdminAnaliticasPage() {
  const [orders,  setOrders]  = useState<AnyOrder[]>([]);
  const [users,   setUsers]   = useState<AnyUser[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('or_token') ?? '';
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    (async () => {
      try {
        const [o, u] = await Promise.all([
          fetch(`${API}/api/admin/orders`, { headers: h }).then(r => r.ok ? r.json() : []),
          fetch(`${API}/api/admin/users`,  { headers: h }).then(r => r.ok ? r.json() : {}),
        ]);

        const usersArr: AnyUser[] = Array.isArray(u) ? u : (u as any)?.users ?? [];
        setUsers(usersArr);

        const rawOrders: AnyOrder[] = Array.isArray(o) ? o : (o as any)?.orders ?? [];

        // Enrich orders with item names from order details (sample of 20)
        const sample = rawOrders.slice(0, 20);
        const details = await Promise.all(
          sample.map(order =>
            fetch(`${API}/api/admin/orders/${order._id}`, { headers: h })
              .then(r => r.ok ? r.json() : null)
              .catch(() => null)
          )
        );

        const enriched: AnyOrder[] = rawOrders.map(order => {
          const detail = details.find(d =>
            (d?.order?._id ?? d?._id) === order._id
          );
          if (!detail) return order;
          const detalles: any[] = detail.detalles ?? detail.items ?? detail.productos ?? [];
          return {
            ...order,
            items: detalles.map((it: any) => ({
              nombre:   it.nombre_sku_solicitado ?? it.nombre ?? it.sku ?? 'Producto',
              cantidad: it.cantidad ?? it.cantidad_solicitada ?? 1,
            })),
          };
        });

        setOrders(enriched);
      } catch (_) {
        // silently ignore fetch errors
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Derived data ─────────────────────────────────────────────────────── */

  // 1. Porcentaje de venta por producto (pie)
  const productSales = (() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      (o.items ?? []).forEach(item => {
        const name = item.nombre ?? 'Sin nombre';
        counts[name] = (counts[name] ?? 0) + (item.cantidad ?? 1);
      });
    });
    const entries = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    const total = entries.reduce((s, e) => s + e.value, 0);
    return entries.map((e, idx) => ({
      ...e,
      pct:  total > 0 ? +((e.value / total) * 100).toFixed(1) : 0,
      fill: COLORS[idx % COLORS.length],
    }));
  })();

  // 2. Eficiencia de ruta (bar por estado)
  const statusData = (() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => { counts[o.status_final] = (counts[o.status_final] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();
  const totalOrders = orders.length;
  const delivered   = orders.filter(o => o.status_final?.toLowerCase() === 'entregado').length;
  const efficiency  = totalOrders > 0 ? Math.round((delivered / totalOrders) * 100) : 0;

  // 3. Tiempo de entrega — pedidos por día (últimos 14 días)
  const deliveryByDay = (() => {
    const map: Record<string, number> = {};
    orders.forEach(o => {
      const raw = o.fecha_pedido ?? o.createdAt;
      if (!raw) return;
      const day = new Date(raw).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
      map[day] = (map[day] ?? 0) + 1;
    });
    return Object.entries(map)
      .map(([fecha, pedidos]) => ({ fecha, pedidos }))
      .slice(-14);
  })();

  // 4. Top clientes por gasto
  const topClientes = (() => {
    const spend: Record<string, number> = {};
    const count: Record<string, number> = {};
    orders.forEach(o => {
      if (!o.customer_id) return;
      spend[o.customer_id] = (spend[o.customer_id] ?? 0) + (o.total ?? o.subtotal ?? 0);
      count[o.customer_id] = (count[o.customer_id] ?? 0) + 1;
    });
    return Object.entries(spend)
      .map(([id, total]) => {
        const u = users.find(u => u._id === id || u.customer_id === id);
        return {
          nombre: u?.nombre_negocio ?? u?.nombre ?? u?.email ?? id,
          total,
          pedidos: count[id] ?? 0,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  })();

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

      {/* KPI rápido */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-gray-900">{efficiency}%</p>
          <p className="text-xs text-gray-400 mt-1">Eficiencia de entrega</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-gray-900">{delivered}</p>
          <p className="text-xs text-gray-400 mt-1">Pedidos entregados</p>
        </div>
      </div>

      {/* Row 1: Ventas por producto + Eficiencia de ruta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Porcentaje de venta por producto */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          {sectionTitle('Porcentaje de venta por producto', 'Distribución de unidades vendidas por SKU')}
          {productSales.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Sin datos de productos</p>
          ) : (
            <ResponsiveContainer width="100%" height={380}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={productSales}
                  cx="50%"
                  cy="42%"
                  innerRadius={65}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    const total = productSales.reduce((s, p) => s + p.value, 0);
                    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                    return [`${pct}%`, name];
                  }}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ paddingTop: 16, fontSize: 11 }}
                  formatter={(value) => <span style={{ fontSize: 11, color: '#6b7280' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Eficiencia de ruta */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          {sectionTitle('Eficiencia de ruta', 'Estado actual de todos los pedidos')}
          {statusData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Sin datos</p>
          ) : (
            <>
              {/* Gauge visual */}
              <div className="flex items-center justify-center mb-5">
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke="#E61A27"
                      strokeWidth="12"
                      strokeDasharray={`${efficiency * 2.51} 251`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{efficiency}%</span>
                    <span className="text-[10px] text-gray-400">entregados</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={statusData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Bar
                    dataKey="value"
                    name="Pedidos"
                    radius={[0, 4, 4, 0]}
                    shape={(props: any) => {
                      const { x, y, width, height, name } = props;
                      const fill =
                        ['entregado','Entregado'].includes(name)              ? '#10B981' :
                        ['en camino','En camino','en_camino'].includes(name)  ? '#F97316' :
                        ['pendiente','Pendiente'].includes(name)              ? '#F59E0B' :
                        ['cancelado','Cancelado'].includes(name)              ? '#EF4444' :
                                                                                '#FBBFCA';
                      return <rect x={x} y={y} width={width} height={height} rx={4} ry={4} fill={fill} />;
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>

      {/* Row 2: Tiempo de entrega */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        {sectionTitle('Tiempo de entrega', 'Volumen de pedidos registrados por día (últimos 14 días)')}
        {deliveryByDay.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Sin datos de fechas</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={deliveryByDay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                formatter={(v: any) => [`${v} pedidos`, 'Pedidos']}
              />
              <Line
                type="monotone"
                dataKey="pedidos"
                stroke="#E61A27"
                strokeWidth={2.5}
                dot={{ fill: '#E61A27', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row 3: Top clientes por gasto */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        {sectionTitle('Top clientes por gasto', 'Clientes con mayor volumen de compra acumulado')}
        {topClientes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Sin datos de clientes</p>
        ) : (
          <div className="space-y-3">
            {topClientes.map((c, i) => {
              const max = topClientes[0].total;
              const pct = max > 0 ? (c.total / max) * 100 : 0;
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-lg w-6 shrink-0 text-center">{medals[i] ?? `${i + 1}`}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-800 truncate pr-2">{c.nombre}</p>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-gray-400">{c.pedidos} pedidos</span>
                        <span className="text-sm font-bold text-gray-900">
                          ${c.total.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#E61A27] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
