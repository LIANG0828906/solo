import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock } from 'lucide-react';
import { useDesignStore, ColorItem } from '../store/useDesignStore';

interface ColorPaletteProps {
  type: 'primary' | 'accent';
  colors: ColorItem[];
  title: string;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({ type, colors, title }) => {
  const toggleLockColor = useDesignStore(state => state.toggleLockColor);
  const reorderColors = useDesignStore(state => state.reorderColors);
  const isExtracting = useDesignStore(state => state.isExtracting);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null);
  const dragImageRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';

    if (dragImageRef.current) {
      e.dataTransfer.setDragImage(dragImageRef.current, 10, 10);
    }

    setTimeout(() => {
      setGhostPosition({ x: e.clientX, y: e.clientY });
    }, 0);
  };

  const handleDrag = (e: React.DragEvent) => {
    if (e.clientX && e.clientY) {
      setGhostPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      reorderColors(type, draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    setGhostPosition(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (index !== draggedIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleLockClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleLockColor(id, type);
  };

  const formatCMYK = (cmyk: [number, number, number, number]) => {
    return `C${cmyk[0].toFixed(1)} M${cmyk[1].toFixed(1)} Y${cmyk[2].toFixed(1)} K${cmyk[3].toFixed(1)}`;
  };

  const gridClass = type === 'primary' ? 'primary-colors' : 'accent-colors';

  return (
    <div className="palette-section">
      <h3 className="section-title">{title}</h3>
      {isExtracting && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
      <div className={`colors-grid ${gridClass}`}>
        {colors.map((color, index) => (
          <motion.div
            key={color.id}
            className={`color-swatch-wrapper ${draggedIndex === index ? 'dragging' : ''}`}
            draggable={!isExtracting}
            onDragStart={(e) => handleDragStart(e, index)}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: dragOverIndex === index ? 0.9 : 1,
              border: dragOverIndex === index ? '2px dashed var(--color-primary)' : 'none',
              borderRadius: dragOverIndex === index ? '4px' : '0'
            }}
            transition={{ duration: 0.2 }}
            whileHover={{ y: -2 }}
          >
            <div
              className={`color-swatch ${draggedIndex === index ? 'dragging' : ''}`}
              style={{ backgroundColor: color.hex }}
            >
              <div
                className="lock-icon"
                onClick={(e) => handleLockClick(e, color.id)}
              >
                {color.locked ? (
                  <Lock size={8} strokeWidth={2.5} />
                ) : (
                  <Unlock size={8} strokeWidth={2.5} />
                )}
              </div>
            </div>
            <div className="color-info">
              <div className="color-hex">{color.hex}</div>
              <div>{formatCMYK(color.cmyk)}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {ghostPosition && draggedIndex !== null && colors[draggedIndex] && (
          <motion.div
            className="drag-ghost"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 0.7,
              scale: 1,
              x: ghostPosition.x - 10,
              y: ghostPosition.y - 10
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: colors[draggedIndex].hex,
                borderRadius: '4px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={dragImageRef} style={{ display: 'none' }} />
    </div>
  );
};
