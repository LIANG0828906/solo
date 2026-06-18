import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PaletteProvider } from './PaletteContext';
import PaletteManager from './PaletteManager';
import PaletteDetail from './PaletteDetail';

const AppInner: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 480;
      setIsMobile(mobile);
      if (mobile) setCollapsed(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div className={`app ${isMobile ? 'mobile-layout' : ''}`}>
      <PaletteManager
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        isMobile={isMobile}
      />
      <motion.main
        className="main-area"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PaletteDetail />
      </motion.main>
    </div>
  );
};

const App: React.FC = () => (
  <PaletteProvider>
    <AppInner />
  </PaletteProvider>
);

export default App;
