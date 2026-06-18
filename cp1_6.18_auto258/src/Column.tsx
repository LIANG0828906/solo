import React, { useCallback, useRef, useEffect } from 'react';
import { ColumnState } from './types';

interface ColumnProps {
  column: ColumnState;
  columnWidth: number;
  onClick: (id: string) => void;
  onLongPress: (id: string) => void;
  onUnlock: (id: string) => void;
}

export const Column: React.FC<ColumnProps> = React.memo(({
  column,
  columnWidth,
  onClick,
  onLongPress,
  onUnlock,
}) => {
  const longPressTimer = useRef<number | null>(null);
  const isLongPressTriggered = useRef(false);
  const breatheAnimationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const calculateHeight = useCallback(() => {
    let height = column.baseHeight;

    if (column.isPulsing) {
      height *= 1.4;
    }

    if (column.rippleIntensity > 0) {
      height *= (1 + column.rippleIntensity);
    }

    if (column.isLocked) {
      const breatheMultiplier = 1 + Math.sin(column.breathePhase) * 0.15;
      height *= breatheMultiplier;
    }

    return height;
  }, [column.baseHeight, column.isPulsing, column.rippleIntensity, column.isLocked, column.breathePhase]);

  const calculateOpacity = useCallback(() => {
    if (column.isLocked) {
      return 0.6 + Math.sin(column.breathePhase) * 0.4;
    }
    return column.opacity;
  }, [column.isLocked, column.breathePhase, column.opacity]);

  useEffect(() => {
    if (column.isLocked) {
      startTimeRef.current = performance.now();
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTimeRef.current;
        const phase = (elapsed / 2000) * Math.PI * 2;
        
        const store = (window as any).__store;
        if (store) {
          store.getState().updateBreathePhase(column.id, phase);
          
          const breatheOpacity = 0.6 + Math.sin(phase) * 0.4;
          const breatheVolume = 0.1 + Math.sin(phase) * 0.1;
          
          const audioEngine = (window as any).__audioEngine;
          if (audioEngine) {
            audioEngine.updateContinuousVolume(breatheVolume);
          }
        }
        
        breatheAnimationRef.current = requestAnimationFrame(animate);
      };
      
      breatheAnimationRef.current = requestAnimationFrame(animate);
    } else {
      if (breatheAnimationRef.current) {
        cancelAnimationFrame(breatheAnimationRef.current);
        breatheAnimationRef.current = null;
      }
    }

    return () => {
      if (breatheAnimationRef.current) {
        cancelAnimationFrame(breatheAnimationRef.current);
      }
    };
  }, [column.isLocked, column.id]);

  const handleMouseDown = useCallback(() => {
    isLongPressTriggered.current = false;
    longPressTimer.current = window.setTimeout(() => {
      isLongPressTriggered.current = true;
      if (column.isLocked) {
        onUnlock(column.id);
      } else {
        onLongPress(column.id);
      }
    }, 1000);
  }, [column.id, column.isLocked, onLongPress, onUnlock]);

  const handleMouseUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (!isLongPressTriggered.current) {
      onClick(column.id);
    }
  }, [column.id, onClick]);

  const handleMouseLeave = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseDown();
  }, [handleMouseDown]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseUp();
  }, [handleMouseUp]);

  const displayHeight = calculateHeight();
  const displayOpacity = calculateOpacity();

  const colorRatio = column.col / 6;
  const r = Math.round(0 + colorRatio * 255);
  const g = Math.round(188 - colorRatio * 188);
  const b = Math.round(212 - colorRatio * 131);
  const currentColor = `rgb(${r}, ${g}, ${b})`;

  return (
    <div
      style={{
        width: `${columnWidth}px`,
        height: '220px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
        willChange: 'transform',
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        style={{
          width: '100%',
          height: `${displayHeight}px`,
          background: `linear-gradient(to top, #00BCD4, #FF4081)`,
          borderRadius: '4px 4px 0 0',
          opacity: displayOpacity,
          transition: column.isPulsing 
            ? 'height 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)' 
            : 'height 0.3s ease-out, opacity 0.3s ease-out, transform 0.2s ease-out, filter 0.2s ease-out',
          boxShadow: `0 0 8px ${currentColor}`,
          transform: column.isLocked ? 'scale(1.05)' : 'scale(1)',
          filter: column.isLocked ? 'brightness(1.3)' : 'brightness(1)',
          position: 'relative',
        }}
        className="column-bar"
      />
    </div>
  );
});

Column.displayName = 'Column';
