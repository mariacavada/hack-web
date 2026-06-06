import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router';

// Import the pages you just created
import Home from './pages/Home';
import UsuarioPage from './pages/usuario/UsuarioPage';
import AdminPage from './pages/admin/AdminPage';
import RepartidorPage from './pages/repartidor/RepartidorPage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Main landing page */}
        <Route path="/" element={<Home />} />

        {/* User Type Routes */}
        <Route path="/usuario" element={<UsuarioPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/repartidor" element={<RepartidorPage />} />
      </Routes>
    </Router>
  );
};

export default App;