import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import RecipeManager from './pages/RecipeManager';
import OrderManager from './pages/OrderManager';
import StockWarning from './pages/StockWarning';
import ReportDashboard from './pages/ReportDashboard';

function App() {
  const navItems = [
    { path: '/recipes', label: '配方管理' },
    { path: '/orders', label: '订单管理' },
    { path: '/stocks', label: '库存预警' },
    { path: '/reports', label: '成本概览' },
  ];

  return (
    <div className="app-container">
      <style>{`
        .app-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          height: 64px;
          background-color: #f59e0b;
          color: #ffffff;
          display: flex;
          align-items: center;
          padding: 0 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .navbar-brand {
          font-size: 20px;
          font-weight: 700;
          margin-right: 40px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .navbar-links {
          display: flex;
          gap: 8px;
          align-items: center;
          flex: 1;
        }
        .nav-link {
          color: #ffffff;
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.2s ease-out;
        }
        .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.15);
        }
        .nav-link.active {
          background-color: rgba(255, 255, 255, 0.25);
          font-weight: 600;
        }
        .main-content {
          flex: 1;
          overflow-x: auto;
        }
        @media (max-width: 768px) {
          .navbar {
            height: auto;
            padding: 12px 16px;
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .navbar-brand {
            margin-right: 0;
          }
          .navbar-links {
            flex-wrap: wrap;
            gap: 4px;
          }
          .nav-link {
            padding: 6px 12px;
            font-size: 13px;
          }
        }
      `}</style>
      <nav className="navbar">
        <div className="navbar-brand">
          <span>🍰</span>
          <span>烘焙工作室</span>
        </div>
        <div className="navbar-links">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/recipes" replace />} />
          <Route path="/recipes" element={<RecipeManager />} />
          <Route path="/orders" element={<OrderManager />} />
          <Route path="/stocks" element={<StockWarning />} />
          <Route path="/reports" element={<ReportDashboard />} />
          <Route path="*" element={<Navigate to="/recipes" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
