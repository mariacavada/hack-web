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
import PedidosPage from './pages/usuario/PedidosPage';
import CheckoutPage from './pages/usuario/CheckoutPage';
import MisPedidosPage from './pages/usuario/MisPedidos';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Público */}
          <Route path="/" element={<LoginPage />} />

          {/* Usuario */}
          <Route element={<ProtectedRoute allowedRole="usuario" />}>
            <Route path="/usuario" element={<UsuarioLayout />}>
              <Route index element={<UsuarioPage />} />
              <Route path="tienda" element={<PedidosPage />} />
              <Route path="tienda/checkout" element={<CheckoutPage />} />
              <Route path="pedidos" element={<MisPedidosPage />} />
            </Route>
          </Route>

          {/* Admin */}
          <Route element={<ProtectedRoute allowedRole="admin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminPage />} />
              <Route path="users"    element={<h2>Sub-page: Access Management</h2>} />
              <Route path="alerts"   element={<h2>Sub-page: Active Stock Substitution Log</h2>} />
              <Route path="settings" element={<h2>Sub-page: Control Rules</h2>} />
            </Route>
          </Route>

          {/* Repartidor */}
          <Route element={<ProtectedRoute allowedRole="repartidor" />}>
            <Route path="/repartidor" element={<RepartidorLayout />}>
              <Route index element={<RepartidorPage />} />
              <Route path="mapa"    element={<h2>Sub-page: Live Route Navigation Map</h2>} />
              <Route path="history" element={<h2>Sub-page: Past Deliveries Resolved</h2>} />
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
