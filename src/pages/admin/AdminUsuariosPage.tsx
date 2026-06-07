import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

interface User {
  _id: string;
  nombre_negocio?: string;
  nombre?: string;
  name?: string;
  email: string;
  role?: string;
  rol?: string;
  createdAt?: string;
  created_at?: string;
}

interface OrderItem {
  sku?: string;
  nombre?: string;
  name?: string;
  cantidad?: number;
  quantity?: number;
}

interface Order {
  _id: string;
  id_pedido?: string;
  status_final: string;
  total?: number;
  subtotal?: number;
  SubTotal?: number;
  customer_id?: string;
  driver_id?: string;
  createdAt?: string;
  created_at?: string;
  fecha_pedido?: string;
  fecha_entrega?: string;
  direccion_entrega?: string;
  direccion?: string;
  usuario?: { _id?: string; id?: string; nombre?: string; email?: string };
  items?: OrderItem[];
}

interface UserStats {
  totalPedidos: number;
  totalGastado: number;
  pedidoReciente: Order | null;
  productoEstrella: string;
}

const DONE_STATUSES = new Set(['entregado', 'cancelado', 'incompleto']);

function countActiveOrders(userId: string, orders: Order[]): number {
  return orders.filter(o => {
    const isThisUser =
      o.customer_id === userId ||
      String(o.customer_id) === String(userId) ||
      (o.usuario?._id ?? o.usuario?.id ?? '') === userId;
    const status = (o.status_final ?? '').toLowerCase();
    return isThisUser && status !== '' && !DONE_STATUSES.has(status);
  }).length;
}

function computeStats(userId: string, orders: Order[]): UserStats {
  const mine = orders.filter(o =>
    o.customer_id === userId ||
    (o.usuario?._id ?? o.usuario?.id ?? '') === userId
  );
  const totalGastado = mine.reduce((s, o) => s + (o.total ?? o.subtotal ?? o.SubTotal ?? 0), 0);
  const sorted = [...mine].sort((a, b) =>
    new Date(b.fecha_pedido ?? b.created_at ?? b.createdAt ?? 0).getTime() -
    new Date(a.fecha_pedido ?? a.created_at ?? a.createdAt ?? 0).getTime()
  );
  const freq: Record<string, number> = {};
  mine.forEach(o =>
    (o.items ?? []).forEach(it => {
      const key = it.nombre ?? it.name ?? it.sku ?? '—';
      freq[key] = (freq[key] ?? 0) + (it.cantidad ?? it.quantity ?? 1);
    })
  );
  const productoEstrella = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  return { totalPedidos: mine.length, totalGastado, pedidoReciente: sorted[0] ?? null, productoEstrella };
}

interface RepartidorStats {
  totalEntregados: number;
  ultimoPedido: Order | null;
}

function computeRepartidorStats(userId: string, orders: Order[]): RepartidorStats {
  const mine = orders.filter(o =>
    o.driver_id === userId &&
    o.status_final?.toLowerCase() === 'entregado'
  );
  const sorted = [...mine].sort((a, b) =>
    new Date(b.fecha_entrega ?? b.fecha_pedido ?? b.created_at ?? b.createdAt ?? 0).getTime() -
    new Date(a.fecha_entrega ?? a.fecha_pedido ?? a.created_at ?? a.createdAt ?? 0).getTime()
  );
  return { totalEntregados: mine.length, ultimoPedido: sorted[0] ?? null };
}

const STATUS_BADGE: Record<string, string> = {
  'recibido':        'bg-yellow-100 text-yellow-700',
  'preparando':      'bg-indigo-100 text-indigo-700',
  'en camino':       'bg-orange-100 text-orange-700',
  'entregado':       'bg-green-100 text-green-700',
  'cancelado':       'bg-red-100 text-red-700',
  'Recibido':        'bg-yellow-100 text-yellow-700',
  'Preparando':      'bg-indigo-100 text-indigo-700',
  'En camino':       'bg-orange-100 text-orange-700',
  'Entregado':       'bg-green-100 text-green-700',
  'Cancelado':       'bg-red-100 text-red-700',
  'pendiente':       'bg-yellow-100 text-yellow-700',
  'confirmado':      'bg-blue-100 text-blue-700',
};

type SortDir = 'desc' | 'asc';

/* ── Ranking card ───────────────────────────────────────────────── */
function RankingCard({
  title, sub, items, valueLabel, valuePrefix = '',
}: {
  title: string;
  sub?: string;
  items: { nombre: string; value: number; meta?: string }[];
  valueLabel: string;
  valuePrefix?: string;
}) {
  const max = Math.max(...items.map(i => i.value), 1);
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 w-64 shrink-0 h-full flex flex-col">
      <p className="text-sm font-bold text-gray-900 leading-tight">{title}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5 mb-3">{sub}</p>}
      {items.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>
      ) : (
        <div className="space-y-3 mt-3">
          {items.map((item, i) => {
            const pct = max > 0 ? (item.value / max) * 100 : 0;
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1 gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm shrink-0">{medals[i] ?? `${i + 1}`}</span>
                    <p className="text-xs font-semibold text-gray-800 truncate">{item.nombre}</p>
                  </div>
                  <p className="text-xs font-bold text-gray-900 shrink-0 tabular-nums">
                    {valuePrefix}{item.value.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#E61A27] transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                {item.meta && <p className="text-[10px] text-gray-400 mt-0.5">{item.meta}</p>}
              </div>
            );
          })}
        </div>
      )}
      <p className="text-[10px] text-gray-400 mt-3 text-right">{valueLabel}</p>
    </div>
  );
}

/* ── Reusable compact table ─────────────────────────────────────── */
function UserTable({
  title, users, orders, search, onSelect, scrollable = false, mode = 'cliente',
}: {
  title: string;
  users: User[];
  orders: Order[];
  search: string;
  onSelect: (u: User) => void;
  scrollable?: boolean;
  mode?: 'cliente' | 'repartidor';
}) {
  const [sort, setSort] = useState<SortDir>('desc');

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = users.filter(u =>
      !q ||
      (u.nombre_negocio ?? u.nombre ?? u.name ?? '').toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
    if (mode === 'repartidor') {
      return filtered
        .map(u => ({ user: u, count: computeRepartidorStats(u._id, orders).totalEntregados }))
        .sort((a, b) => sort === 'desc' ? b.count - a.count : a.count - b.count);
    }
    return filtered
      .map(u => ({ user: u, count: computeStats(u._id, orders).totalPedidos }))
      .sort((a, b) => sort === 'desc' ? b.count - a.count : a.count - b.count);
  }, [users, orders, search, sort, mode]);

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-gray-800">{title}</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{rows.length}</span>
        </div>
        {/* Sort toggle */}
        <button
          onClick={() => setSort(s => s === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            {sort === 'desc'
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4 4m0 0l4-4m-4 4V4" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h9m5-4l-4-4m0 0L12 8m4-4v16" />
            }
          </svg>
          {sort === 'desc' ? 'Más pedidos' : 'Menos pedidos'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full flex flex-col flex-1">
        {rows.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">Sin resultados.</p>
        ) : (
          <>
            {/* Header */}
            <div className="grid grid-cols-[1fr_100px_40px_1fr_100px] px-6 py-2 bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              <span>Usuario</span>
              <span className="text-center">{mode === 'repartidor' ? '# Entregados' : '# Pedidos'}</span>
              <span />
              <span>{mode === 'repartidor' ? 'Último pedido' : 'Activos'}</span>
              <span />
            </div>
            <div className={`divide-y divide-gray-100 ${scrollable ? 'overflow-y-auto max-h-63' : ''}`}>
              {rows.map(({ user: u, count }) => {
                const displayName = u.nombre_negocio ?? u.nombre ?? u.name ?? u.email;
                const initials = displayName.slice(0, 2).toUpperCase();
                const repStats = mode === 'repartidor' ? computeRepartidorStats(u._id, orders) : null;
                const activeCount = mode === 'cliente' ? countActiveOrders(u._id, orders) : 0;
                const ultimoLabel = repStats?.ultimoPedido
                  ? new Date(repStats.ultimoPedido.fecha_entrega ?? repStats.ultimoPedido.fecha_pedido ?? repStats.ultimoPedido.created_at ?? '').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
                  : '—';
                return (
                  <div
                    key={u._id}
                    className="grid grid-cols-[1fr_100px_40px_1fr_100px] px-6 py-2 items-center hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#E61A27]/10 flex items-center justify-center shrink-0">
                        <span className="text-[#E61A27] font-bold text-[10px]">{initials}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{displayName}</p>
                        <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-gray-900 text-center">{count}</p>
                    <span />
                    {mode === 'repartidor'
                      ? <p className="text-xs text-gray-400 truncate pr-2">{ultimoLabel}</p>
                      : <p className="text-xs font-bold">
                          {activeCount > 0
                            ? <span className="text-blue-600">{activeCount}</span>
                            : <span className="text-gray-300">—</span>}
                        </p>
                    }
                    <button
                      onClick={() => onSelect(u)}
                      className="text-[11px] font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      Ver perfil
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────── */
export default function AdminUsuariosPage() {
  const [clientes,      setClientes]      = useState<User[]>([]);
  const [repartidores,  setRepartidores]  = useState<User[]>([]);
  const [orders,        setOrders]        = useState<Order[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [selected,      setSelected]      = useState<User | null>(null);
  const [profileItems,  setProfileItems]  = useState<{ nombre: string; cantidad: number }[]>([]);
  const [profileLoading,setProfileLoading]= useState(false);

  const token = localStorage.getItem('or_token') ?? '';
  const h     = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/admin/users?limit=500`,   { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/admin/orders?limit=500`,  { headers: h }).then(r => r.ok ? r.json() : []),
    ])
      .then(([u, ord]) => {
        const raw: User[] = Array.isArray(u) ? u : u?.users ?? [];
        const seen = new Set<string>();
        const all = raw.filter(x => { if (seen.has(x._id)) return false; seen.add(x._id); return true; });
        setClientes(all.filter(x => x.role === 'customer' || x.rol === 'usuario' || x.rol === 'cliente'));
        setRepartidores(all.filter(x => x.role === 'driver' || x.role === 'repartidor' || x.rol === 'repartidor'));
        setOrders(Array.isArray(ord) ? ord : ord?.orders ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch order details when a user is selected to compute producto estrella
  useEffect(() => {
    if (!selected) { setProfileItems([]); return; }
    const userOrders = orders.filter(o => o.customer_id === selected._id);
    if (userOrders.length === 0) { setProfileItems([]); return; }
    setProfileLoading(true);
    Promise.all(
      userOrders.slice(0, 15).map(o =>
        fetch(`${API}/api/admin/orders/${o._id}`, { headers: h })
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    ).then(results => {
      const items: { nombre: string; cantidad: number }[] = [];
      results.forEach(raw => {
        if (!raw) return;
        const detalles: any[] = raw.detalles ?? raw.items ?? raw.productos ?? [];
        detalles.forEach((it: any) => {
          const nombre = it.nombre_sku_solicitado ?? it.nombre ?? it.nombre_producto ?? it.sku ?? 'Producto';
          const cantidad = it.cantidad ?? it.cantidad_solicitada ?? it.quantity ?? 1;
          items.push({ nombre, cantidad });
        });
      });
      setProfileItems(items);
    }).finally(() => setProfileLoading(false));
  }, [selected]);

  const selectedStats = useMemo(
    () => selected ? computeStats(selected._id, orders) : null,
    [selected, orders]
  );

  const productoEstrella = useMemo(() => {
    if (profileItems.length === 0) return '—';
    const freq: Record<string, number> = {};
    profileItems.forEach(it => { freq[it.nombre] = (freq[it.nombre] ?? 0) + it.cantidad; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  }, [profileItems]);

  const topClientesRanking = useMemo(() =>
    clientes
      .map(u => {
        const s = computeStats(u._id, orders);
        return {
          nombre: u.nombre_negocio ?? u.nombre ?? (u as any).name ?? u.email ?? '—',
          value:  s.totalGastado,
          meta:   `${s.totalPedidos} pedidos`,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 3),
    [clientes, orders]
  );

  const topRepartidoresRanking = useMemo(() =>
    repartidores
      .map(u => {
        const entregados = orders.filter(o =>
          o.driver_id === u._id && o.status_final?.toLowerCase() === 'entregado'
        );
        const value = entregados.reduce((s, o) => s + (o.total ?? o.subtotal ?? (o as any).SubTotal ?? 0), 0);
        return {
          nombre: u.nombre_negocio ?? u.nombre ?? (u as any).name ?? u.email ?? '—',
          value,
          meta: `${entregados.length} entregas`,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 3),
    [repartidores, orders]
  );

  const isRepartidor = selected?.role === 'driver' || selected?.role === 'repartidor' || selected?.rol === 'repartidor';
  const repartidorStats = useMemo(
    () => (selected && isRepartidor) ? computeRepartidorStats(selected._id, orders) : null,
    [selected, orders, isRepartidor]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#E61A27] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-400 mt-0.5">{clientes.length + repartidores.length} usuarios registrados</p>
        </div>
        {/* Search */}
        <div className="relative w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar nombre o email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[#E61A27]"
          />
        </div>
      </div>

      {/* Clientes: ranking + tabla */}
      <div className="flex gap-4 items-stretch">
        <RankingCard
          title="Top clientes por gasto"
          sub="Mayor volumen de compra acumulado"
          items={topClientesRanking}
          valueLabel="MXN acumulado"
          valuePrefix="$"
        />
        <div className="flex-1 min-w-0 flex flex-col">
          <UserTable title="Clientes" users={clientes} orders={orders} search={search} onSelect={setSelected} scrollable />
        </div>
      </div>

      {/* Repartidores: ranking + tabla */}
      <div className="flex gap-4 items-stretch">
        <RankingCard
          title="Top repartidores por gasto"
          sub="Mayor volumen acumulado en pedidos entregados"
          items={topRepartidoresRanking}
          valueLabel="MXN acumulado"
          valuePrefix="$"
        />
        <div className="flex-1 min-w-0 flex flex-col">
          <UserTable title="Repartidores" users={repartidores} orders={orders} search={search} onSelect={setSelected} mode="repartidor" />
        </div>
      </div>

      {/* Profile side panel */}
      <AnimatePresence>
        {selected && selectedStats && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-black/30 z-40"
            />
            <motion.div
              key="panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 40 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">Perfil</h2>
                <button
                  onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-5 py-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#E61A27]/10 flex items-center justify-center shrink-0">
                    <span className="text-[#E61A27] font-black text-xl">
                      {(selected.nombre_negocio ?? selected.nombre ?? selected.name ?? selected.email)[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-gray-900">{selected.nombre_negocio ?? selected.nombre ?? selected.name ?? '—'}</p>
                    <p className="text-sm text-gray-400 truncate">{selected.email}</p>
                    {(selected.created_at ?? selected.createdAt) && (
                      <p className="text-xs text-gray-300 mt-0.5">
                        Desde {new Date(selected.created_at ?? selected.createdAt!).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>

                {isRepartidor ? (
                  /* ── Repartidor panel ── */
                  <>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Pedidos entregados</p>
                      <p className="text-2xl font-black text-gray-900 mt-1">{repartidorStats?.totalEntregados ?? 0}</p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Último pedido entregado</p>
                      {repartidorStats?.ultimoPedido ? (
                        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-mono font-bold text-gray-700 truncate">
                              {repartidorStats.ultimoPedido.id_pedido ?? repartidorStats.ultimoPedido._id}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              Entregado
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            {(repartidorStats.ultimoPedido.fecha_entrega ?? repartidorStats.ultimoPedido.fecha_pedido ?? repartidorStats.ultimoPedido.created_at)
                              ? new Date(repartidorStats.ultimoPedido.fecha_entrega ?? repartidorStats.ultimoPedido.fecha_pedido ?? repartidorStats.ultimoPedido.created_at!).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '—'}
                          </p>
                          {(repartidorStats.ultimoPedido.direccion_entrega ?? repartidorStats.ultimoPedido.direccion) && (
                            <p className="text-xs text-gray-500 truncate">
                              📍 {repartidorStats.ultimoPedido.direccion_entrega ?? repartidorStats.ultimoPedido.direccion}
                            </p>
                          )}
                          {(repartidorStats.ultimoPedido.total ?? repartidorStats.ultimoPedido.subtotal) != null && (
                            <p className="text-sm font-bold text-gray-900">
                              ${(repartidorStats.ultimoPedido.total ?? repartidorStats.ultimoPedido.subtotal)?.toLocaleString('es-MX')} MXN
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Sin pedidos entregados.</p>
                      )}
                    </div>
                  </>
                ) : (
                  /* ── Cliente panel ── */
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total pedidos</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{selectedStats.totalPedidos}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total gastado</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">${selectedStats.totalGastado.toLocaleString('es-MX')}</p>
                        <p className="text-[10px] text-gray-400">MXN</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pedido más reciente</p>
                      {selectedStats.pedidoReciente ? (
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-sm font-mono font-bold text-gray-700 truncate">
                              {selectedStats.pedidoReciente.id_pedido ?? selectedStats.pedidoReciente._id}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[selectedStats.pedidoReciente.status_final] ?? STATUS_BADGE[selectedStats.pedidoReciente.status_final?.toLowerCase()] ?? 'bg-gray-100 text-gray-600'}`}>
                              {(() => { const s = selectedStats.pedidoReciente.status_final ?? ''; return s.charAt(0).toUpperCase() + s.slice(1); })()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            {(selectedStats.pedidoReciente.fecha_pedido ?? selectedStats.pedidoReciente.created_at ?? selectedStats.pedidoReciente.createdAt)
                              ? new Date(selectedStats.pedidoReciente.fecha_pedido ?? selectedStats.pedidoReciente.created_at ?? selectedStats.pedidoReciente.createdAt!).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '—'}
                          </p>
                          {(selectedStats.pedidoReciente.total ?? selectedStats.pedidoReciente.SubTotal) != null && (
                            <p className="text-sm font-bold text-gray-900 mt-1">
                              ${(selectedStats.pedidoReciente.total ?? selectedStats.pedidoReciente.SubTotal)?.toLocaleString('es-MX')} MXN
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Sin pedidos registrados.</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Producto estrella</p>
                      {profileLoading ? (
                        <div className="flex justify-center py-4">
                          <div className="w-5 h-5 border-2 border-gray-200 border-t-yellow-500 rounded-full animate-spin" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                          <div className="w-9 h-9 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          </div>
                          <p className="text-sm font-bold text-gray-900">{productoEstrella}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
