import React from 'react';
import { motion } from 'framer-motion';

interface NutrientBarProps {
  n: number;
  p: number;
  k: number;
  showLabels?: boolean;
  size?: 'small' | 'normal';
}

const N_COLOR = '#4CAF50';
const P_COLOR = '#FF9800';
const K_COLOR = '#03A9F4';

export const NutrientBar: React.FC<NutrientBarProps> = ({
  n,
  p,
  k,
  showLabels = false,
  size = 'normal',
}) => {
  const height = size === 'small' ? 6 : 10;
  const labelSize = size === 'small' ? '10px' : '12px';

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          height: `${height}px`,
          borderRadius: `${height / 2}px`,
          overflow: 'hidden',
          backgroundColor: '#E0E0E0',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${n}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ backgroundColor: N_COLOR }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${p}%` }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          style={{ backgroundColor: P_COLOR }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${k}%` }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
          style={{ backgroundColor: K_COLOR }}
        />
      </div>
      {showLabels && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '4px',
            fontSize: labelSize,
            color: '#666',
          }}
        >
          <span style={{ color: N_COLOR }}>N {n}%</span>
          <span style={{ color: P_COLOR }}>P {p}%</span>
          <span style={{ color: K_COLOR }}>K {k}%</span>
        </div>
      )}
    </div>
  );
};
