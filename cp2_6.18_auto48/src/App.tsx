import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage, { Toast } from './pages/HomePage';
import ItemDetailPage from './pages/DetailPage';
import DashboardPage from './pages/DashboardPage';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ECFDF5' }}>
      <Navbar />
      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '80px 24px 40px 24px',
        }}
      >
        {children}
      </main>
      <Toast />
      <style>{`
        @keyframes ripple {
          0% { width: 0; height: 0; opacity: 0.6; }
          100% { width: 160px; height: 160px; opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/item/:id" element={<ItemDetailPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
