import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type UserRole = 'usuario' | 'admin' | 'repartidor';

export interface AuthUser {
  id:     string;
  nombre: string;
  email:  string;
  rol:    UserRole;
  token:  string;
}

interface AuthContextValue {
  user:      AuthUser | null;
  isLoading: boolean;
  login:     (email: string, password: string) => Promise<void>;
  logout:    () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'or_token';
const USER_KEY  = 'or_user';

export const ROLE_PATHS: Record<UserRole, string> = {
  usuario:    '/usuario',
  admin:      '/admin',
  repartidor: '/repartidor',
};

export function pathForRole(rol: UserRole): string {
  return ROLE_PATHS[rol];
}

/* ─── Provider ──────────────────────────────────────────────────────────── */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* Rehydrate session from localStorage on first render */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* ── login ── */
  const login = useCallback(async (email: string, password: string) => {
  const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

  const res = await fetch(`${API}/api/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(body.message ?? 'Credenciales incorrectas');
  }

  const data = await res.json() as {
    token: string;
    user: {
      id:     string;
      email:  string;
      nombre: string;
      rol:    string;
    };
  };

  const rolMap: Record<string, UserRole> = {
    customer: 'usuario',
    driver:   'repartidor',
    admin:    'admin',
  };
  const rol = rolMap[data.user.rol] ?? (data.user.rol as UserRole);

  const authUser: AuthUser = {
    id:     data.user.id,
    nombre: data.user.nombre,
    email:  data.user.email,
    rol,
    token:  data.token,
  };

  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY,  JSON.stringify(authUser));
  setUser(authUser);
}, []);

  /* ── logout ── */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ─── Hook ──────────────────────────────────────────────────────────────── */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
