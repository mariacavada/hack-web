import React from 'react';
import { Outlet } from 'react-router';
import UsuarioNavbar from "../navbars/UsuarioNavbar";
import AyudaWidget from '../pages/usuario/AyudaWidget';
import { CartProvider } from '../pages/usuario/CartContext';

const UsuarioLayout: React.FC = () => {
  return (
    <CartProvider>
      <div className="min-h-screen bg-neutral-50/30">
        <UsuarioNavbar />
        <main className="pt-20 min-h-screen">
          <Outlet />
        </main>
        <AyudaWidget />
      </div>
    </CartProvider>
  );
};

export default UsuarioLayout;