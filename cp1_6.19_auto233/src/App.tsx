import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Map3D } from '@/ui/Map3D';
import { LeftToolbar } from '@/ui/LeftToolbar';
import { ControlPanel } from '@/ui/ControlPanel';
import { ChartPanel } from '@/ui/ChartPanel';
import { FacadePopup } from '@/ui/FacadePopup';
import { useAppStore } from '@/store/appStore';
import '@/styles/theme.css';

function App() {
  const { addBuilding, isPlacingMode, setPlacingMode } = useAppStore();

  const handleGroundClick = useCallback(
    (x: number, z: number) => {
      if (isPlacingMode) {
        addBuilding({
          position: { x: Math.round(x / 2) * 2, y: 0, z: Math.round(z / 2) * 2 },
          size: { width: 4, height: 3, depth: 4 },
          rotation: 0,
          blockId: 'custom',
        });
        setPlacingMode(false);
      }
    },
    [isPlacingMode, addBuilding, setPlacingMode]
  );

  return (
    <div className="app-container">
      <motion.div
        className="main-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <Map3D onGroundClick={handleGroundClick} />
        <LeftToolbar />
        <ControlPanel />
        <FacadePopup />

        {isPlacingMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'absolute',
              top: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(79, 195, 247, 0.9)',
              color: '#0F141E',
              padding: '10px 20px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              zIndex: 100,
              boxShadow: '0 4px 20px rgba(79, 195, 247, 0.4)',
            }}
          >
            点击地面放置建筑 (按 ESC 取消)
          </motion.div>
        )}
      </motion.div>

      <ChartPanel />
    </div>
  );
}

export default App;
