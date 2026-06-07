import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

const STATUS_STEP: Record<string, number> = {
  'Pendiente': 0,
  'Confirmado': 1,
  'En preparación': 2,
  'En camino': 3,
  'Entregado': 4,
};

const STATUS_LABEL: Record<string, string> = {
  'Pendiente': 'Pedido recibido',
  'Confirmado': 'Confirmado',
  'En preparación': 'Preparando tu pedido',
  'En camino': 'Tu pedido está en camino',
  'Entregado': 'Entregado',
  'Cancelado': 'Cancelado',
};

const TIMELINE = ['Pendiente', 'Confirmado', 'En preparación', 'En camino', 'Entregado'];

interface OrderItem { nombre: string; cantidad: number; }
interface Order {
  id_pedido: string;
  status_final: string;
  total: number;
  items: OrderItem[];
}
interface Notification { _id: string; leida: boolean; mensaje?: string; tipo?: string; }

export default function UsuarioPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('or_token');
    if (!token) { setLoading(false); return; }
    const h = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/api/orders/my`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/notifications?solo_no_leidas=true`, { headers: h }).then(r => r.ok ? r.json() : []),
    ])
      .then(([orders, notifs]: [Order[], Notification[]]) => {
        if (Array.isArray(orders) && orders.length > 0) {
          const active = orders.find(o => !['Entregado', 'Cancelado'].includes(o.status_final));
          setActiveOrder(active ?? orders[0]);
        }
        if (Array.isArray(notifs)) {
          setUnread(notifs.filter(n => !n.leida).length);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.nombre?.split(' ')[0] ?? 'Usuario';
  const step = activeOrder ? (STATUS_STEP[activeOrder.status_final] ?? 0) : 0;
  const isActive = activeOrder && !['Entregado', 'Cancelado'].includes(activeOrder.status_final);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Greeting */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400 font-medium">Bienvenido de vuelta</p>
            <h1 className="text-2xl font-bold text-gray-900">{firstName}</h1>
          </div>
          {unread > 0 && (
            <div className="relative mt-1">
              <div className="w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E61A27] text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unread}</span>
            </div>
          )}
        </div>

        {/* Active order card */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 h-40 animate-pulse" />
        ) : isActive ? (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate('/usuario/seguir')}
            className="w-full bg-[#E61A27] rounded-2xl p-5 text-white shadow-lg text-left"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium bg-white/20 px-2.5 py-1 rounded-full">
                {activeOrder!.id_pedido}
              </span>
              <svg className="w-6 h-6 opacity-90" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0M3 7h18M3 7l2-4h14l2 4M3 7v10h1m15 0h1V7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mt-3">{STATUS_LABEL[activeOrder!.status_final]}</h2>
            <p className="text-white/80 text-sm mt-1">
              {activeOrder!.items?.length ?? 0} productos · ${activeOrder!.total?.toLocaleString('es-MX')} MXN
            </p>
            <div className="flex gap-1 mt-4">
              {TIMELINE.map((_, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= step ? 'bg-white' : 'bg-white/30'}`} />
              ))}
            </div>
            <p className="text-white/70 text-xs mt-2">Ver seguimiento →</p>
          </motion.button>
        ) : activeOrder ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-green-200 p-5 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Último pedido entregado</p>
              <p className="text-xs text-gray-400 mt-0.5">{activeOrder.id_pedido} · ${activeOrder.total?.toLocaleString('es-MX')} MXN</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-dashed border-gray-300 p-6 text-center"
          >
            <p className="text-gray-500 text-sm">No tienes pedidos activos.</p>
            <p className="text-gray-400 text-xs mt-1">¡Haz tu primer pedido!</p>
          </motion.div>
        )}

        {/* CTA */}
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => navigate('/usuario/tienda')}
          className="w-full bg-[#E61A27] hover:bg-[#B31217] text-white font-bold py-4 rounded-2xl shadow-sm transition-colors flex items-center justify-center gap-2 text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Hacer un pedido
        </motion.button>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/usuario/pedidos')}
            className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-gray-300 transition-colors"
          >
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-900">Mis pedidos</p>
            <p className="text-xs text-gray-400 mt-0.5">Historial completo</p>
          </button>

          <button
            onClick={() => navigate('/usuario/seguir')}
            className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-gray-300 transition-colors"
          >
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0M3 7h18M3 7l2-4h14l2 4M3 7v10h1m15 0h1V7" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-900">Seguimiento</p>
            <p className="text-xs text-gray-400 mt-0.5">¿Dónde está mi pedido?</p>
          </button>
        </div>
      </div>
    </div>
  );
}
