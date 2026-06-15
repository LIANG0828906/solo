import React, { lazy, Suspense } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';

const OrderForm = lazy(() => import('../order/OrderForm'));
const OrderList = lazy(() => import('../order/OrderList'));
const WorkshopDashboard = lazy(() => import('../workshop/WorkshopDashboard'));
const InventoryManager = lazy(() => import('../workshop/InventoryManager'));

const LoadingSpinner = () => (
  <div style={{
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    height: '60vh'
  }}>
    <div style={{
      width: 40, height: 40, border: '4px solid #E0D5CC',
      borderTopColor: '#C0A080', borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const App: React.FC = () => {
  const location = useLocation();
  const isWorkshop = location.pathname.startsWith('/workshop');

  return (
    <div className="app-layout" style={{ minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 10px 24px; border: none; border-radius: 6px;
          background-color: #C0A080; color: white; font-size: 14px;
          cursor: pointer; transition: all 0.2s ease; text-decoration: none;
          font-weight: 500;
        }
        .btn:hover { background-color: #A08060; }
        .btn-secondary {
          background-color: transparent; color: #4E342E;
          border: 1px solid #D7CCC8;
        }
        .btn-secondary:hover { background-color: #EFEBE9; border-color: #C0A080; }
        .card-hover {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(78, 52, 46, 0.1);
        }
        input, select, textarea {
          width: 100%; padding: 10px 14px; border: 1px solid #D7CCC8;
          border-radius: 6px; font-size: 14px; color: #4E342E;
          background: white; transition: border-color 0.2s;
          font-family: inherit;
        }
        input:focus, select:focus, textarea:focus {
          outline: none; border-color: #C0A080;
          box-shadow: 0 0 0 3px rgba(192, 160, 128, 0.15);
        }
        label {
          display: block; font-size: 13px; color: #6D4C41;
          margin-bottom: 6px; font-weight: 500;
        }
        .form-group { margin-bottom: 18px; }
      `}</style>

      {!isWorkshop && <ClientHeader />}

      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Navigate to="/order/new" replace />} />
          <Route path="/order/new" element={<OrderForm />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/workshop" element={<WorkshopDashboard />} />
          <Route path="/workshop/inventory" element={<InventoryManager />} />
        </Routes>
      </Suspense>
    </div>
  );
};

const ClientHeader: React.FC = () => {
  return (
    <header style={{
      background: 'white',
      borderBottom: '1px solid #E8DFD6',
      padding: '16px 32px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          textDecoration: 'none', color: '#4E342E'
        }}>
          <span style={{ fontSize: 28 }}>💍</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>匠心银饰</div>
            <div style={{ fontSize: 11, color: '#8D6E63' }}>手工定制工作室</div>
          </div>
        </Link>
        <nav style={{ display: 'flex', gap: 8 }}>
          <Link to="/order/new" className="btn btn-secondary"
            style={{ textDecoration: 'none' }}>
            提交定制
          </Link>
          <Link to="/orders" className="btn btn-secondary"
            style={{ textDecoration: 'none' }}>
            查询订单
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default App;
