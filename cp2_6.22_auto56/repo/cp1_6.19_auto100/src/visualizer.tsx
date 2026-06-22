import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SortStep } from './algorithms';

interface VisualizerProps {
  step: SortStep;
  totalSteps?: number;
  currentStep?: number;
  algorithmName?: string;
  showStats?: boolean;
  height?: number;
}

const COLOR_START = { r: 52, g: 152, b: 219 };
const COLOR_END = { r: 231, g: 76, b: 60 };
const COLOR_COMPARE = '#F39C12';
const COLOR_SWAP = '#2ECC71';
const COLOR_SORTED = '#95A5A6';

function interpolateColor(value: number, min: number, max: number): string {
  const t = max === min ? 0 : (value - min) / (max - min);
  const r = Math.round(COLOR_START.r + (COLOR_END.r - COLOR_START.r) * t);
  const g = Math.round(COLOR_START.g + (COLOR_END.g - COLOR_START.g) * t);
  const b = Math.round(COLOR_START.b + (COLOR_END.b - COLOR_START.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => (
  <AnimatePresence mode="wait">
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ display: 'inline-block', minWidth: '3ch', textAlign: 'right' }}
    >
      {value}
    </motion.span>
  </AnimatePresence>
);

const Visualizer: React.FC<VisualizerProps> = ({
  step,
  totalSteps = 0,
  currentStep = 0,
  algorithmName,
  showStats = true,
  height = 500,
}) => {
  const { array, comparing, swapping, sorted, comparisons, swaps } = step;

  const { minVal, maxVal } = useMemo(() => {
    if (array.length === 0) return { minVal: 0, maxVal: 100 };
    const min = Math.min(...array);
    const max = Math.max(...array);
    return { minVal: min, maxVal: max };
  }, [array]);

  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  const barGap = 2;
  const chartHeight = height - (showStats ? 100 : 20);

  const getBarColor = (index: number, value: number): string => {
    if (sorted.includes(index)) return COLOR_SORTED;
    if (swapping.includes(index)) return COLOR_SWAP;
    if (comparing.includes(index)) return COLOR_COMPARE;
    return interpolateColor(value, minVal, maxVal);
  };

  const getBarScale = (index: number): number => {
    if (comparing.includes(index)) return 1.1;
    return 1;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#2A2A3E',
        borderRadius: '12px',
        padding: '20px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {algorithmName && (
        <div
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#E0E0E0',
            marginBottom: '12px',
            textAlign: 'center',
          }}
        >
          {algorithmName}
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          height: chartHeight,
          paddingBottom: '20px',
          minHeight: 0,
        }}
      >
        {array.map((value, index) => {
          const barHeight =
            maxVal === minVal
              ? chartHeight * 0.5
              : ((value - minVal) / (maxVal - minVal)) * (chartHeight * 0.85) +
                chartHeight * 0.1;
          const barWidth = `calc((100% - ${barGap * (array.length - 1)}px) / ${array.length})`;
          const scale = getBarScale(index);
          const color = getBarColor(index, value);

          return (
            <motion.div
              key={index}
              style={{
                width: barWidth,
                height: barHeight,
                marginRight: index < array.length - 1 ? `${barGap}px` : '0',
                backgroundColor: color,
                borderRadius: '4px 4px 0 0',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                position: 'relative',
                transformOrigin: 'bottom center',
                boxShadow: swapping.includes(index)
                  ? `0 0 12px ${COLOR_SWAP}`
                  : comparing.includes(index)
                  ? `0 0 8px ${COLOR_COMPARE}`
                  : 'none',
              }}
              animate={{
                height: barHeight,
                scale,
                backgroundColor: color,
              }}
              transition={{
                type: 'spring',
                stiffness: 120,
                damping: 14,
                duration: 0.2,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  bottom: '-20px',
                  fontSize: '10px',
                  color: '#888',
                  whiteSpace: 'nowrap',
                }}
              >
                {value}
              </span>
            </motion.div>
          );
        })}
      </div>

      {showStats && (
        <div
          style={{
            marginTop: '30px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              color: '#E0E0E0',
              fontSize: '14px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>
                比较次数
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>
                <AnimatedNumber value={comparisons} />
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>
                交换次数
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>
                <AnimatedNumber value={swaps} />
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>
                当前步数
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>
                第<AnimatedNumber value={currentStep} />步 / 共{totalSteps}步
              </div>
            </div>
          </div>

          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#1E1E2E',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                background: `linear-gradient(to right, #E74C3C, #F39C12, #2ECC71)`,
                borderRadius: '4px',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Visualizer;
