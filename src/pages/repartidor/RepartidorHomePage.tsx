import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

interface AnyOrder { status_final: string; }

export default function RepartidorHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, pendientes: 0, entregadas: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('or_token');
    if (!token) { setLoading(false); return; }
    fetch(`${API}/api/driver/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((data: AnyOrder[] | { orders: AnyOrder[] }) => {
        const orders: AnyOrder[] = Array.isArray(data) ? data : (data as any)?.orders ?? [];
        setStats({
          total:      orders.length,
          pendientes: orders.filter(o => !['Entregado', 'Cancelado'].includes(o.status_final)).length,
          entregadas: orders.filter(o => o.status_final === 'Entregado').length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.nombre?.split(' ')[0] ?? 'Repartidor';

  const quickLinks = [
    { label: 'Pedidos',     sub: 'Lista de entregas asignadas', path: '/repartidor/pedidos' },
    { label: 'Ruta',        sub: 'Ruta activa del día',         path: '/repartidor/ruta' },
    { label: 'Incidencias', sub: 'Reportar un problema',        path: '/repartidor/incidencias' },
    { label: 'Mi perfil',   sub: 'Ver mi información',          path: '/repartidor/perfil' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-400 font-medium">Bienvenido de vuelta</p>
        <h1 className="text-2xl font-bold text-gray-900">{firstName}</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 h-20 animate-pulse" />
          ))
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-400 mt-1">Total asignados</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.pendientes}</p>
              <p className="text-xs text-gray-400 mt-1">Pendientes</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-green-600">{stats.entregadas}</p>
              <p className="text-xs text-gray-400 mt-1">Entregados hoy</p>
            </div>
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
