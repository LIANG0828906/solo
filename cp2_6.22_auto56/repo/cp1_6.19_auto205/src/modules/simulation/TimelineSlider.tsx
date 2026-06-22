import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, useSpring, useTransform, useMotionValue, useAnimationFrame } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { BASE_YEAR, END_YEAR } from '@/types';

const TimelineSlider = () => {
  const { currentYear, setCurrentYear } = useAppStore();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const sliderWidth = 600;
  const thumbRadius = 10;
  
  const progress = (currentYear - BASE_YEAR) / (END_YEAR - BASE_YEAR);
  const thumbX = useMotionValue(progress * (sliderWidth - thumbRadius * 2));
  
  const springX = useSpring(thumbX, {
    stiffness: 300,
    damping: 30,
    mass: 0.5,
  });
  
  const displayYear = useTransform(springX, (x) => {
    const p = x / (sliderWidth - thumbRadius * 2);
    const year = Math.round(BASE_YEAR + p * (END_YEAR - BASE_YEAR));
    return Math.max(BASE_YEAR, Math.min(END_YEAR, year));
  });

  const updateYearFromPosition = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left - thumbRadius;
    const clampedX = Math.max(0, Math.min(x, sliderWidth - thumbRadius * 2));
    const newProgress = clampedX / (sliderWidth - thumbRadius * 2);
    const newYear = Math.round(BASE_YEAR + newProgress * (END_YEAR - BASE_YEAR));
    
    thumbX.set(clampedX);
    setCurrentYear(newYear);
  }, [setCurrentYear, thumbX]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    updateYearFromPosition(e.clientX);
  }, [updateYearFromPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      updateYearFromPosition(e.clientX);
    }
  }, [isDragging, updateYearFromPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const targetX = progress * (sliderWidth - thumbRadius * 2);
    thumbX.set(targetX);
  }, [currentYear, progress, thumbX]);

  useAnimationFrame(() => {
    if (!isDragging) {
      const currentX = springX.get();
      const targetX = progress * (sliderWidth - thumbRadius * 2);
      if (Math.abs(currentX - targetX) > 0.1) {
        thumbX.set(targetX);
      }
    }
  });

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px 0',
    }}>
      <motion.div
        style={{
          fontFamily: 'monospace',
          fontSize: '24px',
          fontWeight: 700,
          color: 'white',
          marginBottom: '8px',
          x: springX,
          translateX: '-50%',
          left: thumbRadius,
          position: 'relative',
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}
      >
        {displayYear}
      </motion.div>

      <div
        ref={sliderRef}
        style={{
          width: sliderWidth,
          height: 30,
          borderRadius: 15,
          background: 'linear-gradient(90deg, #D3D3D3, #A9A9A9)',
          position: 'relative',
          cursor: 'pointer',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
        }}
        onMouseDown={handleMouseDown}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            borderRadius: 15,
            background: 'linear-gradient(90deg, #2E86C1, #3498DB)',
            width: `calc(${progress * 100}% + ${thumbRadius}px)`,
            transition: 'width 0.1s ease-out',
          }}
        />

        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: thumbRadius,
            width: thumbRadius * 2,
            height: thumbRadius * 2,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3498DB, #2E86C1)',
            boxShadow: '0 2px 10px rgba(46, 134, 193, 0.5), inset 0 1px 2px rgba(255,255,255,0.3)',
            cursor: isDragging ? 'grabbing' : 'grab',
            x: springX,
            translateX: '-50%',
            translateY: '-50%',
            zIndex: 2,
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        />

        <div style={{
          position: 'absolute',
          bottom: '-20px',
          left: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 4px',
          fontSize: '11px',
          color: '#A8D0E6',
          fontFamily: 'monospace',
        }}>
          <span>{BASE_YEAR}</span>
          <span>2050</span>
          <span>{END_YEAR}</span>
        </div>
      </div>
    </div>
  );
};

export default TimelineSlider;
