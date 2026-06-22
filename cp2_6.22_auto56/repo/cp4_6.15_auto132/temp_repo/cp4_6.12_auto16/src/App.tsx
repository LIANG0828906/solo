import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';

const CustomizationPage = lazy(() => import('./instrument/CustomizationPage'));
const OrderList = lazy(() => import('./order/OrderList'));
const OrderDetail = lazy(() => import('./order/OrderDetail'));
const InventoryPage = lazy(() => import('./inventory/InventoryPage'));
const HomePage = lazy(() => import('./HomePage'));

const App = () => {
  const location = useLocation();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">🎻</span>
            <h1>琴韵工坊</h1>
          </Link>
          <nav className="nav-links">
            <Link
              to="/"
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              定制乐器
            </Link>
            <Link
              to="/orders"
              className={`nav-link ${location.pathname.startsWith('/orders') ? 'active' : ''}`}
            >
              订单管理
            </Link>
            <Link
              to="/inventory"
              className={`nav-link ${location.pathname === '/inventory' ? 'active' : ''}`}
            >
              木材库存
            </Link>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Suspense fallback={<div className="loading">加载中...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/customize/:type" element={<CustomizationPage />} />
            <Route path="/orders" element={<OrderList />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/inventory" element={<InventoryPage />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="app-footer">
        <p>© 2024 琴韵工坊 - 手工定制乐器</p>
      </footer>
    </div>
  );
};

export default App;
