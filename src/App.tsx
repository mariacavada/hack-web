import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import UsuarioPage from './pages/usuario/UsuarioPage';
import AdminPage from './pages/admin/AdminPage';
import AdminHomePage from './pages/admin/AdminHomePage';
import AdminAnaliticasPage from './pages/admin/AdminAnaliticasPage';
import AdminUsuariosPage from './pages/admin/AdminUsuariosPage';
import AdminCedisPage from './pages/admin/AdminCedisPage';
import RepartidorPage from './pages/repartidor/RepartidorPage';
import RepartidorHomePage from './pages/repartidor/RepartidorHomePage';
import AdminLayout from './layouts/AdminLayout';
import RepartidorLayout from './layouts/RepartidorLayout';
import UsuarioLayout from './layouts/UsuarioLayout';
import PedidosPage from './pages/usuario/PedidosPage';
import CheckoutPage from './pages/usuario/CheckoutPage';
import MisPedidosPage from './pages/usuario/MisPedidos';
import SeguirPage from './pages/usuario/SeguirPage';

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
              <Route path="seguir" element={<SeguirPage />} />
            </Route>
          </Route>

          {/* Admin */}
          <Route element={<ProtectedRoute allowedRole="admin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminHomePage />} />
              <Route path="pedidos"      element={<AdminPage />} />
              <Route path="predicciones" element={<AdminPage />} />
              <Route path="analiticas"   element={<AdminAnaliticasPage />} />
              <Route path="usuarios"     element={<AdminUsuariosPage />} />
              <Route path="cedis"        element={<AdminCedisPage />} />
            </Route>
          </Route>

          {/* Repartidor */}
          <Route element={<ProtectedRoute allowedRole="repartidor" />}>
            <Route path="/repartidor" element={<RepartidorLayout />}>
              <Route index element={<RepartidorHomePage />} />
              <Route path="pedidos"     element={<RepartidorPage />} />
              <Route path="ruta"        element={<RepartidorPage />} />
              <Route path="incidencias" element={<RepartidorPage />} />
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
