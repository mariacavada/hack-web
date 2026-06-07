import React from 'react';
import { Outlet } from 'react-router';
import UsuarioNavbar from "../navbars/UsuarioNavbar";
import AyudaWidget from '../pages/usuario/AyudaWidget';
import TuliWidget from '../pages/usuario/TuliWidget';
import { CartProvider } from '../pages/usuario/CartContext';
import { ProductsProvider } from '../pages/usuario/ProductsContext';

const UsuarioLayout: React.FC = () => {
  return (
    <ProductsProvider>
    <CartProvider>
      <div className="min-h-screen bg-neutral-50/30">
        <UsuarioNavbar />
        <main className="pt-20 min-h-screen">
          <Outlet />
        </main>
        <AyudaWidget />
        <TuliWidget />
      </div>
    </CartProvider>
    </ProductsProvider>
  );
};

export default UsuarioLayout;