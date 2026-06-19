import { motion, AnimatePresence } from 'framer-motion';
import { SonarControlPanel } from '@/components/SonarControlPanel';
import { UnderwaterScene } from '@/components/UnderwaterScene';
import { RadarChart } from '@/components/RadarChart';
import { useStore } from '@/store/useStore';
import './App.css';

function App() {
  const { isUpdating, updateProgress } = useStore();

  return (
    <div className="app-container">
      <SonarControlPanel />

      <div className="scene-wrapper">
        <UnderwaterScene />

        <AnimatePresence>
          {isUpdating && (
            <motion.div
              className="progress-bar-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="progress-bar-track">
                <motion.div
                  className="progress-bar-fill"
                  style={{ width: `${updateProgress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
              <span className="progress-bar-text">地形重建中...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <RadarChart />
    </div>
  );
}

export default App;
