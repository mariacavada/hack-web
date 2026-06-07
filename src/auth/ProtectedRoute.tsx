import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth, type UserRole } from './AuthContext';

interface ProtectedRouteProps {
  allowedRole: UserRole;
}

/**
 * Wraps a layout route.
 * - Not logged in  → /login (preserves intended path in state)
 * - Wrong role     → their own dashboard (no spoofing)
 * - Correct role   → renders <Outlet />
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRole }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg, #F1F1F3)',
      }}>
        <span style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '3px solid var(--border, #E5E5E8)',
          borderTopColor: 'var(--brand, #E1242A)',
          animation: 'spin 0.7s linear infinite',
          display: 'block',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (user.rol !== allowedRole) {
    const roleHome: Record<string, string> = {
      usuario:    '/usuario',
      admin:      '/admin',
      repartidor: '/repartidor',
    };
    return <Navigate to={roleHome[user.rol] ?? '/'} replace />;
  }

  return <Outlet />;
};
