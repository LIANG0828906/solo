import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Scene from './scene';
import InfoPanel from './components/InfoPanel';
import Prescription from './components/Prescription';
import Toast from './components/Toast';
import { AppProvider, useStore } from './store';
import './styles/global.css';

function CompletionOverlay() {
  const { state, dispatch } = useStore();

  useEffect(() => {
    if (state.currentPhase === 'completed' && !state.pillAnimationActive) {
      dispatch({ type: 'START_PILL_ANIMATION' });
      const timer = setTimeout(() => {
        dispatch({ type: 'END_PILL_ANIMATION' });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.currentPhase, state.pillAnimationActive, dispatch]);

  if (state.currentPhase !== 'completed') return null;

  return (
    <AnimatePresence>
      <motion.div
        className="completion-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="completion-content"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <motion.div
            className="completion-title"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            ✨ 药方已配好 ✨
          </motion.div>
          <motion.div
            className="completion-subtitle"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            所有药材均已按照处方准确称量
          </motion.div>
          <motion.button
            className="btn btn-gold"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            onClick={() => window.location.reload()}
            style={{ marginTop: 16 }}
          >
            重新配药
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function AppContent() {
  return (
    <div className="app-container">
      <div className="scene-container">
        <Scene />
      </div>
      <div className="panel-container">
        <InfoPanel />
        <Prescription />
      </div>
      <Toast />
      <CompletionOverlay />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
