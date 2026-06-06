import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { name: "Inicio", path: "/" },
  { name: "Pedidos", path: "/pedidos" },
  { name: "Seguir", path: "/seguir" },
  { name: "Ayuda", path: "/ayuda" },
  { name: "Perfil", path: "/perfil" },
];

const Navbar = () => {
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const controlNavbar = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", controlNavbar);

    return () => {
      window.removeEventListener("scroll", controlNavbar);
    };
  }, []);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{
          opacity: isVisible ? 1 : 0,
          y: isVisible ? 0 : -20,
        }}
        transition={{
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="
          fixed top-3 left-1/2 -translate-x-1/2 z-50
          w-[95vw] max-w-4xl
          bg-white/95 backdrop-blur-md
          rounded-full
          border border-slate-200
          shadow-lg
          px-4
          h-14
          flex items-center justify-center
        "
      >
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{
                    y: -2,
                    scale: 1.03,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  className="
                    relative
                    px-4
                    py-2
                    text-sm
                    font-semibold
                  "
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavbarItem"
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 35,
                      }}
                      className="
                        absolute inset-0
                        rounded-xl
                        bg-brand-crimson/10
                        border border-brand-crimson/20
                      "
                    />
                  )}

                  <span
                    className={`
                      relative z-10 transition-colors duration-200
                      ${
                        isActive
                          ? "text-brand-crimson"
                          : "text-slate-700 hover:text-brand-crimson"
                      }
                    `}
                  >
                    {item.name}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="
            md:hidden
            absolute right-4
            w-9 h-9
            flex flex-col
            justify-center
            items-center
            gap-1.5
            rounded-lg
            hover:bg-slate-100
            transition-colors
          "
        >
          <span
            className={`
              block h-0.5 w-5 bg-slate-700
              transition-all duration-300
              ${menuOpen ? "rotate-45 translate-y-2" : ""}
            `}
          />

          <span
            className={`
              block h-0.5 w-5 bg-slate-700
              transition-all duration-300
              ${menuOpen ? "opacity-0" : ""}
            `}
          />

          <span
            className={`
              block h-0.5 w-5 bg-slate-700
              transition-all duration-300
              ${menuOpen ? "-rotate-45 -translate-y-2" : ""}
            `}
          />
        </button>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && isVisible && (
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -10,
              scale: 0.95,
            }}
            transition={{
              duration: 0.2,
            }}
            className="
              fixed top-20 left-1/2 -translate-x-1/2
              z-50
              w-[90vw]
              max-w-sm
              bg-white
              rounded-2xl
              border border-slate-200
              shadow-xl
              p-3
              flex flex-col
              gap-1
              md:hidden
            "
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                >
                  <motion.div
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      rounded-xl
                      px-4
                      py-3
                      text-sm
                      font-medium
                      transition-all
                      ${
                        isActive
                          ? "bg-brand-crimson/10 text-brand-crimson"
                          : "text-slate-700 hover:bg-slate-50"
                      }
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