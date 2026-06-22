import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />
      <TopNav />
      <main className="md:ml-[240px] pt-16 pb-20 md:pb-6">
        <div className="p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
