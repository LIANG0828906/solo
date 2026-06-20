import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MenuManager from './components/MenuManager';
import OrderManager from './components/OrderManager';
import PromotionManager from './components/PromotionManager';

export default function App() {
  return (
    <BrowserRouter>
      <div
        style={{
          backgroundColor: '#f8fafc',
          minHeight: '100vh',
        }}
      >
        <Header />
        <main
          style={{
            marginLeft: 240,
            minHeight: '100vh',
            transition: 'opacity 0.3s ease',
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/menu" element={<MenuManager />} />
            <Route path="/orders" element={<OrderManager />} />
            <Route path="/promotions" element={<PromotionManager />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        `}</style>
      </div>
    </BrowserRouter>
  );
}
