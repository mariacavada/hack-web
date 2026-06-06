import React from 'react';
import { Outlet } from 'react-router';
import UsuarioNavbar from '../navbars/UsuarioNavbar'

const UsuarioLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50/30">
      <UsuarioNavbar />
      {/* Padding top offsets the height of the fixed navbar */}
      <main className="pt-16 p-8 min-h-screen">
        <div className="max-w-5xl mx-auto mt-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default UsuarioLayout;