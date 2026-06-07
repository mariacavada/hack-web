import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { motion } from 'framer-motion';

const ADMIN_PATH_TAB: Record<string, 'pedidos' | 'inventario' | 'usuarios'> = {
  '/admin/predicciones': 'inventario',
  '/admin/analiticas':   'inventario',
  '/admin/usuarios':     'usuarios',
};

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

interface Order {
  _id: string;
  id_pedido?: string;
  status_final: string;
  total?: number;
  SubTotal?: number;
  createdAt?: string;
  fecha_pedido?: string;
  usuario?: { nombre?: string; email?: string };
  items?: { nombre: string; cantidad: number }[];
}

interface LowStockItem {
  sku: string;
  nombre?: string;
  stock_actual?: number;
  stock_minimo?: number;
  cedis_id?: string;
}

interface RiskItem {
  sku: string;
  nombre?: string;
  nivel?: string;
  probabilidad?: number;
  horas_estimadas?: number;
}

interface User {
  _id: string;
  nombre?: string;
  name?: string;
  email: string;
  role?: string;
  createdAt?: string;
}

const STATUS_BADGE: Record<string, string> = {
  'Pendiente':      'bg-yellow-100 text-yellow-700',
  'Confirmado':     'bg-blue-100 text-blue-700',
  'En preparación': 'bg-indigo-100 text-indigo-700',
  'En camino':      'bg-orange-100 text-orange-700',
  'Entregado':      'bg-green-100 text-green-700',
  'Cancelado':      'bg-red-100 text-red-700',
};

function KPICard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminPage() {
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [riskItems, setRiskItems] = useState<RiskItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pedidos' | 'inventario' | 'usuarios'>(
    ADMIN_PATH_TAB[location.pathname] ?? 'pedidos'
  );
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(ADMIN_PATH_TAB[location.pathname] ?? 'pedidos');
  }, [location.pathname]);

  const token = localStorage.getItem('or_token') ?? '';
  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/admin/orders`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/admin/inventory/low-stock?cedis_id=3012`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/admin/inventory/depletion-risk?nivel=critico`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/admin/users?role=usuario`, { headers: h }).then(r => r.ok ? r.json() : []),
    ])
      .then(([o, ls, ri, u]) => {
        setOrders(Array.isArray(o) ? o : o?.orders ?? []);
        setLowStock(Array.isArray(ls) ? ls : ls?.items ?? []);
        setRiskItems(Array.isArray(ri) ? ri : ri?.items ?? []);
        setUsers(Array.isArray(u) ? u : u?.users ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const confirmOrder = async (id: string) => {
    setConfirmingId(id);
    try {
      const res = await fetch(`${API}/api/admin/orders/${id}/confirm`, { method: 'PATCH', headers: h });
      if (res.ok) {
        setOrders(prev => prev.map(o =>
          (o._id === id || o.id_pedido === id) ? { ...o, status_final: 'Confirmado' } : o
        ));
      }
    } finally {
      setConfirmingId(null);
    }
  };

  const displayed = statusFilter
    ? orders.filter(o => o.status_final?.toLowerCase() === statusFilter.toLowerCase())
    : orders;

  const kpis = {
    total: orders.length,
    pendientes: orders.filter(o => o.status_final === 'Pendiente').length,
    enCamino: orders.filter(o => o.status_final === 'En camino').length,
    criticos: riskItems.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#E61A27] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel de Administrador</h1>
        <p className="text-sm text-gray-400 mt-0.5">Resumen operativo en tiempo real</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total pedidos" value={kpis.total} />
        <KPICard label="Pendientes" value={kpis.pendientes} sub="Esperan confirmación" />
        <KPICard label="En camino" value={kpis.enCamino} sub="En ruta ahora" />
        <KPICard label="Productos críticos" value={kpis.criticos} sub="Riesgo de agotamiento" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['pedidos', 'inventario', 'usuarios'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* PEDIDOS */}
      {activeTab === 'pedidos' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-bold text-gray-900">Pedidos ({displayed.length})</h2>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#E61A27]"
            >
              <option value="">Todos los estados</option>
              {['Pendiente','Confirmado','En preparación','En camino','Entregado','Cancelado'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {displayed.length === 0 ? (
              <p className="p-8 text-center text-sm text-gray-400">Sin pedidos con ese filtro.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {displayed.map(o => (
                  <div key={o._id} className="px-5 py-4 flex flex-wrap items-center gap-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-mono font-bold text-gray-700">{o.id_pedido ?? o._id}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[o.status_final] ?? 'bg-gray-100 text-gray-600'}`}>
                          {o.status_final}
                        </span>
                      </div>
                      {o.usuario?.nombre && (
                        <p className="text-xs text-gray-400">{o.usuario.nombre} · {o.usuario.email}</p>
                      )}
                      {(o.fecha_pedido || o.createdAt) && (
                        <p className="text-xs text-gray-400">
                          {new Date(o.fecha_pedido ?? o.createdAt!).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      {(o.total ?? o.SubTotal) !== undefined && (
                        <p className="text-sm font-bold text-gray-900">${(o.total ?? o.SubTotal)?.toLocaleString('es-MX')} MXN</p>
                      )}
                      {o.status_final === 'Pendiente' && (
                        <button
                          onClick={() => confirmOrder(o._id)}
                          disabled={confirmingId === o._id}
                          className="text-xs font-semibold bg-[#E61A27] text-white px-3 py-1 rounded-lg hover:bg-[#B31217] disabled:opacity-50 transition-colors"
                        >
                          {confirmingId === o._id ? 'Confirmando…' : 'Confirmar'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* INVENTARIO */}
      {activeTab === 'inventario' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Low stock */}
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3">Bajo stock ({lowStock.length})</h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {lowStock.length === 0 ? (
                <p className="p-8 text-center text-sm text-gray-400">Sin productos con bajo stock.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {lowStock.map((item, i) => (
                    <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.nombre ?? item.sku}</p>
                        <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}{item.cedis_id ? ` · CEDIS ${item.cedis_id}` : ''}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-orange-600">{item.stock_actual ?? '—'} uds.</p>
                        {item.stock_minimo !== undefined && (
                          <p className="text-xs text-gray-400">Mín: {item.stock_minimo}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Depletion risk */}
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3">Riesgo de agotamiento — crítico ({riskItems.length})</h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {riskItems.length === 0 ? (
                <p className="p-8 text-center text-sm text-gray-400">Sin alertas críticas.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {riskItems.map((item, i) => (
                    <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.nombre ?? item.sku}</p>
                        <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {item.probabilidad !== undefined && (
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                              <div className="h-full bg-[#E61A27] rounded-full" style={{ width: `${item.probabilidad}%` }} />
                            </div>
                            <span className="text-xs font-bold text-[#E61A27]">{item.probabilidad}%</span>
                          </div>
                        )}
                        {item.horas_estimadas !== undefined && (
                          <p className="text-xs text-gray-400 mt-1">~{item.horas_estimadas}h restantes</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* USUARIOS */}
      {activeTab === 'usuarios' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-base font-bold text-gray-900 mb-3">Clientes registrados ({users.length})</h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {users.length === 0 ? (
              <p className="p-8 text-center text-sm text-gray-400">Sin usuarios.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {users.map(u => (
                  <div key={u._id} className="px-5 py-3.5 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-[#E61A27]/10 flex items-center justify-center shrink-0">
                      <span className="text-[#E61A27] font-bold text-sm">
                        {(u.nombre ?? u.name ?? u.email)[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.nombre ?? u.name ?? '—'}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                    {u.createdAt && (
                      <p className="text-xs text-gray-400 shrink-0">
                        {new Date(u.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
