import { memo } from 'react';
import { motion } from 'framer-motion';
import { CrystalType, CRYSTAL_CONFIGS } from '../utils/gameLogic';

interface CrystalProps {
  type: CrystalType;
  size?: number;
  isDragging?: boolean;
  isFloating?: boolean;
  floatDelay?: number;
}

const Crystal = memo(function Crystal({
  type,
  size = 50,
  isDragging = false,
  isFloating = false,
  floatDelay = 0,
}: CrystalProps) {
  const config = CRYSTAL_CONFIGS[type];

  const floatAnimation = isFloating
    ? {
        y: [-3, 3, -3],
        transition: {
          duration: 2,
          delay: floatDelay,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      }
    : {};

  return (
    <motion.div
      className="relative cursor-grab active:cursor-grabbing"
      style={{
        width: size,
        height: size,
      }}
      animate={floatAnimation}
      whileHover={{
        scale: 1.1,
        filter: `drop-shadow(0 0 8px ${config.glowColor})`,
      }}
      whileTap={{ scale: 0.95 }}
      drag={false}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        style={{
          filter: isDragging ? `drop-shadow(0 0 12px ${config.glowColor})` : 'none',
        }}
      >
        <defs>
          <linearGradient id={`grad-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={config.glowColor} stopOpacity="1" />
            <stop offset="50%" stopColor={config.color} stopOpacity="1" />
            <stop offset="100%" stopColor={config.color} stopOpacity="0.8" />
          </linearGradient>
          <filter id={`glow-${type}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <polygon
          points="50,5 85,30 85,70 50,95 15,70 15,30"
          fill={`url(#grad-${type})`}
          stroke={config.glowColor}
          strokeWidth="2"
          filter={`url(#glow-${type})`}
        />
        <polygon
          points="50,15 75,35 50,55 25,35"
          fill="white"
          fillOpacity="0.3"
        />
        <line
          x1="50"
          y1="5"
          x2="50"
          y2="95"
          stroke="white"
          strokeWidth="1"
          strokeOpacity="0.2"
        />
      </svg>
    </motion.div>
  );
});

export default Crystal;
