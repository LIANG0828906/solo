import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ColorInfo } from '@/types';

interface ColorSwatchProps {
  color: ColorInfo;
  index: number;
}

export const ColorSwatch = ({ color, index }: ColorSwatchProps) => {
  const [showHex, setShowHex] = useState(false);

  return (
    <motion.div
      className="color-swatch-wrapper"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
    >
      <motion.div
        className="color-swatch"
        style={{ backgroundColor: color.hex }}
        whileHover={{ scale: 1.2 }}
        transition={{ duration: 0.15 }}
        onMouseEnter={() => setShowHex(true)}
        onMouseLeave={() => setShowHex(false)}
        title={color.hex.toUpperCase()}
      >
        {color.isReadable && (
          <span className="readable-badge">✓</span>
        )}
      </motion.div>
      {showHex && (
        <motion.div
          className="hex-tooltip"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {color.hex.toUpperCase()}
        </motion.div>
      )}
    </motion.div>
  );
};
