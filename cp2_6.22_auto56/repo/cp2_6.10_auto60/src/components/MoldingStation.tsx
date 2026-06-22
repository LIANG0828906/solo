import { useState, useEffect, useRef } from 'react';
import { useGameStore, MOLD_PATTERNS } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import type { MoldPattern } from '../types';

const MOLD_ICONS: Record<MoldPattern, string> = {
  dragon: '🐉',
  phoenix: '🐦',
  pineCrane: '🦢',
  fiveFu: '福',
  longevity: '壽',
  doubleCoin: '🪙'
};

function MoldingStation() {
  const { 
    processData, 
    selectMold, 
    startPressing, 
    stopPressing, 
    completeMolding,
    triggerSweep,
    playSound,
    materials 
  } = useGameStore();
  const { selectedMold, hardness, isPressing } = processData;
  const [inkInMold, setInkInMold] = useState(false);
  const pressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(0);

  const molds = Object.entries(MOLD_PATTERNS) as [MoldPattern, string][];

  useEffect(() => {
    if (selectedMold && !inkInMold) {
      setTimeout(() => {
        setInkInMold(true);
        playSound('success');
      }, 300);
    }
  }, [selectedMold, inkInMold, playSound]);

  useEffect(() => {
    if (isPressing) {
      pressIntervalRef.current = setInterval(() => {
        progressRef.current = Math.min(100, progressRef.current + 2);
        if (progressRef.current >= 100) {
          if (pressIntervalRef.current) clearInterval(pressIntervalRef.current);
          triggerSweep();
          playSound('guzheng');
          setTimeout(() => {
            completeMolding();
            progressRef.current = 0;
            setInkInMold(false);
          }, 500);
        }
      }, 100);
    } else {
      if (pressIntervalRef.current) {
        clearInterval(pressIntervalRef.current);
        pressIntervalRef.current = null;
      }
    }
    return () => {
      if (pressIntervalRef.current) clearInterval(pressIntervalRef.current);
    };
  }, [isPressing, completeMolding, triggerSweep, playSound]);

  const canPress = selectedMold && inkInMold && hardness >= 3 && materials.pineSoot > 0;

  return (
    <div>
      <div className="mold-grid">
        {molds.map(([key, name]) => (
          <motion.div
            key={key}
            className={`mold-item ${selectedMold === key ? 'selected' : ''} ${hardness < 3 ? 'disabled' : ''}`}
            onClick={() => hardness >= 3 && selectMold(key)}
            whileHover={hardness >= 3 ? { scale: 1.05 } : {}}
            whileTap={hardness >= 3 ? { scale: 0.95 } : {}}
          >
            <span>{MOLD_ICONS[key]}</span>
            <span className="mold-name">{name}</span>
          </motion.div>
        ))}
      </div>

      <div className="molding-area">
        <div className="mold-frame">
          {selectedMold && (
            <span style={{ opacity: inkInMold ? 0.3 : 1 }}>
              {MOLD_ICONS[selectedMold]}
            </span>
          )}
          
          <AnimatePresence>
            {inkInMold && selectedMold && (
              <motion.div
                className="ink-in-mold"
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {MOLD_ICONS[selectedMold]}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {selectedMold && (
        <>
          <div className="press-progress">
            <motion.div 
              className="press-progress-bar" 
              style={{ width: `${progressRef.current}%` }}
            />
          </div>

          <div className="controls-row">
            <button
              className="btn-bronze btn-large"
              onMouseDown={() => canPress && startPressing()}
              onMouseUp={stopPressing}
              onMouseLeave={stopPressing}
              onTouchStart={() => canPress && startPressing()}
              onTouchEnd={stopPressing}
              disabled={!canPress}
            >
              {isPressing ? '按压中...' : '按压'}
            </button>
          </div>

          {!canPress && hardness < 3 && (
            <p style={{ textAlign: 'center', color: '#8b3a3a', fontSize: '0.85rem' }}>
              硬度不足，当前{hardness}级，需要3级以上
            </p>
          )}
          {!selectedMold && (
            <p style={{ textAlign: 'center', color: '#6b4e3a', fontSize: '0.85rem' }}>
              请先选择一个墨模
            </p>
          )}
        </>
      )}

      {!selectedMold && (
        <p style={{ textAlign: 'center', color: '#6b4e3a', fontSize: '0.9rem', marginTop: '1rem' }}>
          从上方选择墨模图案，然后长按按压按钮5秒定型
        </p>
      )}
    </div>
  );
}

export default MoldingStation;
