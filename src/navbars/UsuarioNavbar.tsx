import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

// Cart atom — lift this to context/zustand if you need cross-page reactivity.
// For now, accepts an optional prop so PedidosPage can pass the count in.
interface NavbarProps {
  cartCount?: number;
}

const navItems = [
  { name: "Inicio",   path: "/usuario" },
  { name: "Tienda",  path: "/usuario/tienda" },
  { name: "Seguir",   path: "/usuario/seguir" },
  { name: "Pedidos",    path: "/usuario/pedidos" },
  { name: "Perfil",   path: "/usuario/perfil" },
];

const Navbar = ({ cartCount = 0 }: NavbarProps) => {
  const location = useLocation();
  const navigate  = useNavigate();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY < lastScrollY || currentScrollY < 10);
      lastScrollY = currentScrollY;
    };
    window.addEventListener("scroll", controlNavbar);
    return () => window.removeEventListener("scroll", controlNavbar);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="
          fixed top-3 left-1/2 -translate-x-1/2 z-50
          w-[95vw] max-w-4xl
          bg-white/95 backdrop-blur-md
          rounded-full
          border border-slate-200
          shadow-lg
          px-4 h-14
          flex items-center justify-between
        "
      >
        {/* Logo / brand */}
        <Link to="/usuario" className="flex items-center gap-1.5 flex-shrink-0 pl-1">
          <span className="text-lg leading-none">🔴</span>
          <span className="font-extrabold text-sm tracking-tight text-gray-900 hidden sm:block">
            Tuli
          </span>
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
                      layoutId="activeNavbarItem"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      className="absolute inset-0 rounded-xl bg-gray-100 border border-gray-200"
                    />
                  )}
                  <span
                    className={`relative z-10 transition-colors duration-200 ${
                      isActive
                        ? "text-neutral-900 font-bold"
                        : "text-slate-500 hover:text-neutral-900"
                    }`}
                  >
                    {item.name}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Cart button (desktop) */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/usuario/tienda/checkout")}
          className="
            hidden md:flex items-center gap-2
            bg-red-600 hover:bg-red-700
            text-white text-sm font-bold
            px-4 py-2 rounded-full
            transition-colors relative flex-shrink-0
            shadow-sm
          "
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          Mi carrito
          {cartCount > 0 && (
            <motion.span
              key={cartCount}
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              className="
                absolute -top-1.5 -right-1.5
                bg-gray-900 text-white text-[10px] font-extrabold
                w-5 h-5 rounded-full flex items-center justify-center
                border-2 border-white
              "
            >
              {cartCount}
            </motion.span>
          )}
        </motion.button>

        {/* Mobile: cart icon + hamburger */}
        <div className="md:hidden flex items-center gap-2 pr-1">
          <button
            onClick={() => navigate("/usuario/tienda/checkout")}
            className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
          >
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-red-600 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 flex flex-col justify-center items-center gap-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className={`block h-0.5 w-5 bg-slate-700 transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block h-0.5 w-5 bg-slate-700 transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-slate-700 transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile dropdown menu */}
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
                    className={`
                      rounded-xl px-4 py-3 text-sm font-medium transition-all
                      ${isActive ? "bg-gray-100 text-neutral-900 font-semibold" : "text-slate-600 hover:bg-slate-50"}
                    `}
                  >
                    {item.name}
                  </motion.div>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;