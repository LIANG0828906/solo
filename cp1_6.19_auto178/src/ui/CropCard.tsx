import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Crop } from '../types';
import { FAMILY_NAMES } from '../mockData';

interface CropCardProps {
  crop: Crop;
  monthRange?: string;
  isDraggable?: boolean;
  isRecommended?: boolean;
  isIncompatible?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
}

export const CropCard: React.FC<CropCardProps> = ({
  crop,
  monthRange,
  isDraggable = false,
  isRecommended = false,
  isIncompatible = false,
  onClick,
  onDragStart,
  onDragEnd,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.dataTransfer.setData('cropId', crop.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(e);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: isIncompatible ? 0.4 : 1,
        scale: isDragging ? 0.8 : 1,
        y: isRecommended ? -3 : 0,
      }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: isDraggable && !isIncompatible ? -3 : 0, boxShadow: '0 6px 16px rgba(0,0,0,0.15)' }}
      style={{
        width: '200px',
        height: '120px',
        borderRadius: '10px',
        backgroundColor: '#E8F5E9',
        color: '#2E7D32',
        padding: '12px',
        boxSizing: 'border-box',
        cursor: isDraggable && !isIncompatible ? 'grab' : 'default',
        position: 'relative',
        boxShadow: isRecommended
          ? '0 4px 12px rgba(0,0,0,0.15)'
          : '0 2px 8px rgba(0,0,0,0.1)',
        border: isRecommended ? '2px solid #FFB300' : 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        opacity: isDragging ? 0.8 : undefined,
        userSelect: 'none',
      }}
    >
      <div
        draggable={isDraggable && !isIncompatible}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={onClick}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: crop.color,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontWeight: 600,
              fontFamily: "'Caveat', cursive",
              fontSize: '22px',
            }}
          >
            {crop.name}
          </span>
        </div>

        <div style={{ fontSize: '11px', color: '#5D8A61' }}>
          <div>科属：{FAMILY_NAMES[crop.family] || crop.family}</div>
          <div>生长周期：{crop.growthMonths}个月</div>
        </div>

        {monthRange && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              fontSize: '10px',
              backgroundColor: '#2E7D32',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            {monthRange}
          </div>
        )}

        {isRecommended && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              backgroundColor: '#FFB300',
              color: 'white',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 600,
            }}
          >
            推荐
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
