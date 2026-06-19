import { useEffect, useState } from 'react';
import SoundScene from '@/components/SoundScene';
import ControlPanel from '@/components/ControlPanel';
import ReverbChart from '@/components/ReverbChart';
import { motion } from 'framer-motion';

export default function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkWidth = () => setIsMobile(window.innerWidth < 1024);
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  if (isMobile) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1A1A2E',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ flex: 1, position: 'relative', minHeight: 0 }}
        >
          <SoundScene />
        </motion.div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120, duration: 0.3, delay: 0.1 }}
          style={{
            height: 200,
            display: 'flex',
            gap: 8,
            padding: 8,
            backgroundColor: '#16213E',
            borderTop: '1px solid #0F3460',
            overflow: 'hidden',
          }}
        >
          <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
            <ControlPanel />
          </div>
          <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
            <ReverbChart />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        backgroundColor: '#1A1A2E',
        overflow: 'hidden',
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{ flex: 7, position: 'relative', minWidth: 0 }}
      >
        <SoundScene />
      </motion.div>

      <div
        style={{
          flex: 3,
          display: 'flex',
          flexDirection: 'column',
          padding: 12,
          minWidth: 0,
          gap: 0,
        }}
      >
        <div style={{ flex: '0 0 auto', overflowY: 'auto', maxHeight: '55%' }}>
          <ControlPanel />
        </div>
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 180 }}>
          <ReverbChart />
        </div>
      </div>
    </div>
  );
}
