import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

function PoundingStation() {
  const { processData, addPounding, addWater, advanceStage, triggerSweep, playSound, materials } = useGameStore();
  const { poundingCount, hardness, hardnessHistory } = processData;
  const [isPounded, setIsPounded] = useState(false);
  const [showMallet, setShowMallet] = useState(false);
  const lastPoundRef = useRef(0);

  const handlePound = useCallback(() => {
    const now = Date.now();
    if (now - lastPoundRef.current < 100) return;
    lastPoundRef.current = now;
    
    setIsPounded(true);
    setShowMallet(true);
    addPounding();
    playSound('guzheng');
    
    setTimeout(() => setIsPounded(false), 100);
    setTimeout(() => setShowMallet(false), 200);
  }, [addPounding, playSound]);

  useEffect(() => {
    if (hardness >= 3) {
      triggerSweep();
      playSound('success');
      setTimeout(() => advanceStage('molding'), 500);
    }
  }, [hardness, advanceStage, triggerSweep, playSound]);

  const chartWidth = 280;
  const chartHeight = 100;
  const maxPoints = 30;
  const displayHistory = hardnessHistory.slice(-maxPoints);
  
  const points = displayHistory.map((h, i) => {
    const x = (i / (displayHistory.length - 1 || 1)) * chartWidth;
    const y = chartHeight - (h / 5) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${chartHeight} ${points} ${chartWidth},${chartHeight}`;

  return (
    <div>
      <div className="pounding-area" onClick={handlePound}>
        <AnimatePresence>
          {showMallet && (
            <motion.div
              className="mallet"
              initial={{ rotate: -45 }}
              animate={{ rotate: 45 }}
              exit={{ rotate: 0 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
            >
              <div className="mallet-head" />
              <div className="mallet-handle" />
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.div 
          className={`ink-ball ${isPounded ? 'pounded' : ''}`}
          animate={{
            scaleY: isPounded ? 0.7 : 1,
            scaleX: isPounded ? 1.3 : 1
          }}
          transition={{ duration: 0.1 }}
        />
        
        <div className="stone-table" />
      </div>

      <div className="pounding-stats">
        <div className="stat-box">
          <div className="stat-box-value">{poundingCount}</div>
          <div className="stat-box-label">捶打次数</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-value">{hardness}/5</div>
          <div className="stat-box-label">硬度等级</div>
        </div>
      </div>

      <div className="hardness-chart">
        <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="hardnessGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b3a3a" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8b3a3a" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            className="hardness-area"
            points={areaPoints}
            fill="url(#hardnessGradient)"
          />
          <polyline
            className="hardness-line"
            points={points}
          />
        </svg>
      </div>

      <div className="controls-row">
        <button className="btn-bronze btn-large" onClick={handlePound}>
          捶打
        </button>
        <button 
          className="btn-bronze" 
          onClick={addWater}
          disabled={materials.water <= 0}
        >
          💧 加水
        </button>
      </div>

      <p style={{ textAlign: 'center', color: '#6b4e3a', fontSize: '0.9rem', marginTop: '1rem' }}>
        点击捶打台进行捶打，每20次硬度+1，达到3级进入压模
      </p>
    </div>
  );
}

export default PoundingStation;
