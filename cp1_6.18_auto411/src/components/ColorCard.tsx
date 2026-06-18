import React, { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ColorEmotion } from '@/data/colors';

interface ColorCardProps {
  colorData: ColorEmotion;
  isSelected: boolean;
  disabled: boolean;
  selectedOrder?: number;
  onSelect: (colorData: ColorEmotion) => void;
  onDeselect: (colorId: string) => void;
}

const ColorCard: React.FC<ColorCardProps> = memo(function ColorCard({
  colorData,
  isSelected,
  disabled,
  selectedOrder,
  onSelect,
  onDeselect,
}) {
  const [isTapping, setIsTapping] = useState(false);

  const handleClick = useCallback(() => {
    if (disabled && !isSelected) return;
    setIsTapping(true);
    setTimeout(() => setIsTapping(false), 200);
    if (isSelected) {
      onDeselect(colorData.id);
    } else {
      onSelect(colorData);
    }
  }, [colorData, isSelected, disabled, onSelect, onDeselect]);

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled && !isSelected}
      aria-label={`颜色卡片 ${colorData.name}`}
      whileHover={disabled && !isSelected ? {} : { scale: 1.15, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
      whileTap={{}}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        scale: isTapping ? [1.05, 1] : 1,
        transition: { duration: 0.2 },
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      style={{
        width: 120,
        height: 120,
        borderRadius: '50%',
        backgroundColor: colorData.color,
        border: isSelected ? '4px solid #ffffff' : '2px solid transparent',
        opacity: disabled && !isSelected ? 0.4 : 1,
        cursor: disabled && !isSelected ? 'not-allowed' : 'pointer',
        position: 'relative',
        padding: 0,
        transition: 'all 0.2s ease',
        outline: 'none',
        boxShadow: isSelected ? '0 0 0 2px rgba(255,255,255,0.3)' : 'none',
      }}
    >
      <AnimatePresence>
        {isSelected && selectedOrder !== undefined && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2, type: 'spring' }}
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              color: '#1A1A2E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 14,
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            }}
          >
            {selectedOrder}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
});

export default ColorCard;
