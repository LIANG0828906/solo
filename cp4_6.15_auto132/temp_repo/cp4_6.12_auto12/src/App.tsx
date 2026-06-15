import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { ClientOrder } from './pages/ClientOrder';
import { AdminFormulas } from './pages/AdminFormulas';
import { AdminOrders } from './pages/AdminOrders';
import { AdminDashboard } from './pages/AdminDashboard';

const App: React.FC = () => {
  return (
    <div className="app">
      <nav className="navbar">
        <h1>🌿 光合染坊</h1>
        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
            在线下单
          </NavLink>
          <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            数据仪表盘
          </NavLink>
          <NavLink to="/admin/formulas" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            配方管理
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            订单管理
          </NavLink>
        </div>
      </nav>
      
      <main className="container">
        <Routes>
          <Route path="/" element={<ClientOrder />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/formulas" element={<AdminFormulas />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
