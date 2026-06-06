import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import Home from './pages/Home';
import UsuarioPage from './pages/usuario/UsuarioPage';
import AdminPage from './pages/admin/AdminPage';
import RepartidorPage from './pages/repartidor/RepartidorPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/usuario" element={<UsuarioPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/repartidor" element={<RepartidorPage />} />
      </Routes>
    </Router>
  );
};
