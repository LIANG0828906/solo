import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

interface PowerBarProps {
  onPowerSet: (power: number) => void;
  disabled: boolean;
  onRelease: () => void;
}

export const PowerBar = ({ onPowerSet, disabled, onRelease }: PowerBarProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [power, setPower] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const directionRef = useRef<1 | -1>(1);

  const calculatePower = useCallback((clientX: number) => {
    if (!barRef.current) return 0;
    const rect = barRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    return Math.round(percentage);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    const newPower = calculatePower(e.clientX);
    setPower(newPower);
    onPowerSet(newPower);

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    let currentPower = newPower;
    const animate = () => {
      currentPower += directionRef.current * 2;
      if (currentPower >= 100) {
        currentPower = 100;
        directionRef.current = -1;
      } else if (currentPower <= 0) {
        currentPower = 0;
        directionRef.current = 1;
      }
      setPower(currentPower);
      onPowerSet(currentPower);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
  }, [disabled, calculatePower, onPowerSet]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setIsDragging(false);
      onRelease();
    }
  }, [isDragging, onRelease]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && !disabled) {
      const newPower = calculatePower(e.clientX);
      setPower(newPower);
      onPowerSet(newPower);
    }
  }, [isDragging, disabled, calculatePower, onPowerSet]);

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
    if (disabled && animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [disabled]);

  useEffect(() => {
    if (!isDragging) {
      setPower(0);
      onPowerSet(0);
    }
  }, [isDragging, onPowerSet]);

  const getBarColor = () => {
    if (power < 30) return 'from-yellow-400 to-orange-400';
    if (power < 60) return 'from-orange-400 to-orange-500';
    if (power < 85) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-red-600';
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="flex justify-between mb-2 text-sm text-[#8b4513] font-medium">
        <span>力度</span>
        <span className="font-bold text-[#c0392b]">{power}%</span>
      </div>
      <motion.div
        ref={barRef}
        className={`relative h-10 rounded-full cursor-pointer select-none overflow-hidden
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{
          background: 'linear-gradient(to bottom, #d4a574, #c4956a)',
          boxShadow: isHovering || isDragging
            ? '0 0 20px rgba(192, 57, 43, 0.5), inset 0 2px 4px rgba(0,0,0,0.3)'
            : 'inset 0 2px 4px rgba(0,0,0,0.3)',
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className={`absolute top-1 left-1 h-8 rounded-full bg-gradient-to-r ${getBarColor()}`}
          style={{
            width: `calc(${power}% - 8px)`,
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)',
          }}
          initial={false}
          transition={{ duration: 0.1, ease: 'linear' }}
        />

        <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
          {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((mark) => (
            <div
              key={mark}
              className={`w-0.5 h-4 rounded-full transition-colors duration-200 ${
                (power / 10) * 10 >= mark
                  ? 'bg-white/60'
                  : 'bg-[#8b4513]/30'
              }`}
            />
          ))}
        </div>

        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-lg border-2 border-[#c0392b]"
          style={{
            left: `calc(${power}% - 12px)`,
            boxShadow: '0 2px 8px rgba(192, 57, 43, 0.5)',
          }}
          initial={false}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      </motion.div>

      <div className="mt-2 text-center text-xs text-[#8b4513]/70">
        {disabled ? '请等待...' : '按住鼠标或点击调节力度，松手投出'}
      </div>
    </div>
  );
};
