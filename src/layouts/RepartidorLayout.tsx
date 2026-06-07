import React from 'react';
import { Outlet } from 'react-router';
import RepartidorNavbar from '../navbars/RepartidorNavbar';
import { RepartidorProvider } from '../pages/repartidor/RepartidorContext';

const RepartidorLayout: React.FC = () => {
  return (
    <RepartidorProvider>
      <div className="min-h-screen bg-neutral-50/50">
        <RepartidorNavbar />
        <main className="pt-20 px-4 pb-8 min-h-screen">
          <div className="max-w-3xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </RepartidorProvider>
  );
};

export default RepartidorLayout;
