import React, { useEffect, useState } from 'react';
import FlavorPanel from './components/FlavorPanel';
import Customizer from './components/Customizer';
import { useStore } from './store/useStore';

const App: React.FC = () => {
  const fetchOrderHistory = useStore((s) => s.fetchOrderHistory);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Inter', sans-serif; }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-thumb { background: #D4AF37; border-radius: 3px; }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    fetchOrderHistory();
  }, [fetchOrderHistory]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          width: '100%',
          height: 64,
          background: 'linear-gradient(135deg, #3E2723 0%, #5D4037 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          borderBottom: '1px solid rgba(212,175,55,0.3)',
        }}
      >
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 24,
            color: '#D4AF37',
            fontWeight: 700,
          }}
        >
          🍫 ChocoBox
        </span>
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
            color: '#D4AF37',
            opacity: 0.8,
          }}
        >
          定制你的专属巧克力礼盒
        </span>
      </header>

      <main
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          minHeight: 'calc(100vh - 64px)',
          background: '#F5F0EB',
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(0,0,0,0.02) 24px, rgba(0,0,0,0.02) 25px), repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(0,0,0,0.01) 24px, rgba(0,0,0,0.01) 25px)`,
        }}
      >
        <div style={isMobile ? { width: '100%' } : { flex: '0 0 360px' }}>
          <FlavorPanel />
        </div>

        {!isMobile && (
          <div
            style={{
              width: 1,
              background: 'rgba(212,175,55,0.15)',
            }}
          />
        )}

        <div style={isMobile ? { width: '100%' } : { flex: '0 0 380px' }}>
          <Customizer />
        </div>
      </main>
    </div>
  );
};

export default App;
