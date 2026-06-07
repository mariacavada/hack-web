import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

const COLORS = ['#E61A27', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

/* ── Types ───────────────────────────────────────────────────────────────── */
interface AnyOrder {
  status_final: string;
  items?: { nombre?: string; cantidad?: number }[];
  createdAt?: string;
  fecha_pedido?: string;
  updatedAt?: string;
}

interface RiskItem {
  sku: string;
  nombre?: string;
  probabilidad?: number;
  horas_estimadas?: number;
  nivel?: string;
}

interface LowStockItem {
  sku: string;
  nombre?: string;
  stock_actual?: number;
  stock_minimo?: number;
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
  const [orders,   setOrders]   = useState<AnyOrder[]>([]);
  const [risk,     setRisk]     = useState<RiskItem[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [loading,  setLoading]  = useState(true);

  const token = localStorage.getItem('or_token') ?? '';
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/admin/orders`,                                      { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/admin/inventory/depletion-risk?nivel=critico`,      { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/admin/inventory/low-stock?cedis_id=3012`,           { headers: h }).then(r => r.ok ? r.json() : []),
    ])
      .then(([o, ri, ls]) => {
        setOrders(Array.isArray(o) ? o : o?.orders ?? []);
        setRisk(Array.isArray(ri) ? ri : ri?.items ?? []);
        setLowStock(Array.isArray(ls) ? ls : ls?.items ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  })();

  // 2. Eficiencia de ruta (bar por estado)
  const statusData = (() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => { counts[o.status_final] = (counts[o.status_final] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();
  const totalOrders = orders.length;
  const delivered   = orders.filter(o => o.status_final === 'Entregado').length;
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

  // 4. Stock predictivo — horas hasta agotamiento
  const stockRisk = risk
    .filter(r => r.horas_estimadas != null)
    .map(r => ({
      name: (r.nombre ?? r.sku).slice(0, 20),
      horas: r.horas_estimadas!,
      prob:  r.probabilidad ?? 0,
    }))
    .sort((a, b) => a.horas - b.horas)
    .slice(0, 8);

  const lowStockChart = lowStock
    .map(ls => ({
      name:    (ls.nombre ?? ls.sku).slice(0, 20),
      actual:  ls.stock_actual  ?? 0,
      minimo:  ls.stock_minimo  ?? 0,
    }))
    .slice(0, 8);

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
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-gray-900">{efficiency}%</p>
          <p className="text-xs text-gray-400 mt-1">Eficiencia de entrega</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-gray-900">{delivered}</p>
          <p className="text-xs text-gray-400 mt-1">Pedidos entregados</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-[#E61A27]">{risk.length}</p>
          <p className="text-xs text-gray-400 mt-1">Productos en riesgo crítico</p>
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
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={productSales}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {productSales.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} uds.`, name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Legend
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
                  <Bar dataKey="value" name="Pedidos" radius={[0, 4, 4, 0]}>
                    {statusData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.name === 'Entregado'       ? '#10B981' :
                          entry.name === 'En camino'       ? '#F97316' :
                          entry.name === 'Pendiente'       ? '#F59E0B' :
                          entry.name === 'Cancelado'       ? '#EF4444' :
                                                             '#3B82F6'
                        }
                      />
                    ))}
                  </Bar>
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
                formatter={(v: number) => [`${v} pedidos`, 'Pedidos']}
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

      {/* Row 3: Stock predictivo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Horas hasta agotamiento */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          {sectionTitle('Stock predictivo — cuándo se acaba', 'Horas estimadas hasta agotamiento crítico')}
          {stockRisk.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Sin productos en riesgo crítico</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stockRisk} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'horas restantes', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#9ca3af' }}
                />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(v: number) => [`${v}h`, 'Horas restantes']}
                />
                <Bar dataKey="horas" name="Horas restantes" radius={[0, 4, 4, 0]}>
                  {stockRisk.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.horas < 12 ? '#EF4444' : entry.horas < 24 ? '#F97316' : '#F59E0B'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Leyenda de colores */}
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> &lt;12h crítico</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> &lt;24h urgente</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" /> &lt;48h alerta</span>
          </div>
        </div>

        {/* Stock actual vs mínimo */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          {sectionTitle('Stock actual vs mínimo requerido', 'Productos bajo el umbral de stock seguro')}
          {lowStockChart.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Sin alertas de bajo stock</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={lowStockChart} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Legend formatter={(v) => <span style={{ fontSize: 11, color: '#6b7280' }}>{v === 'actual' ? 'Stock actual' : 'Stock mínimo'}</span>} />
                <Bar dataKey="actual" name="actual" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="minimo" name="minimo" fill="#E5E7EB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
