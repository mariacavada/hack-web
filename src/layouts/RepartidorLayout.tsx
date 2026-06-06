import React from 'react';
import { Outlet } from 'react-router';
import RepartidorSidebar from '../navbars/RepartidorSidebar';

const RepartidorLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50/50">
      <RepartidorSidebar />
      {/* Margin left offsets the width of the fixed sidebar */}
      <main className="ml-64 p-8 min-h-screen">
        <div className="max-w-6.5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default RepartidorLayout;