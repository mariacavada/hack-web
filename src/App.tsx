import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import Home from './pages/Home';
import UsuarioPage from './pages/usuario/UsuarioPage';
import AdminPage from './pages/admin/AdminPage';
import RepartidorPage from './pages/repartidor/RepartidorPage';
import AdminLayout from './layouts/AdminLayout';
import RepartidorLayout from './layouts/RepartidorLayout';
import UsuarioLayout from './layouts/UsuarioLayout';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Main landing page */}
        <Route path="/" element={<Home />} />

        {/* User Type Routes */}
       <Route path="/usuario" element={<UsuarioLayout />}>
          <Route index element={<UsuarioPage />} />
          <Route path="pedido" element={<h2>Sub-page: Current Client Orders</h2>} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminPage />} />
          <Route path="users" element={<h2>Sub-page: Access Management</h2>} />
          <Route path="alerts" element={<h2>Sub-page: Active Stock Substitution Log</h2>} />
          <Route path="settings" element={<h2>Sub-page: Control Rules</h2>} />
        </Route>
        <Route path="/repartidor" element={<RepartidorLayout />}>
          <Route index element={<RepartidorPage />} />
          <Route path="mapa" element={<h2>Sub-page: Live Route Navigation Map</h2>} />
          <Route path="history" element={<h2>Sub-page: Past Deliveries Resolved</h2>} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;