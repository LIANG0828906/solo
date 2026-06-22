import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './store/useStore';
import DeviceList from './pages/DeviceList';
import ReservationPage from './pages/ReservationPage';

const App = () => {
  const { currentView, setCurrentView, fetchDevices, fetchReservations, overdueCount, updateOverdueStatus } = useStore();

  useEffect(() => {
    fetchDevices();
    fetchReservations();
    const interval = setInterval(() => {
      updateOverdueStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchDevices, fetchReservations, updateOverdueStatus]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav
        style={{
          backgroundColor: '#0B3C5D',
          color: 'white',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>LabLend</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => setCurrentView('devices')}
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: currentView === 'devices' ? '#1A5A8C' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (currentView !== 'devices') {
                e.currentTarget.style.backgroundColor = '#1A5A8C';
              }
            }}
            onMouseLeave={(e) => {
              if (currentView !== 'devices') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            设备列表
          </button>
          <button
            onClick={() => setCurrentView('reservations')}
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: currentView === 'reservations' ? '#1A5A8C' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'background-color 0.2s ease',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              if (currentView !== 'reservations') {
                e.currentTarget.style.backgroundColor = '#1A5A8C';
              }
            }}
            onMouseLeave={(e) => {
              if (currentView !== 'reservations') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            预约记录
            {overdueCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  backgroundColor: '#E53935',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                }}
              >
                {overdueCount}
              </motion.span>
            )}
          </button>
        </div>
      </nav>

      <main style={{ flex: 1, padding: '2rem' }}>
        <AnimatePresence mode="wait">
          {currentView === 'devices' ? (
            <motion.div
              key="devices"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <DeviceList />
            </motion.div>
          ) : (
            <motion.div
              key="reservations"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ReservationPage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer
        style={{
          backgroundColor: '#0B3C5D',
          color: 'white',
          padding: '1rem',
          textAlign: 'center',
          fontSize: '0.875rem',
        }}
      >
        © 2026 LabLend - 实验室设备预约管理系统
      </footer>
    </div>
  );
};

export default App;
