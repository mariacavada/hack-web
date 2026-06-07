import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

interface Notification { _id: string; leida: boolean; mensaje: string; createdAt?: string; }

export default function PerfilPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('or_token');
    if (!token) return;
    fetch(`${API}/api/notifications?solo_no_leidas=false`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then((data: Notification[]) => Array.isArray(data) && setNotifications(data.slice(0, 10)))
      .catch(() => {});
  }, []);

  const markAllRead = () => {
    const token = localStorage.getItem('or_token');
    if (!token) return;
    fetch(`${API}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }).then(() => setNotifications(prev => prev.map(n => ({ ...n, leida: true }))));
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const initials = (user?.nombre ?? 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const unread = notifications.filter(n => !n.leida).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#E61A27] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xl">{initials}</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{user?.nombre ?? 'Usuario'}</h1>
            <p className="text-sm text-gray-400 mt-0.5 truncate">{user?.email}</p>
            <span className="inline-block mt-1.5 text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{user?.rol}</span>
          </div>
        </motion.div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => { setShowNotifs(v => !v); if (!showNotifs && unread > 0) markAllRead(); }}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">Notificaciones</span>
              {unread > 0 && (
                <span className="text-xs font-bold bg-[#E61A27] text-white px-2 py-0.5 rounded-full">{unread}</span>
              )}
            </div>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${showNotifs ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showNotifs && (
            <div className="border-t border-gray-100 divide-y divide-gray-50 max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-5 py-4 text-sm text-gray-400 text-center">Sin notificaciones</p>
              ) : notifications.map(n => (
                <div key={n._id} className={`px-5 py-3 ${!n.leida ? 'bg-blue-50/50' : ''}`}>
                  <p className="text-xs text-gray-700">{n.mensaje}</p>
                  {n.createdAt && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {[
            { label: 'Mis pedidos', path: '/usuario/pedidos', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
            { label: 'Seguimiento de pedido', path: '/usuario/seguir', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0M3 7h18M3 7l2-4h14l2 4M3 7v10h1m15 0h1V7' },
            { label: 'Tienda', path: '/usuario/tienda', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
          ].map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full px-5 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900 flex-1">{item.label}</span>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-white border border-red-200 text-[#E61A27] font-semibold py-4 rounded-2xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
