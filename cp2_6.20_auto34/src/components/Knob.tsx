import React, { useState, useRef, useCallback, useEffect } from 'react';

interface KnobProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  label?: string;
  defaultValue?: number;
  onChange: (value: number) => void;
  showValue?: boolean;
  size?: number;
}

const Knob: React.FC<KnobProps> = ({
  value,
  min,
  max,
  step = 0.01,
  label,
  defaultValue,
  onChange,
  showValue = true,
  size = 60,
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);

  const percentage = ((value - min) / (max - min)) * 100;
  const rotation = (percentage / 100) * 270 - 135;
  const displayValue = Number(value.toFixed(2));

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startYRef.current = e.clientY;
      startValueRef.current = value;
    },
    [value]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = startYRef.current - e.clientY;
      const sensitivity = (max - min) / 200;
      let newValue = startValueRef.current + deltaY * sensitivity;
      newValue = Math.max(min, Math.min(max, newValue));
      newValue = Math.round(newValue / step) * step;
      onChange(newValue);
    },
    [isDragging, min, max, step, onChange]
  );

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

  const handleReset = () => {
    if (defaultValue !== undefined) {
      onChange(defaultValue);
    }
  };

  const trackRadius = size / 2 - 4;
  const knobRadius = trackRadius - 6;
  const indicatorLength = knobRadius - 8;

  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-xs text-gray-400 font-medium">{label}</span>
      )}
      <button
        onClick={handleReset}
        className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors px-2 py-0.5 rounded hover:bg-white/10"
        title="重置为默认值"
      >
        ↺ 重置
      </button>
      <div
        ref={knobRef}
        className="relative cursor-pointer select-none"
        style={{ width: size, height: size }}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <svg width={size} height={size} className="absolute inset-0">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={trackRadius}
            fill="none"
            stroke="#2d3748"
            strokeWidth="4"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={trackRadius}
            fill="none"
            stroke="url(#knobGradient)"
            strokeWidth="4"
            strokeDasharray={`${(percentage / 100) * 2 * Math.PI * trackRadius} ${2 * Math.PI * trackRadius}`}
            strokeDashoffset={(0.75 * 2 * Math.PI * trackRadius) / 2}
            strokeLinecap="round"
            style={{
              filter:
                isDragging || isHovering
                  ? 'drop-shadow(0 0 8px rgba(99, 179, 237, 0.8))'
                  : 'none',
              transition: 'filter 0.2s ease',
            }}
          />
          <defs>
            <linearGradient id="knobGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#63b3ed" />
              <stop offset="100%" stopColor="#4299e1" />
            </linearGradient>
          </defs>
        </svg>

        <div
          className="absolute rounded-full bg-gradient-to-br from-gray-600 to-gray-800 shadow-inner"
          style={{
            width: knobRadius * 2,
            height: knobRadius * 2,
            left: size / 2 - knobRadius,
            top: size / 2 - knobRadius,
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 0.05s linear',
            boxShadow:
              isDragging || isHovering
                ? '0 0 20px rgba(99, 179, 237, 0.6), inset 0 2px 4px rgba(0,0,0,0.5)'
                : 'inset 0 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          <div
            className="absolute bg-blue-400 rounded-full"
            style={{
              width: 4,
              height: indicatorLength + 4,
              left: knobRadius - 2,
              top: knobRadius - indicatorLength - 2,
              transformOrigin: 'center bottom',
              boxShadow: '0 0 6px rgba(99, 179, 237, 0.8)',
            }}
          />
        </div>

        {showValue && (
          <div
            className="absolute inset-0 flex items-center justify-center text-xs font-mono text-gray-200 pointer-events-none"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
          >
            {displayValue}
          </div>
        )}
      </div>
    </div>
  );
};

export default Knob;
