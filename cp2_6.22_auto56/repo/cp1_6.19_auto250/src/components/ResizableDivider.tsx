import React, { useCallback, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePreviewWidth, useCardActions } from '../store/useCardStore';

const MIN_WIDTH = 280;
const MAX_WIDTH = 800;

const ResizableDivider: React.FC = React.memo(() => {
  const previewWidth = usePreviewWidth();
  const { setPreviewWidth } = useCardActions();
  
  const dividerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragStartRef = useRef<{ x: number; width: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      width: previewWidth,
    };
  }, [previewWidth]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      
      const deltaX = e.clientX - dragStartRef.current.x;
      const newWidth = dragStartRef.current.width - deltaX;
      const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
      
      setPreviewWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setPreviewWidth]);

  return (
    <motion.div
      ref={dividerRef}
      className={`resizable-divider ${isDragging ? 'dragging' : ''}`}
      style={{
        cursor: isDragging ? 'col-resize' : isHovered ? 'col-resize' : 'col-resize',
      }}
      animate={{
        backgroundColor: isDragging || isHovered ? '#9E9E9E' : '#BDBDBD',
      }}
      transition={{ duration: 0.15 }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="divider-grip">
        <span className="grip-line" />
        <span className="grip-line" />
      </div>
    </motion.div>
  );
});

ResizableDivider.displayName = 'ResizableDivider';

export default ResizableDivider;
