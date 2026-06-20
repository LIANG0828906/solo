import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HydrologyCanvas from './canvas/HydrologyCanvas';
import ControlPanel from './components/ControlPanel';
import StatisticsPanel from './components/StatisticsPanel';

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const appStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1A1A2E',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    flexShrink: 0,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    color: '#ECF0F1',
    letterSpacing: '2px',
    textTransform: 'none',
  };

  const mainStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    padding: isMobile ? '10px' : '20px',
    gap: isMobile ? '10px' : '20px',
    overflow: 'hidden',
  };

  const canvasContainerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    order: isMobile ? 0 : 1,
    width: '100%',
    height: isMobile ? '60%' : '75%',
    minHeight: isMobile ? '300px' : '400px',
  };

  const sidePanelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'row' : 'column',
    gap: isMobile ? '10px' : '16px',
    order: isMobile ? 1 : 0,
    width: isMobile ? '100%' : 'auto',
    flexShrink: 0,
    overflowY: isMobile ? 'visible' : 'auto',
  };

  const panelWrapperStyle: React.CSSProperties = {
    width: isMobile ? '45%' : '260px',
    flexShrink: 0,
  };

  return (
    <div style={appStyle}>
      <motion.header
        style={headerStyle}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <h1 style={titleStyle}>水文模拟沙盘</h1>
      </motion.header>

      <main style={mainStyle}>
        <motion.div
          style={{
            ...sidePanelStyle,
            order: isMobile ? 1 : 0,
          }}
          initial={{ opacity: 0, x: isMobile ? 0 : -30, y: isMobile ? 30 : 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div style={panelWrapperStyle}>
            <ControlPanel />
          </div>
          {isMobile && (
            <div style={panelWrapperStyle}>
              <StatisticsPanel />
            </div>
          )}
        </motion.div>

        <motion.div
          style={canvasContainerStyle}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <HydrologyCanvas />
        </motion.div>

        {!isMobile && (
          <motion.div
            style={{
              ...sidePanelStyle,
              order: 2,
            }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div style={panelWrapperStyle}>
              <StatisticsPanel />
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default App;
