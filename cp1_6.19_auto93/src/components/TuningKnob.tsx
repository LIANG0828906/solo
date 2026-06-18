import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TuningKnobProps {
  angle: number;
  onChange: (angle: number) => void;
  size?: number;
}

export function TuningKnob({ angle, onChange, size = 80 }: TuningKnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastAngle, setLastAngle] = useState(angle);

  const calculateAngle = useCallback((clientX: number, clientY: number): number => {
    if (!knobRef.current) return 0;
    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    let newAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
    if (newAngle < 0) newAngle += 360;
    return newAngle;
  }, []);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    const newAngle = calculateAngle(clientX, clientY);
    setLastAngle(newAngle);
    onChange(newAngle);
  }, [calculateAngle, onChange]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;
    const newAngle = calculateAngle(clientX, clientY);

    let angleDiff = newAngle - lastAngle;
    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;

    let updatedAngle = angle + angleDiff;
    updatedAngle = ((updatedAngle % 360) + 360) % 360;

    setLastAngle(newAngle);
    onChange(updatedAngle);
  }, [isDragging, calculateAngle, lastAngle, angle, onChange]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleMouseUp = () => handleEnd();
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
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

  const gripLines = Array.from({ length: 40 }, (_, i) => i * 9);

  return (
    <motion.div
      ref={knobRef}
      className="relative cursor-pointer select-none"
      style={{ width: size, height: size }}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        if (e.touches.length > 0) {
          handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <svg width={size} height={size} viewBox="0 0 80 80">
        <defs>
          <radialGradient id="knobGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#5a5a5a" />
            <stop offset="50%" stopColor="#3a3a3a" />
            <stop offset="100%" stopColor="#1a1a1a" />
          </radialGradient>
          <radialGradient id="knobInnerGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4a4a4a" />
            <stop offset="100%" stopColor="#2a2a2a" />
          </radialGradient>
        </defs>

        <circle cx="40" cy="40" r="38" fill="url(#knobGradient)" />
        <circle cx="40" cy="40" r="34" fill="url(#knobInnerGradient)" />

        <g style={{ transformOrigin: '40px 40px', transform: `rotate(${angle}deg)` }}>
          {gripLines.map((lineAngle, i) => (
            <line
              key={i}
              x1="40"
              y1="8"
              x2="40"
              y2="14"
              stroke={i % 5 === 0 ? '#a0a0a0' : '#606060'}
              strokeWidth={i % 5 === 0 ? 1.5 : 1}
              transform={`rotate(${lineAngle} 40 40)`}
            />
          ))}
          <circle cx="40" cy="18" r="3" fill="#c0392b" />
          <circle cx="40" cy="18" r="1.5" fill="#e74c3c" />
        </g>

        <circle cx="40" cy="40" r="12" fill="#2a2a2a" stroke="#4a4a4a" strokeWidth="1" />
        <circle cx="40" cy="40" r="6" fill="#3a3a3a" />
      </svg>
    </motion.div>
  );
}
