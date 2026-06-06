import { motion } from "framer-motion";
import { Link } from 'react-router';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <div className="mb-8">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-[#E61A27]">
              Bienvenid@!
            </p>

            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">
              Iniciar Sesión
            </h1>

            <p className="mt-3 text-zinc-500">
              Ingresa tus credenciales para entrar a tu cuenta.
            </p>
          </div>

          <form className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Email
              </label>

              <motion.input
                whileFocus={{ scale: 1.01 }}
                id="email"
                type="email"
                placeholder="tuli@arca.com"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition-all focus:border-[#E61A27] focus:ring-4 focus:ring-red-50"
              />
            </div>

            <div>
              <label
                htmlFor="contraseña"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Contraseña
              </label>

              <motion.input
                whileFocus={{ scale: 1.01 }}
                id="password"
                type="password"
                placeholder="Ingresa la contraseña"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition-all focus:border-[#E61A27] focus:ring-4 focus:ring-red-50"
              />
            </div>


            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
              className="w-full rounded-xl bg-[#E61A27] py-3.5 font-medium text-white transition-all hover:shadow-lg"
            >
              Iniciar Sesión
            </motion.button>
          </form>
        </div>
        <nav>
                <ul>
                  <li><Link to="/usuario">👤 Go to Usuario View</Link></li>
                  <li><Link to="/admin">⚙️ Go to Admin View</Link></li>
                  <li><Link to="/repartidor">🛵 Go to Repartidor View</Link></li>
                </ul>
              </nav>
      </motion.div>
    </div>
  );
}