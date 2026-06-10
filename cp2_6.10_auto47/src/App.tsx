import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { WaterClock } from './components/WaterClock';
import { useClockStore, MONTHS } from './store/useClockStore';
import './styles/overlay.css';

const CameraController = () => {
  const { camera } = useThree();
  const isCalibrating = useClockStore(state => state.isCalibrating);
  const targetPosition = useRef(new THREE.Vector3(0, 50, 400));
  const currentPosition = useRef(new THREE.Vector3(0, 50, 400));
  const targetLookAt = useRef(new THREE.Vector3(0, 50, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 50, 0));

  useEffect(() => {
    if (isCalibrating) {
      targetPosition.current.set(0, 120, 120);
      targetLookAt.current.set(0, 120, 0);
    } else {
      targetPosition.current.set(0, 50, 400);
      targetLookAt.current.set(0, 50, 0);
    }
  }, [isCalibrating]);

  useFrame((_, delta) => {
    const lerpFactor = Math.min(delta * 3, 1);
    
    currentPosition.current.lerp(targetPosition.current, lerpFactor);
    currentLookAt.current.lerp(targetLookAt.current, lerpFactor);
    
    camera.position.copy(currentPosition.current);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};

const Scene = () => {
  return (
    <>
      <CameraController />
      <ambientLight intensity={0.6} />
      <directionalLight position={[100, 200, 100]} intensity={0.8} castShadow />
      <pointLight position={[-100, 100, -100]} intensity={0.4} color="#c8a050" />
      <pointLight position={[100, 100, 100]} intensity={0.3} color="#66ccff" />
      
      <WaterClock />
      
      <OrbitControls 
        enablePan={false}
        minDistance={150}
        maxDistance={600}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
};

const StatusPanel = () => {
  const dayRatio = useClockStore(state => state.dayRatio);
  const nightRatio = useClockStore(state => state.nightRatio);
  const currentKe = useClockStore(state => state.currentKe);
  const currentShichen = useClockStore(state => state.currentShichen);

  return (
    <div className="status-panel">
      <div className="status-title">昼夜漏刻比</div>
      <div className="status-value">昼{dayRatio}刻 夜{nightRatio}刻</div>
      <div className="status-sub">
        当前: {currentShichen} · {currentKe.toFixed(1)}刻
      </div>
    </div>
  );
};

const ControlPanel = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const month = useClockStore(state => state.month);
  const isCalibrating = useClockStore(state => state.isCalibrating);
  const isAnimating = useClockStore(state => state.isAnimating);
  const isSuccess = useClockStore(state => state.isSuccess);
  const currentKe = useClockStore(state => state.currentKe);
  const setMonth = useClockStore(state => state.setMonth);
  const setCalibrating = useClockStore(state => state.setCalibrating);
  const reset = useClockStore(state => state.reset);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCalibrate = () => {
    setCalibrating(true);
  };

  const handleReset = () => {
    reset();
  };

  return (
    <>
      <div 
        className={`control-panel ${isMobile && isDrawerOpen ? 'open' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="control-group">
          <label className="control-label">月份调节</label>
          <div className="slider-container">
            <input
              type="range"
              min="0"
              max="11"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="month-slider"
              disabled={isCalibrating || isAnimating}
            />
            <span className="month-display">{MONTHS[month]}</span>
          </div>
        </div>
        
        <div className="button-group">
          <button
            className="control-btn"
            onClick={handleCalibrate}
            disabled={isCalibrating || isAnimating}
          >
            校准时刻
          </button>
          <button
            className="control-btn"
            onClick={handleReset}
            disabled={isCalibrating || isAnimating}
          >
            还原初始状态
          </button>
        </div>
      </div>

      {isMobile && (
        <div 
          className="mobile-drawer-toggle"
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        />
      )}

      <div className="date-panel" onClick={(e) => e.stopPropagation()}>
        <div className="date-slider-vertical">
          <span className="month-display">{MONTHS[11]}</span>
          <input
            type="range"
            min="0"
            max="11"
            value={11 - month}
            onChange={(e) => setMonth(11 - parseInt(e.target.value))}
            className="vertical-slider"
            disabled={isCalibrating || isAnimating}
          />
          <span className="month-display">{MONTHS[0]}</span>
        </div>
      </div>

      <AnimatePresence>
        {isCalibrating && (
          <motion.div
            className="calibration-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCalibrating(false)}
          >
            <motion.div
              className="calibration-panel"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="calibration-title">时刻校准模式</div>
              <div className="calibration-info">
                使用 ↑↓ 箭头键微调浮箭位置<br />
                将箭尖对准正午时刻（50刻）<br />
                按 Enter 确认校准
              </div>
              <div className="calibration-hint">
                当前: {currentKe.toFixed(2)}刻 · 目标: 50.00刻
              </div>
              <div className="button-group">
                <button className="control-btn" onClick={() => setCalibrating(false)}>
                  取消
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSuccess && (
          <motion.div
            className="success-toast"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            校准成功
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const App = () => {
  return (
    <div className="app-container">
      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 50, 400], fov: 50 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 2]}
          performance={{ min: 0.5 }}
        >
          <color attach="background" args={['#1a1a2e']} />
          <fog attach="fog" args={['#1a1a2e', 300, 800]} />
          <Scene />
        </Canvas>
      </div>
      
      <div className="silk-overlay" />
      
      <StatusPanel />
      <ControlPanel />
    </div>
  );
};

export default App;
