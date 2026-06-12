import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Designer from './pages/Designer';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import OrderDetail from './pages/OrderDetail';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="app-container">
      <nav className="nav-bar">
        <div className="nav-logo">🎨 马赛克工作室</div>
        <button
          className="hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
        <div className="nav-links">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            设计器
          </NavLink>
          <NavLink
            to="/orders"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            订单管理
          </NavLink>
          <NavLink
            to="/inventory"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            材料库存
          </NavLink>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="mobile-menu">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            设计器
          </NavLink>
          <NavLink
            to="/orders"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            订单管理
          </NavLink>
          <NavLink
            to="/inventory"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            材料库存
          </NavLink>
        </div>
      )}

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Designer />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/inventory" element={<Inventory />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
