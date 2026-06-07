import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import { useRepartidor, STATUS_BADGE } from './RepartidorContext';

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
    const d = o.fecha_entrega ?? o.assigned_at ?? o.fecha_pedido;
    return !!d && new Date(d).toDateString() === todayStr;
  });

  const total      = todayOrders.length;
  const pendientes = todayOrders.filter(o => !['entregado', 'cancelado', 'incompleto'].includes(st(o.status_final))).length;
  const entregadas = todayOrders.filter(o => st(o.status_final) === 'entregado').length;
  const progress   = total > 0 ? Math.round((entregadas / total) * 100) : 0;

  const preview    = todayOrders.slice(0, 6);

  const firstName  = user?.nombre?.split(' ')[0] ?? 'Repartidor';
  const todayLabel = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <p className="text-xs text-gray-400 font-medium">Bienvenido de vuelta</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{firstName}</h1>
        </div>
        <div className="text-right mt-1">
          <p className="text-[10px] font-bold text-[#E61A27] uppercase tracking-widest">Hoy</p>
          <p className="text-xs text-gray-500 capitalize mt-0.5 leading-tight">{todayLabel}</p>
        </div>
      </div>

      {/* ── Mission card ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-gray-100 h-36 animate-pulse shadow-sm" />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm"
        >
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Progreso del día</p>
            <span className="text-xs font-bold text-gray-400 tabular-nums">{progress}%</span>
          </div>

          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full bg-[#E61A27] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
            />
          </div>

          <div className="grid grid-cols-3 text-center divide-x divide-gray-100">
            <div className="pr-2">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{total}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Asignados</p>
            </div>
            <div className="px-2">
              <p className="text-2xl font-bold text-orange-500 tabular-nums">{pendientes}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Pendientes</p>
            </div>
            <div className="pl-2">
              <p className="text-2xl font-bold text-green-600 tabular-nums">{entregadas}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Entregados</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Primary CTA ────────────────────────────────────────────────────── */}
      <motion.button
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/repartidor/ruta')}
        className="w-full bg-gray-900 text-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-md active:shadow-sm transition-shadow"
      >
        <div className="text-left">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Ruta activa</p>
          <p className="text-base font-bold mt-0.5">Ver ruta del día</p>
        </div>
        <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
      </motion.button>

      {/* ── Orders preview ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-900">Pedidos de hoy</p>
          {todayOrders.length > 6 && (
            <button
              onClick={() => navigate('/repartidor/pedidos')}
              className="text-xs font-semibold text-[#E61A27]"
            >
              Ver todos
            </button>
          )}
        </div>

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
                <motion.div
                  key={o._id ?? o.id_pedido ?? i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.04 }}
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
                >
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
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── All done state ──────────────────────────────────────────────────── */}
      {!loading && total > 0 && pendientes === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center"
        >
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-bold text-green-700">¡Jornada completada!</p>
          <p className="text-xs text-green-600 mt-1">
            {entregadas} entrega{entregadas !== 1 ? 's' : ''} realizadas hoy
          </p>
        </motion.div>
      )}

    </div>
  );
}
