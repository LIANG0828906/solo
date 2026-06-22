import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

export function VolumeSlider({ value, onChange, label = 'VOLUME' }: VolumeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const height = 120;

  const handlePosition = (1 - value) * height;

  const calculateValue = useCallback((clientY: number): number => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const position = (clientY - rect.top) / rect.height;
    return Math.max(0, Math.min(1, 1 - position));
  }, []);

  const handleStart = useCallback((clientY: number) => {
    setIsDragging(true);
    onChange(calculateValue(clientY));
  }, [calculateValue, onChange]);

  const handleMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    onChange(calculateValue(clientY));
  }, [isDragging, calculateValue, onChange]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientY);
    const handleMouseUp = () => handleEnd();
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientY);
      }
    };
    const handleTouchEnd = () => handleEnd();

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  return (
    <div className="flex flex-col items-center gap-2">
      <FaVolumeUp size={16} color="#C0C0C0" />
      <div className="text-xs text-gray-400 font-mono">{label}</div>
      <motion.div
        ref={trackRef}
        className="relative cursor-pointer"
        style={{
          width: 16,
          height,
          backgroundColor: '#333333',
          borderRadius: 8,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)',
        }}
        onMouseDown={(e) => handleStart(e.clientY)}
        onTouchStart={(e) => {
          if (e.touches.length > 0) {
            handleStart(e.touches[0].clientY);
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{
          boxShadow: isHovered || isDragging
            ? 'inset 0 2px 4px rgba(0,0,0,0.8), 0 0 15px rgba(192,192,192,0.3)'
            : 'inset 0 2px 4px rgba(0,0,0,0.8)',
        }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="absolute inset-x-0 bottom-0 rounded-b"
          style={{
            height: handlePosition,
            background: 'linear-gradient(to top, #4a4a4a, #2a2a2a',
          }}
        />

        <motion.div
          className="absolute left-1/2 transform -translate-x-1/2"
          style={{
            top: handlePosition - 10,
            width: 24,
            height: 20,
            background: 'linear-gradient(145deg, #E8E8E8, #A0A0A0, #C0C0C0)',
            borderRadius: 4,
            boxShadow: '0 2px 6px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.3)',
            cursor: 'grab',
          }}
          animate={{
            scale: isHovered || isDragging ? 1.1 : 1,
            boxShadow: isHovered || isDragging
              ? '0 4px 12px rgba(192,192,192,0.4), inset 0 1px 2px rgba(255,255,255,0.3)'
              : '0 2px 6px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.3)',
          }}
          transition={{ duration: 0.2 }}
          whileTap={{ scale: 0.95 }}
        >
          <div
            className="absolute inset-x-2 top-1/2 transform -translate-y-1/2 h-px"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          />
        </motion.div>
      </motion.div>

      {value === 0 ? (
        <FaVolumeMute size={14} color="#666" />
      ) : (
        <div className="text-xs text-gray-500 font-mono">
          {Math.round(value * 100)}
        </div>
      )}
    </div>
  );
}
