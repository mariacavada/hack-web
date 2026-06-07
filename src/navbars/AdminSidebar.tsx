import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, Users, PackageOpen, Presentation, ChartSpline } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const handleLogout = () => { logout(); navigate('/', { replace: true }); };
  const initial = (user?.nombre ?? 'A')[0].toUpperCase();
  
  const menuItems = [
    { name: 'Resumen', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { name: 'Pedidos', path: '/admin/pedidos', icon: <PackageOpen size={18} /> },
    { name: 'Predicciones', path: '/admin/predicciones', icon: <Presentation size={18} /> },
    { name: 'Analítica', path: '/admin/analiticas', icon: <ChartSpline size={18} /> },
    { name: 'Usuarios', path: '/admin/usuarios', icon: <Users size={18} /> },
  ];

  return (
    <motion.aside
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{
    duration: 0.5,
    ease: [0.22, 1, 0.36, 1],
  }}
  className="w-64 h-screen bg-white border-r border-neutral-100 fixed top-0 left-0 flex flex-col justify-between p-6"
>
    <aside className="w-64 h-screen bg-white border-r border-neutral-100 fixed top-0 left-0 flex flex-col justify-between p-6">
      <div>
        {/* Brand */}
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
          <span className="font-semibold text-sm tracking-wider uppercase text-neutral-800">Productos</span>
        </div>

        {/* Menu */}
        <nav className="space-y-2">
  {menuItems.map((item, index) => {
    const isActive = location.pathname === item.path;

    return (
      <motion.div
        key={item.name}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: index * 0.05,
          duration: 0.3,
        }}
      >
        <Link to={item.path}>
          <motion.div
            whileHover={{
              scale: 1.03,
              x: 4,
            }}
            whileTap={{ scale: 0.98 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 25,
            }}
            className="
              relative
              flex
              items-center
              gap-3
              overflow-hidden
              rounded-xl
              px-3
              py-2.5
            "
          >
            {isActive && (
              <motion.div
                layoutId="activeNavItem"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute inset-0 rounded-xl bg-gray-100 border border-gray-200"
              />
            )}

            {!isActive && (
              <motion.div
                className="absolute inset-0 rounded-xl bg-gray-50 opacity-0"
                whileHover={{ opacity: 1 }}
              />
            )}

            <motion.span
              whileHover={{ x: 2 }}
              className={`relative z-10 ${isActive ? 'text-neutral-900' : 'text-neutral-400'}`}
            >
              {item.icon}
            </motion.span>

            <span
              className={`relative z-10 text-sm transition-colors ${
                isActive ? 'font-bold text-neutral-900' : 'font-medium text-neutral-500'
              }`}
            >
              {item.name}
            </span>
          </motion.div>
        </Link>
      </motion.div>
    );
  })}
</nav>
      </div>

      {/* User profile minimal trigger */}
      <div className="border-t border-neutral-100 pt-4 px-2 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold">{initial}</div>
        <div>
          <p className="text-xs font-semibold text-neutral-800">{user?.nombre ?? 'Administrador'}</p>
          <button onClick={handleLogout} className="text-[10px] text-neutral-400 hover:underline">Cerrar Sesión</button>
        </div>
      </div>
    </aside>
    </motion.aside>  );
};

export default AdminSidebar;