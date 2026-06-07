import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Miér', 'Jue', 'Vie', 'Sáb'];
const ACTIVE_STATUSES = new Set(['pendiente', 'confirmado', 'asignado', 'en_camino', 'en camino', 'preparando', 'en preparación']);
const DELIVERED = new Set(['entregado', 'Entregado']);

interface Order {
  _id: string;
  status_final: string;
  customer_id?: string;
  fecha_pedido?: string;
  created_at?: string;
  createdAt?: string;
}

interface RiskItem {
  sku: string;
  nombre?: string;
  probabilidad?: number;
  confianza?: number;
  nivel?: string;
  nivel_alerta?: string;
  dias_estimados_agotamiento?: number;
  horas_estimadas?: number;
  stock_actual?: number;
}

interface Notif {
  _id: string;
  tipo?: string;
  titulo?: string;
  created_at?: string;
  createdAt?: string;
}

function orderDate(o: Order): Date {
  return new Date(o.fecha_pedido ?? o.created_at ?? o.createdAt ?? 0);
}

function dayStart(d: Date): number {
  const c = new Date(d); c.setHours(0, 0, 0, 0); return c.getTime();
}

function riskColor(pct: number | null): string {
  if (pct == null || pct < 45) return '#22C55E';
  if (pct < 65) return '#F59E0B';
  return '#E61A27';
}

function riskTextClass(pct: number | null): string {
  if (pct == null || pct < 45) return 'text-green-600';
  if (pct < 65) return 'text-amber-500';
  return 'text-red-600';
}

function Trend({ diff, suffix = ' vs. ayer', invert = false }: { diff: number; suffix?: string; invert?: boolean }) {
  const positive = invert ? diff < 0 : diff >= 0;
  return (
    <p className={`text-xs font-medium mt-1 flex items-center gap-0.5 ${positive ? 'text-green-600' : 'text-red-600'}`}>
      <span>{positive ? '↗' : '↘'}</span>
      <span>{diff >= 0 ? '+' : ''}{diff}{suffix}</span>
    </p>
  );
}

function KPICard({ label, value, children }: { label: string; value: string | number; children?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider leading-tight">{label}</p>
      <p className="text-3xl text-gray-900 mt-1">{value}</p>
      {children}
    </div>
  );
}

export default function AdminHomePage() {
  const [orders,    setOrders]    = useState<Order[]>([]);
  const [risk,      setRisk]      = useState<RiskItem[]>([]);
  const [notifs,    setNotifs]    = useState<Notif[]>([]);
  const [skuNames,  setSkuNames]  = useState<Record<string, string>>({});
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('or_token') ?? '';
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/api/admin/orders`,                      { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/notifications`,                     { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/admin/inventory/depletion-risk`,    { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/ai/products`,                       { headers: h }).then(r => r.ok ? r.json() : []),
    ])
      .then(([o, n, ri, catalog]) => {
        setOrders(Array.isArray(o) ? o : o?.orders ?? []);
        setNotifs(Array.isArray(n) ? n : n?.notifications ?? []);
        const riskArr: RiskItem[] = Array.isArray(ri) ? ri : ri?.predictions ?? ri?.items ?? [];
        setRisk(riskArr);
        const catalogArr: any[] = Array.isArray(catalog) ? catalog : catalog?.products ?? [];
        const nameMap: Record<string, string> = {};
        catalogArr.forEach((p: any) => { if (p.sku) nameMap[String(p.sku)] = p.nombre ?? p.sku; });
        setSkuNames(nameMap);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const todayTs    = dayStart(new Date());
  const yesterdayTs = todayTs - 86_400_000;

  const kpis = useMemo(() => {
    const isToday     = (o: Order) => dayStart(orderDate(o)) === todayTs;
    const isYesterday = (o: Order) => dayStart(orderDate(o)) === yesterdayTs;
    const isActive    = (o: Order) => ACTIVE_STATUSES.has(o.status_final?.toLowerCase());
    const isDone      = (o: Order) => DELIVERED.has(o.status_final);

    const activos      = orders.filter(isActive).length;
    const activosAyer  = orders.filter(o => isYesterday(o) && isActive(o)).length;

    const total        = orders.length;
    const totalAyer    = orders.filter(isYesterday).length;
    const done         = orders.filter(isDone).length;
    const doneAyer     = orders.filter(o => isYesterday(o) && isDone(o)).length;
    const nivel        = total > 0 ? +((done / total) * 100).toFixed(1) : 0;
    const nivelAyer    = totalAyer > 0 ? +((doneAyer / totalAyer) * 100).toFixed(1) : 0;

    const isSust  = (n: Notif) => n.tipo?.toLowerCase().includes('sustit') || n.titulo?.toLowerCase().includes('sustit');
    const sustHoy  = notifs.filter(n => isSust(n) && dayStart(new Date(n.created_at ?? n.createdAt ?? 0)) === todayTs).length;
    const sustAyer = notifs.filter(n => isSust(n) && dayStart(new Date(n.created_at ?? n.createdAt ?? 0)) === yesterdayTs).length;
    const sustVal  = sustHoy || orders.filter(isToday).length;

    const criticos     = risk.filter(r => (r.nivel_alerta ?? r.nivel)?.toLowerCase() === 'critico').length;

    const afectados    = new Set(orders.filter(isActive).map(o => o.customer_id).filter(Boolean)).size;
    const afectadosAyer= new Set(orders.filter(o => isYesterday(o) && isActive(o)).map(o => o.customer_id).filter(Boolean)).size;

    return {
      activos, activosDiff: activos - activosAyer,
      sustVal, sustDiff: sustHoy - sustAyer,
      nivel, nivelDiff: +(nivel - nivelAyer).toFixed(1),
      criticos, criticosDiff: criticos,
      afectados, afectadosDiff: afectados - afectadosAyer,
    };
  }, [orders, risk, notifs, todayTs, yesterdayTs]);

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(todayTs - (6 - i) * 86_400_000);
      const ts = d.getTime();
      const count = orders.filter(o => dayStart(orderDate(o)) === ts).length;
      return { day: DAY_NAMES[d.getDay()], count, isToday: i === 6 };
    });
  }, [orders, todayTs]);

  const healthItems = useMemo(() =>
    [...risk]
      .sort((a, b) => (a.dias_estimados_agotamiento ?? 999) - (b.dias_estimados_agotamiento ?? 999))
      .slice(0, 4),
    [risk]
  );

  const dateStr = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#E61A27] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resumen ejecutivo</h1>
        <p className="text-sm text-gray-400 mt-0.5">Operación en tiempo real · {dateStr}</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-5 gap-3">
        <KPICard label="Pedidos activos" value={kpis.activos}>
          <Trend diff={kpis.activosDiff} suffix=" vs. ayer" />
        </KPICard>
        <KPICard label="Sustituciones hoy" value={kpis.sustVal}>
          <Trend diff={kpis.sustDiff} suffix=" vs. ayer" />
        </KPICard>
        <KPICard label="Nivel de servicio" value={`${kpis.nivel}%`}>
          <Trend diff={kpis.nivelDiff} suffix="% vs. ayer" />
        </KPICard>
        <KPICard label="Productos críticos" value={kpis.criticos}>
          <Trend diff={kpis.criticosDiff} suffix=" vs. ayer" invert />
        </KPICard>
        <KPICard label="Clientes afectados" value={kpis.afectados}>
          <Trend diff={kpis.afectadosDiff} suffix=" vs. ayer" invert />
        </KPICard>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-[3fr_2fr] gap-4 mt-4">

        {/* Bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-gray-900">Pedidos por día</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Últimos 7 días</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barCategoryGap="32%">
              <XAxis
                dataKey="day"
                axisLine={false} tickLine={false}
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
              />
              <YAxis hide domain={[0, 'dataMax + 5']} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                formatter={(v: any) => [v, 'Pedidos']}
                labelStyle={{ fontWeight: 600 }}
              />
              <Bar
                dataKey="count"
                radius={[5, 5, 0, 0]}
                shape={(props: any) => {
                  const { x, y, width, height, index } = props;
                  const fill = chartData[index]?.isToday ? '#C5002E' : '#FBBFCA';
                  return <rect x={x} y={y} width={width} height={height} rx={5} ry={5} fill={fill} />;
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory health */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-gray-900">Salud de inventario</h2>
            <svg className="w-4 h-4 text-[#E61A27]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          {healthItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Sin alertas de inventario</p>
          ) : (
            <div className="space-y-4">
              {healthItems.map((item, i) => {
                const dias = item.dias_estimados_agotamiento ?? null;
                const urgency = dias == null ? null : Math.max(0, Math.min(100, Math.round(((14 - dias) / 14) * 100)));
                const label = dias === 0 ? 'Agotado' : dias != null ? `${dias}d restantes` : null;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold text-gray-800 truncate pr-2">{item.nombre ?? skuNames[String(item.sku)] ?? item.sku}</p>
                      {label != null
                        ? <span className={`text-xs font-bold shrink-0 ${riskTextClass(urgency)}`}>{label}</span>
                        : <span className="text-xs text-gray-300 shrink-0">—</span>
                      }
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      {urgency != null && (
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${urgency}%`, backgroundColor: riskColor(urgency) }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
