import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCelestialStore } from './store';

export default function ControlPanel() {
  const {
    targetOrbitSpeed,
    targetEarthScale,
    targetMoonOrbitScale,
    setOrbitSpeed,
    setEarthScale,
    setMoonOrbitScale,
  } = useCelestialStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 768 && width < 1200);
    };
    
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const handleOrbitSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrbitSpeed(parseFloat(e.target.value));
  };

  const handleEarthScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEarthScale(parseFloat(e.target.value));
  };

  const handleMoonOrbitScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMoonOrbitScale(parseFloat(e.target.value));
  };

  return (
    <motion.div
      className={`control-panel ${isExpanded ? 'expanded' : ''}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      {isTablet && (
        <div
          className={`panel-drawer-handle ${isExpanded ? 'expanded' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>参数调节</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      )}
      
      <AnimatePresence>
        {(!isTablet || isExpanded) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {!isTablet && <h2>天体参数控制</h2>}
            
            <div className="slider-container">
              <div className="slider-label">
                <span>公转速度</span>
                <span className="slider-value">{targetOrbitSpeed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                className="slider"
                min="1"
                max="10"
                step="0.5"
                value={targetOrbitSpeed}
                onChange={handleOrbitSpeedChange}
              />
            </div>
            
            <div className="slider-container">
              <div className="slider-label">
                <span>地球半径缩放</span>
                <span className="slider-value">{targetEarthScale.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                className="slider"
                min="0.5"
                max="2.0"
                step="0.1"
                value={targetEarthScale}
                onChange={handleEarthScaleChange}
              />
            </div>
            
            <div className="slider-container">
              <div className="slider-label">
                <span>月球轨道缩放</span>
                <span className="slider-value">{targetMoonOrbitScale.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                className="slider"
                min="1.0"
                max="3.0"
                step="0.1"
                value={targetMoonOrbitScale}
                onChange={handleMoonOrbitScaleChange}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
