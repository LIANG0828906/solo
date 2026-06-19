import { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MapPage from './pages/MapPage';
import BookingPage from './pages/BookingPage';
import ReportPage from './pages/ReportPage';
import StatusPanel from './components/StatusPanel';
import { useStore } from './store';

export default function App() {
  const navigate = useNavigate();
  const fetchData = useStore((s) => s.fetchData);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#121212' }}>
      <nav
        style={{
          height: 56,
          backgroundColor: '#1E1E2E',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          zIndex: 1000,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #2196F3 0%, #4CAF50 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 16,
            }}
          >
            ⚡
          </div>
          <span style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 600 }}>
            社区共享充电桩
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            to="/"
            style={{
              color: '#FFFFFF',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: 8,
              backgroundColor: 'transparent',
              transition: 'all 0.2s ease',
              fontSize: 14,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(33, 150, 243, 0.2)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            地图
          </Link>
          <button
            onClick={() => navigate('/booking')}
            style={{
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #2196F3 0%, #4CAF50 100%)',
              transition: 'all 0.2s ease',
              fontSize: 14,
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            预约充电
          </button>
        </div>
      </nav>

      <div
        style={{
          flex: 1,
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          maxWidth: 1280,
          margin: '0 auto',
        }}
      >
        <div style={{ flex: 1, position: 'relative', width: '70%' }}>
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/booking/:stationId" element={<BookingPage />} />
            <Route path="/report/:bookingId" element={<ReportPage />} />
          </Routes>
        </div>

        {!isMobile && (
          <div style={{ width: 280, flexShrink: 0 }}>
            <StatusPanel />
          </div>
        )}

        <AnimatePresence>
          {isMobile && panelOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              style={{
                position: 'fixed',
                top: 56,
                right: 0,
                bottom: 0,
                width: 280,
                zIndex: 999,
              }}
            >
              <StatusPanel onClose={() => setPanelOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {isMobile && !panelOpen && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPanelOpen(true)}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: '#2196F3',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 24,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(33, 150, 243, 0.4)',
              zIndex: 998,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            📋
          </motion.button>
        )}
      </div>
    </div>
  );
}
