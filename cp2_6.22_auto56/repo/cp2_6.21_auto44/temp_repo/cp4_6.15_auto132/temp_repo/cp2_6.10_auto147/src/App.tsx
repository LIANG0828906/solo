import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store';
import MapView from './components/MapView';
import InventoryPanel from './components/InventoryPanel';
import CostPanel from './components/CostPanel';
import './styles/App.css';

function App() {
  const loadReferenceData = useAppStore((state) => state.loadReferenceData);
  const [isLoaded, setIsLoaded] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    loadReferenceData().then(() => setIsLoaded(true));
  }, [loadReferenceData]);

  const handleRipple = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.ink-button') && !target.closest('.ripple-target')) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }, []);

  if (!isLoaded) {
    return (
      <div className="loading-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="loading-content"
        >
          <h1 className="title-calligraphy">黑水城商队账目</h1>
          <p>正在加载西域地图...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="app-container" onClick={handleRipple}>
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="ink-spread"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 100,
            height: 100,
            marginLeft: -50,
            marginTop: -50,
          }}
        />
      ))}

      <header className="app-header">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="title-calligraphy app-title"
        >
          黑水城商队账目
        </motion.h1>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '60%' }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
          className="header-divider"
        />
      </header>

      <div className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key="inventory"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="panel-left"
          >
            <InventoryPanel />
          </motion.div>

          <motion.div
            key="map"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="panel-center"
          >
            <MapView />
          </motion.div>

          <motion.div
            key="cost"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="panel-right"
          >
            <CostPanel />
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="app-footer">
        <p>西夏光定年间 · 丝绸之路北道 · 商队通行记录</p>
      </footer>
    </div>
  );
}

export default App;
