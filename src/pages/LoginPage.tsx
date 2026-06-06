import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router';
import { useAuth, pathForRole } from '../auth/AuthContext';
import type { UserRole } from '../auth/AuthContext';


/* ─── Eye icon ──────────────────────────────────────────────────────────── */
function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {open ? (
        <>
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M17.9 17.9A10 10 0 0 1 12 19C6 19 2 12 2 12a18 18 0 0 1 5.1-5.9M9.9 4.2A9.8 9.8 0 0 1 12 4c6 0 10 8 10 8a18 18 0 0 1-2.3 3.4" />
          <path d="M3 3l18 18" />
        </>
      )}
    </svg>
  );
}

/* ─── Main component ────────────────────────────────────────────────────── */
export default function LoginPage() {
  const { user, login }    = useAuth();
  const navigate           = useNavigate();
  const location           = useLocation();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  /* Already logged in — redirect to their dashboard */
  if (user) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
    return <Navigate to={from ?? pathForRole(user.rol)} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  if (!email.trim() || !password) {
    setError('Por favor completa todos los campos.');
    return;
  }

  setLoading(true);
  try {
    await login(email.trim().toLowerCase(), password);

    // login() ya guardó en localStorage — leemos directo de ahí
    const raw = localStorage.getItem('or_user');
    if (!raw) throw new Error('No se pudo guardar la sesión');
    
    const u = JSON.parse(raw) as { rol: UserRole };
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
    
    // Validar que el rol sea válido antes de navegar
    const validRoles = ['usuario', 'admin', 'repartidor'];
    if (!validRoles.includes(u.rol)) throw new Error('Rol no reconocido');

    navigate(from ?? pathForRole(u.rol), { replace: true });

  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">

          {/* ── Header ── */}
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

          {/* ── Error banner ── */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-center gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-[#B3161C]"
              role="alert"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>
                <path d="M12 9v4M12 17h.01"/>
              </svg>
              {error}
            </motion.div>
          )}

          {/* ── Form ── */}
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-700">
                Email
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="tuli@arca.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition-all focus:border-[#E61A27] focus:ring-4 focus:ring-red-50 disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-700">
                Contraseña
              </label>
              <div className="relative">
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Ingresa la contraseña"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 pr-12 text-zinc-900 outline-none transition-all focus:border-[#E61A27] focus:ring-4 focus:ring-red-50 disabled:opacity-60"
                />
                <button
                  type="button"
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <EyeIcon open={showPass} />
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={loading ? {} : { y: -1 }}
              whileTap={loading  ? {} : { scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#E61A27] py-3.5 font-medium text-white transition-all hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              )}
              {loading ? 'Verificando…' : 'Iniciar Sesión'}
            </motion.button>
          </form>
        </div>

        {/* ── Dev shortcut links (remove before production) ── */}
        {import.meta.env.DEV && (
          <nav className="mt-4 text-center text-sm text-zinc-400">
            <ul className="flex justify-center gap-4">
              <li><a href="/usuario"    className="hover:text-zinc-600">👤 Usuario</a></li>
              <li><a href="/admin"      className="hover:text-zinc-600">⚙️ Admin</a></li>
              <li><a href="/repartidor" className="hover:text-zinc-600">🛵 Repartidor</a></li>
            </ul>
          </nav>
        )}
      </motion.div>
    </div>
  );
}
