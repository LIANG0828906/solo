import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { motion } from 'framer-motion';

interface SmokePotProps {
  onDropGlue: () => void;
}

function SmokePot({ onDropGlue }: SmokePotProps) {
  const { processData, setTemperature, addGlue, updateMixtureProgress, advanceStage, triggerSweep, playSound } = useGameStore();
  const { temperature, glueAdded, mixtureProgress } = processData;
  const [dragOver, setDragOver] = useState(false);

  const smokeParticles = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: 20 + Math.random() * 60,
      delay: Math.random() * 3,
      size: 4 + Math.random() * 6
    }));
  }, []);

  useEffect(() => {
    if (glueAdded && temperature >= 85) {
      const interval = setInterval(() => {
        updateMixtureProgress(Math.min(100, mixtureProgress + 1));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [glueAdded, temperature, mixtureProgress, updateMixtureProgress]);

  useEffect(() => {
    if (mixtureProgress >= 100) {
      triggerSweep();
      playSound('guzheng');
      setTimeout(() => advanceStage('pounding'), 500);
    }
  }, [mixtureProgress, advanceStage, triggerSweep, playSound]);

  const contentsColor = useMemo(() => {
    if (!glueAdded) return '#3a3a3a';
    const progress = mixtureProgress / 100;
    const r = Math.floor(58 - progress * 26);
    const g = Math.floor(58 - progress * 26);
    const b = Math.floor(58 - progress * 26);
    return `rgb(${r}, ${g}, ${b})`;
  }, [glueAdded, mixtureProgress]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!glueAdded) setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!glueAdded && e.dataTransfer.getData('material') === 'glue') {
      addGlue();
      playSound('success');
      onDropGlue();
    }
  };

  return (
    <div>
      <div 
        className="pot-container"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="pot-rim" />
        <div className="pot-body" />
        <motion.div 
          className="pot-contents"
          style={{ backgroundColor: contentsColor }}
          animate={{
            scale: dragOver ? 1.05 : 1,
            boxShadow: dragOver ? '0 0 30px #d4af37' : 'none'
          }}
          transition={{ duration: 0.2 }}
        >
          {smokeParticles.map(p => (
            <div
              key={p.id}
              className="smoke-particle"
              style={{
                left: `${p.left}%`,
                width: p.size,
                height: p.size,
                animationDelay: `${p.delay}s`,
                opacity: glueAdded ? 0.3 : 0.6
              }}
            />
          ))}
        </motion.div>
        
        <div className="fire-container">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="flame"
              style={{
                height: temperature > 100 ? 40 : temperature > 85 ? 30 : 20,
                opacity: temperature > 85 ? 1 : 0.7
              }}
            />
          ))}
        </div>
      </div>

      <div className="temp-slider">
        <input
          type="range"
          min="60"
          max="120"
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
        />
        <div className="temp-display">
          {temperature}°C
          {temperature >= 85 && glueAdded && (
            <span style={{ color: '#4a7c59', marginLeft: '0.5rem' }}>
              融化中... {mixtureProgress}%
            </span>
          )}
          {temperature < 85 && glueAdded && (
            <span style={{ color: '#8b3a3a', marginLeft: '0.5rem' }}>
              温度不足
            </span>
          )}
        </div>
      </div>

      {!glueAdded && (
        <p style={{ textAlign: 'center', color: '#6b4e3a', fontSize: '0.9rem' }}>
          ← 从左侧拖拽皮胶放入锅中
        </p>
      )}
    </div>
  );
}

export default SmokePot;
