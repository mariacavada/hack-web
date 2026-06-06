import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import UsuarioPage from './pages/usuario/UsuarioPage';
import AdminPage from './pages/admin/AdminPage';
import RepartidorPage from './pages/repartidor/RepartidorPage';
import AdminLayout from './layouts/AdminLayout';
import RepartidorLayout from './layouts/RepartidorLayout';
import UsuarioLayout from './layouts/UsuarioLayout';

const App: React.FC = () => {
  return (
    <AuthProvider>          {/* ← envuelve TODO, incluyendo el Router */}
      <Router>
        <Routes>
          {/* Público */}
          <Route path="/" element={<LoginPage />} />

          {/* Usuario */}
          <Route element={<ProtectedRoute allowedRole="usuario" />}>
            <Route path="/usuario" element={<UsuarioLayout />}>
              <Route index element={<UsuarioPage />} />
              <Route path="pedido" element={<h2>Pedidos</h2>} />
            </Route>
          </Route>

          {/* Admin */}
          <Route element={<ProtectedRoute allowedRole="admin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminPage />} />
              <Route path="users"    element={<h2>Usuarios</h2>} />
              <Route path="alerts"   element={<h2>Alertas</h2>} />
              <Route path="settings" element={<h2>Configuración</h2>} />
            </Route>
          </Route>

          {/* Repartidor */}
          <Route element={<ProtectedRoute allowedRole="repartidor" />}>
            <Route path="/repartidor" element={<RepartidorLayout />}>
              <Route index element={<RepartidorPage />} />
              <Route path="mapa"    element={<h2>Mapa</h2>} />
              <Route path="history" element={<h2>Historial</h2>} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;