import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import ControlSliders from './ControlSliders';
import Dashboard from './Dashboard';
import WeatherVane from './WeatherVane';
import LogPanel from './LogPanel';
import './UIPanel.css';

const UIPanel = () => {
  const isStormActive = useStore((state) => state.isStormActive);
  const toggleStorm = useStore((state) => state.toggleStorm);
  const roll = useStore((state) => state.roll);
  const isLanternOn = useStore((state) => state.isLanternOn);
  const toggleLantern = useStore((state) => state.toggleLantern);

  const isDanger = Math.abs(roll) > 28;

  return (
    <div className="ui-panel">
      <AnimatePresence>
        {isDanger && (
          <motion.div
            className="danger-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="danger-border" />
            <div className="vignette" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="top-bar"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="app-title">
          <i className="fas fa-ship"></i>
          <h1>海上丝绸之路帆船避险模拟</h1>
        </div>
        <div className="top-controls">
          <button
            className={`storm-button ${isStormActive ? 'active' : ''}`}
            onClick={toggleStorm}
          >
            <i className={`fas ${isStormActive ? 'fa-sun' : 'fa-cloud-showers-heavy'}`}></i>
            <span>{isStormActive ? '停止风暴' : '起风'}</span>
          </button>
          <button
            className={`lantern-button ${isLanternOn ? 'active' : ''}`}
            onClick={toggleLantern}
          >
            <i className={`fas ${isLanternOn ? 'fa-lightbulb' : 'fa-lightbulb-slash'}`}></i>
          </button>
        </div>
      </motion.div>

      <motion.div
        className="left-panel"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
      >
        <WeatherVane />
      </motion.div>

      <motion.div
        className="right-panel"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
      >
        <LogPanel />
      </motion.div>

      <motion.div
        className="bottom-panel"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
      >
        <div className="bottom-content">
          <div className="sliders-section">
            <ControlSliders />
          </div>
          <div className="dashboard-section">
            <Dashboard />
          </div>
        </div>
      </motion.div>

      {isStormActive && (
        <motion.div
          className="storm-indicator"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className="storm-wave">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="wave-bar"
                animate={{
                  height: [10, 30 + Math.random() * 20, 10],
                }}
                transition={{
                  duration: 0.5 + Math.random() * 0.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
          <span className="storm-text">风暴中</span>
        </motion.div>
      )}
    </div>
  );
};

export default UIPanel;
