// src/services/authService.ts
// ─── SOLO frontend — hace fetch al backend, no importa nada de Node/backend ───

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export type UserRole = 'usuario' | 'admin' | 'repartidor';

export interface LoginResponse {
  token:   string;
  nombre:  string;
  email:   string;
  rol:     UserRole;
  ref_id:  string;
}

export async function loginRequest(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${API}/api/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(body.message ?? 'Error al iniciar sesión');
  }

  return res.json() as Promise<LoginResponse>;
}