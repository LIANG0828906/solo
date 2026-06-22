import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from '@/pages/Home';
import History from '@/pages/History';
import Sidebar from '@/components/Sidebar';
import { useFoodStore } from '@/store/foodStore';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fetchTodayRecords = useFoodStore((state) => state.fetchTodayRecords);

  useEffect(() => {
    fetchTodayRecords();
  }, [fetchTodayRecords]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 99,
            display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      <div
        style={{
          flex: 1,
          marginLeft: 'var(--sidebar-width)',
          transition: 'margin-left 0.3s',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            background: 'rgba(255, 255, 255, 0.1)',
            borderBottom: '1px solid rgba(78, 205, 196, 0.2)',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            style={{
              display: 'none',
              background: 'none',
              fontSize: '20px',
              color: 'var(--text-primary)',
            }}
          >
            ☰
          </button>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
            营养追踪
          </h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            智能饮食分析
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/food-search" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: block !important;
          }
          .mobile-overlay {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
