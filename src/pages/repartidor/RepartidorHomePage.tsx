import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

interface AnyOrder { status_final: string; }

const quickLinks = [
  {
    label: 'Pedidos',
    sub: 'Lista de entregas asignadas',
    path: '/repartidor/pedidos',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    ),
    iconBg: 'bg-blue-50 text-blue-600',
  },
  {
    label: 'Ruta',
    sub: 'Ruta activa del día',
    path: '/repartidor/ruta',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    ),
    iconBg: 'bg-green-50 text-green-600',
  },
  {
    label: 'Incidencias',
    sub: 'Reportar un problema',
    path: '/repartidor/incidencias',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    ),
    iconBg: 'bg-orange-50 text-orange-600',
  },
  {
    label: 'Mi perfil',
    sub: 'Ver mi información',
    path: '/repartidor/perfil',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    ),
    iconBg: 'bg-gray-100 text-gray-600',
  },
];

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
      .then((data: any) => {
        // Backend returns [{ order: {...}, detalles: [], tracking: {} }] — extract nested order
        const raw: any[] = Array.isArray(data) ? data : (data?.orders ?? []);
        const orders = raw.map(item => item?.order ?? item);
        const status = (o: any) => (o?.status_final ?? '').toLowerCase();
        setStats({
          total:      orders.length,
          pendientes: orders.filter(o => !['entregado', 'cancelado'].includes(status(o))).length,
          entregadas: orders.filter(o => status(o) === 'entregado').length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.nombre?.split(' ')[0] ?? 'Repartidor';

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <p className="text-sm text-gray-400 font-medium">Bienvenido de vuelta</p>
        <h1 className="text-2xl font-bold text-gray-900">{firstName}</h1>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-24 animate-pulse" />
          ))
        ) : (
          <>
            {/* Total */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
              <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.total}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Asignados</p>
            </div>

            {/* Pendientes */}
            <div className="bg-orange-50 rounded-2xl border border-orange-100 p-4 shadow-sm text-center">
              <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-orange-600 tabular-nums">{stats.pendientes}</p>
              <p className="text-[11px] text-orange-500 mt-0.5 font-medium">Pendientes</p>
            </div>

            {/* Entregadas */}
            <div className="bg-green-50 rounded-2xl border border-green-100 p-4 shadow-sm text-center">
              <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-green-600 tabular-nums">{stats.entregadas}</p>
              <p className="text-[11px] text-green-600 mt-0.5 font-medium">Entregados</p>
            </div>
          </>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {quickLinks.map((item, i) => (
          <motion.button
            key={item.path}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(item.path)}
            className="bg-white border border-gray-100 rounded-2xl p-4 text-left hover:border-gray-200 hover:shadow-sm transition-all"
          >
            <div className={`w-9 h-9 ${item.iconBg} rounded-xl flex items-center justify-center mb-3`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                {item.icon}
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-900">{item.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
