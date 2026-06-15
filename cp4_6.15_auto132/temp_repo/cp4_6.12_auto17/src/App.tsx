import { Routes, Route, NavLink } from 'react-router-dom';
import DesignPage from './design/DesignPage';
import OrderPage from './order/OrderPage';
import OrderDetail from './order/OrderDetail';

export default function App() {
  return (
    <div className="layout">
      <header className="header">
        <div className="header-logo">
          <span>🧶</span>
          <span>织梦工坊</span>
        </div>
        <nav className="header-nav">
          <NavLink to="/" end className="nav-link">
            图案设计
          </NavLink>
          <NavLink to="/orders" className="nav-link">
            订单管理
          </NavLink>
        </nav>
      </header>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<DesignPage />} />
          <Route path="/orders" element={<OrderPage />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
        </Routes>
      </main>
    </div>
  );
}
