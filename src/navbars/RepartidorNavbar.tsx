import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import tualiLogo from '../assets/logos/logo.png';

const navItems = [
  { name: 'Inicio',      path: '/repartidor' },
  { name: 'Pedidos',     path: '/repartidor/pedidos' },
  { name: 'Ruta',        path: '/repartidor/ruta' },
  { name: 'Incidencias', path: '/repartidor/incidencias' },
];

const RepartidorNavbar = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { logout, user } = useAuth();
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [isVisible,  setIsVisible]  = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY < lastScrollY || currentScrollY < 10);
      lastScrollY = currentScrollY;
    };
    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, []);

  const handleLogout = () => { logout(); navigate('/', { replace: true }); };
  const initial = (user?.nombre ?? 'R')[0].toUpperCase();

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-4xl rounded-full shadow-lg px-4 h-14 flex items-center justify-between backdrop-blur-md bg-white/90 border border-zinc-200/70"
      >
        {/* Logo */}
        <Link to="/repartidor" className="flex items-center gap-2 shrink-0 pl-1">
          <img src={tualiLogo} alt="Tuali" className="h-8 w-auto object-contain" />
          <span className="font-black text-sm tracking-widest text-neutral-900 hidden sm:block">TUALI</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ y: -2, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative px-4 py-2 text-sm font-semibold"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeRepartidorNavItem"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: 'linear-gradient(rgba(255,240,242,0.97), rgba(255,240,242,0.97)) padding-box, linear-gradient(135deg, #3B0015, #C5002E, #E61A27) border-box',
                        border: '2px solid transparent',
                      }}
                    />
                  )}
                  <span className={`relative z-10 transition-colors duration-200 ${
                    isActive ? 'text-red-700 font-bold' : 'text-neutral-600 hover:text-neutral-900'
                  }`}>
                    {item.name}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Desktop: avatar + logout */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold">
            {initial}
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors px-2"
          >
            Salir
          </button>
        </div>

        {/* Mobile: hamburger */}
        <div className="md:hidden flex items-center gap-2 pr-1">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 flex flex-col justify-center items-center gap-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className={`block h-0.5 w-5 bg-slate-700 transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-0.5 w-5 bg-slate-700 transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-5 bg-slate-700 transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="
              fixed top-20 left-1/2 -translate-x-1/2 z-50
              w-[90vw] max-w-sm
              bg-white rounded-2xl border border-slate-200
              shadow-xl p-3 flex flex-col gap-1 md:hidden
            "
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} onClick={() => setMenuOpen(false)}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      isActive ? 'bg-red-100 text-red-700 font-semibold' : 'text-red-900/70 hover:bg-red-50'
                    }`}
                  >
                    {item.name}
                  </motion.div>
                </Link>
              );
            })}
            <div className="border-t border-slate-100 mt-1 pt-1">
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="w-full rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-all text-left"
              >
                Cerrar sesión
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RepartidorNavbar;
