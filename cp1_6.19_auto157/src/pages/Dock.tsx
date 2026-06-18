import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BottleComposer from '@/components/BottleComposer';
import BottleReceiver from '@/components/BottleReceiver';
import WaveAnimation from '@/components/WaveAnimation';
import CurrentIndicator from '@/components/CurrentIndicator';
import StatsPanel from '@/pages/StatsPanel';

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingBottom: '40px',
};

const dockStyle: React.CSSProperties = {
  width: '900px',
  display: 'flex',
  gap: '20px',
  justifyContent: 'center',
  alignItems: 'flex-start',
  marginTop: '140px',
  position: 'relative',
  zIndex: 2,
};

const navBtnStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: '#1A2B4C',
  border: '2px solid #D4AF37',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#D4AF37',
  fontSize: '16px',
  transition: 'transform 0.2s, box-shadow 0.2s',
};

export default function Dock() {
  const navigate = useNavigate();
  const [showStats, setShowStats] = useState(false);

  const goToLighthouse = useCallback(() => {
    navigate('/lighthouse');
  }, [navigate]);

  return (
    <div style={pageStyle}>
      <WaveAnimation />

      <div style={dockStyle} className="dock-area">
        <BottleComposer />
        <BottleReceiver />
      </div>

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px', zIndex: 2 }}>
        <motion.button
          style={navBtnStyle}
          onClick={goToLighthouse}
          whileHover={{ scale: 1.15, boxShadow: '0 0 12px rgba(212,175,55,0.5)' }}
          whileTap={{ scale: 0.95 }}
          title="回声灯塔"
        >
          🏮
        </motion.button>
        <motion.button
          style={navBtnStyle}
          onClick={() => setShowStats(true)}
          whileHover={{ scale: 1.15, boxShadow: '0 0 12px rgba(212,175,55,0.5)' }}
          whileTap={{ scale: 0.95 }}
          title="历史统计"
        >
          📊
        </motion.button>
      </div>

      <CurrentIndicator />

      <AnimatePresence>
        {showStats && (
          <StatsPanel onClose={() => setShowStats(false)} />
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .dock-area {
            flex-direction: column !important;
            width: 100% !important;
            padding: 0 12px;
          }
          .dock-area > div {
            width: 100% !important;
          }
          .dock-area textarea {
            width: 100% !important;
          }
          .dock-area button[style*="border-radius: 50%"] {
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}
