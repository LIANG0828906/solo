import React from 'react';
import { motion } from 'framer-motion';
import type { EventType } from '../store/gameStore';

interface EventNodeProps {
  id: string;
  x: number;
  y: number;
  title: string;
  type: EventType;
  deliveredYear: number;
  onPointerDown: (id: string, e: React.PointerEvent) => void;
}

const typeColors: Record<EventType, string> = {
  major: '#FFB347',
  minor: '#6C5CE7',
  turning: '#FD79A8',
};

const typeLabels: Record<EventType, string> = {
  major: '重大',
  minor: '次要',
  turning: '转折',
};

const EventNode: React.FC<EventNodeProps> = ({
  id,
  x,
  y,
  title,
  type,
  deliveredYear,
  onPointerDown,
}) => {
  const color = typeColors[type];
  return (
    <motion.g
      transform={`translate(${x}, ${y})`}
      style={{ cursor: 'grab' }}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22, duration: 0.8 }}
      onPointerDown={(e) => onPointerDown(id, e)}
    >
      <defs>
        <radialGradient id={`grad-${id}`} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="55%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.85" />
        </radialGradient>
        <filter id={`blur-${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <circle r={30} fill={color} opacity={0.25} filter={`url(#blur-${id})`} />
      <circle
        r={25}
        fill={`url(#grad-${id})`}
        stroke={color}
        strokeWidth={2}
        style={{
          filter: `drop-shadow(0 0 10px ${color}99)`,
        }}
      />
      <text
        y={-34}
        textAnchor="middle"
        fontSize={11}
        fill="#F5F6FA"
        style={{
          paintOrder: 'stroke',
          stroke: 'rgba(0,0,0,0.55)',
          strokeWidth: 3,
          fontWeight: 600,
        }}
      >
        {title.length > 10 ? title.slice(0, 9) + '…' : title}
      </text>
      <text
        y={-20}
        textAnchor="middle"
        fontSize={10}
        fill={color}
        opacity={0.95}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        ⏱ {deliveredYear}
      </text>
      <text
        y={4}
        textAnchor="middle"
        fontSize={9}
        fill="rgba(255,255,255,0.9)"
        style={{ fontWeight: 600, letterSpacing: 1 }}
      >
        {typeLabels[type]}
      </text>
    </motion.g>
  );
};

export default EventNode;
