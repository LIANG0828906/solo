import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useMediaQuery } from 'framer-motion';
import { useRootStore } from '../store/rootStore';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  fillClass: string;
  onChange: (value: number) => void;
}

const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  fillClass,
  onChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const percentage = ((value - min) / (max - min)) * 100;

  const updateValue = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      let pct = (clientX - rect.left) / rect.width;
      pct = Math.max(0, Math.min(1, pct));
      const newValue = min + pct * (max - min);
      const stepped = Math.round(newValue / step) * step;
      const clamped = Math.max(min, Math.min(max, stepped));
      onChange(clamped);
    },
    [min, max, step, onChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      updateValue(e.clientX);
    },
    [updateValue]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true);
      updateValue(e.touches[0].clientX);
    },
    [updateValue]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateValue(e.clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        updateValue(e.touches[0].clientX);
      }
    };

    const handleEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        setIsBouncing(true);
        setTimeout(() => setIsBouncing(false), 300);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, updateValue]);

  const displayValue = step < 1 ? value.toFixed(1) : value.toFixed(0);

  return (
    <div className="slider-group">
      <div className="slider-label">
        <span>{label}</span>
        <span className="slider-value">
          {displayValue}
          {unit}
        </span>
      </div>
      <div
        ref={sliderRef}
        className="slider-container"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          className={`slider-fill ${fillClass}`}
          style={{ width: `${percentage}%` }}
        />
        <motion.div
          className={`slider-thumb ${isBouncing ? 'bouncing' : ''}`}
          style={{ left: `${percentage}%` }}
          animate={{
            scale: isDragging ? 1.2 : 1,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 25,
          }}
        />
      </div>
    </div>
  );
};

export const ControlPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const {
    humidity,
    nutrition,
    branchProbability,
    growthSpeed,
    setHumidity,
    setNutrition,
    setBranchProbability,
    setGrowthSpeed,
  } = useRootStore();

  const panelVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    collapsed: { y: '-100%', opacity: 1 },
    expanded: { y: 0, opacity: 1 },
  };

  const initialState = isMobile ? 'collapsed' : 'hidden';
  const animateState = isMobile ? (isExpanded ? 'expanded' : 'collapsed') : 'visible';

  return (
    <motion.div
      className={`control-panel ${isExpanded ? 'expanded' : ''}`}
      initial={initialState}
      animate={animateState}
      variants={panelVariants}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {isMobile && (
        <div
          className="mobile-panel-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        />
      )}
      <div className="control-panel-title">生长参数</div>
      <Slider
        label="湿度"
        value={humidity}
        min={0}
        max={100}
        step={1}
        unit="%"
        fillClass="humidity"
        onChange={setHumidity}
      />
      <Slider
        label="营养浓度"
        value={nutrition}
        min={0.5}
        max={2.0}
        step={0.1}
        fillClass="nutrition"
        onChange={setNutrition}
      />
      <Slider
        label="分支概率"
        value={branchProbability}
        min={0}
        max={1.0}
        step={0.05}
        fillClass="branch"
        onChange={setBranchProbability}
      />
      <Slider
        label="生长速度"
        value={growthSpeed}
        min={0.5}
        max={2.0}
        step={0.1}
        unit="x"
        fillClass="speed"
        onChange={setGrowthSpeed}
      />
    </motion.div>
  );
};
