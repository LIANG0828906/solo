import { Routes, Route, NavLink } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const OrderList = lazy(() => import('./orders/OrderList'));
const MaterialDashboard = lazy(() => import('./materials/MaterialDashboard'));

function App() {
  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">⚒</span>
          <span className="brand-text">皮具工坊</span>
        </div>
        <div className="sidebar-nav">
          <NavLink
            to="/orders"
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            <span className="nav-icon">📋</span>
            订单管理
          </NavLink>
          <NavLink
            to="/materials"
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            <span className="nav-icon">🧵</span>
            原料管理
          </NavLink>
        </div>
      </nav>
      <main className="main-content">
        <Suspense
          fallback={
            <div className="loading-wrapper">
              <div className="loading-spinner" />
              <p>加载中...</p>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<OrderList />} />
            <Route path="/orders" element={<OrderList />} />
            <Route path="/materials" element={<MaterialDashboard />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
