import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

interface AnyOrder { status_final: string; }
interface AnyItem  { nivel?: string; }

function KPICard({ label, value, sub, onClick }: { label: string; value: string | number; sub?: string; onClick?: () => void }) {
  return (
    <motion.div
      whileHover={onClick ? { y: -2 } : {}}
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm ${onClick ? 'cursor-pointer hover:border-gray-300 transition-colors' : ''}`}
    >
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

export default function AdminHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState({ total: 0, pendientes: 0, enCamino: 0, criticos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('or_token') ?? '';
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/api/admin/orders`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/admin/inventory/depletion-risk?nivel=critico`, { headers: h }).then(r => r.ok ? r.json() : []),
    ])
      .then(([o, ri]) => {
        const orders: AnyOrder[] = Array.isArray(o) ? o : o?.orders ?? [];
        const risk: AnyItem[]   = Array.isArray(ri) ? ri : ri?.items ?? [];
        setKpis({
          total:      orders.length,
          pendientes: orders.filter(x => x.status_final === 'Pendiente').length,
          enCamino:   orders.filter(x => x.status_final === 'En camino').length,
          criticos:   risk.length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.nombre?.split(' ')[0] ?? 'Administrador';

  const quickLinks = [
    { label: 'Pedidos',      sub: 'Gestionar y confirmar pedidos',   path: '/admin/pedidos' },
    { label: 'Predicciones', sub: 'Inventario y riesgo de agotamiento', path: '/admin/predicciones' },
    { label: 'Analítica',    sub: 'Datos y métricas operativas',      path: '/admin/analiticas' },
    { label: 'Usuarios',     sub: 'Clientes registrados',             path: '/admin/usuarios' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-400 font-medium">Bienvenido de vuelta</p>
        <h1 className="text-2xl font-bold text-gray-900">{firstName}</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 h-24 animate-pulse" />
          ))
        ) : (
          <>
            <KPICard label="Total pedidos"      value={kpis.total}      onClick={() => navigate('/admin/pedidos')} />
            <KPICard label="Pendientes"         value={kpis.pendientes} sub="Esperan confirmación" onClick={() => navigate('/admin/pedidos')} />
            <KPICard label="En camino"          value={kpis.enCamino}   sub="En ruta ahora"        onClick={() => navigate('/admin/pedidos')} />
            <KPICard label="Productos críticos" value={kpis.criticos}   sub="Riesgo de agotamiento" onClick={() => navigate('/admin/predicciones')} />
          </>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {quickLinks.map(item => (
          <motion.button
            key={item.path}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(item.path)}
            className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-gray-300 transition-colors"
          >
            <p className="text-sm font-semibold text-gray-900">{item.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
