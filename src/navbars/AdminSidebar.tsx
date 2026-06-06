import React from 'react';
import { Link, useLocation } from 'react-router';
import { LayoutDashboard, Users, PackageOpen, Presentation, ChartSpline } from 'lucide-react';


const AdminSidebar: React.FC = () => {
  const location = useLocation();
  
  const menuItems = [
    { name: 'Resumen', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { name: 'Pedidos', path: '/admin/pedidos', icon: <PackageOpen size={18} /> },
    { name: 'Predicciones', path: '/admin/predicciones', icon: <Presentation size={18} /> },
    { name: 'Analítica', path: '/admin/analiticas', icon: <ChartSpline size={18} /> },
    { name: 'Usuarios', path: '/admin/usuarios', icon: <Users size={18} /> },
  ];

  return (
    <aside className="w-64 h-screen bg-white border-r border-neutral-100 fixed top-0 left-0 flex flex-col justify-between p-6">
      <div>
        {/* Brand */}
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
          <span className="font-semibold text-sm tracking-wider uppercase text-neutral-800">Productos</span>
        </div>

        {/* Menu */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-neutral-200 text-neutral-900 font-semibold' 
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <span className={isActive ? 'text-red-600' : 'text-neutral-400'}>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile minimal trigger */}
      <div className="border-t border-neutral-100 pt-4 px-2 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold">A</div>
        <div>
          <p className="text-xs font-semibold text-neutral-800">Panel de Administrador</p>
          <Link to="/" className="text-[10px] text-neutral-400 hover:underline">Cerrar Sesión</Link>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;