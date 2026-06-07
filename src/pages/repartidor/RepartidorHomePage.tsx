import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import { useRepartidor, STATUS_BADGE } from './RepartidorContext';

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
];

function fmtDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

export default function RepartidorHomePage() {
  const { user }            = useAuth();
  const navigate            = useNavigate();
  const { orders, loading } = useRepartidor();

  const st = (s: string) => s.toLowerCase();

  const todayStr    = new Date().toDateString();
  const todayOrders = orders.filter(o => {
    // Use delivery date first; fall back to assignment date, then order date
    const d = o.fecha_entrega ?? o.assigned_at ?? o.fecha_pedido;
    return !!d && new Date(d).toDateString() === todayStr;
  });

  const total      = todayOrders.length;
  const pendientes = todayOrders.filter(o => !['entregado', 'cancelado'].includes(st(o.status_final))).length;
  const entregadas = todayOrders.filter(o => st(o.status_final) === 'entregado').length;

  const preview = todayOrders.slice(0, 6);

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
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
              <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{total}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Asignados</p>
            </div>

            <div className="bg-orange-50 rounded-2xl border border-orange-100 p-4 shadow-sm text-center">
              <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-orange-600 tabular-nums">{pendientes}</p>
              <p className="text-[11px] text-orange-500 mt-0.5 font-medium">Pendientes</p>
            </div>

            <div className="bg-green-50 rounded-2xl border border-green-100 p-4 shadow-sm text-center">
              <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-green-600 tabular-nums">{entregadas}</p>
              <p className="text-[11px] text-green-600 mt-0.5 font-medium">Entregados</p>
            </div>
          </>
        )}
      </div>

      {/* Orders preview */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3">Pedidos de hoy</h2>
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#E61A27] rounded-full animate-spin mx-auto" />
          </div>
        ) : preview.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-sm text-gray-400">No hay pedidos asignados por ahora.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {preview.map((o, i) => {
              const fecha = o.fecha_entrega ?? o.fecha_pedido;
              return (
                <div key={o._id ?? o.id_pedido ?? i} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[o.status_final] ?? 'bg-gray-100 text-gray-600'}`}>
                        {o.status_final}
                      </span>
                      <span className="text-xs text-gray-400 font-mono truncate">{o.id_pedido ?? o._id}</span>
                    </div>
                    {fecha && (
                      <p className="text-xs text-gray-400 shrink-0">{fmtDate(fecha)}</p>
                    )}
                  </div>

                  {o.direccion_entrega && (
                    <div className="flex items-start gap-1.5 mt-2">
                      <svg className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <p className="text-xs text-gray-500 truncate">{o.direccion_entrega}</p>
                    </div>
                  )}

                  {(o.items ?? []).length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {o.items!.slice(0, 2).map((item, j) => (
                        <div key={j} className="flex justify-between text-xs text-gray-600">
                          <span className="truncate mr-2">{item.nombre}</span>
                          <span className="font-mono text-gray-400 shrink-0">×{item.cantidad}</span>
                        </div>
                      ))}
                      {o.items!.length > 2 && (
                        <p className="text-xs text-gray-400">+{o.items!.length - 2} más</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
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
