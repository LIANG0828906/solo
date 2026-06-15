import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';

interface CircularProgressProps {
  value: number;
  onChange?: (value: number) => void;
  onRelease?: (value: number) => void;
  editable?: boolean;
  size?: number;
  strokeWidth?: number;
  score?: number;
}

const getColorByProgress = (progress: number, score?: number): string => {
  const val = score !== undefined ? score : progress / 20;
  if (val <= 2) {
    return '#ef4444';
  } else if (val <= 3) {
    return '#eab308';
  } else {
    return '#22c55e';
  }
};

const getGradientId = (progress: number, score?: number): string[] => {
  const val = score !== undefined ? score : progress / 20;
  if (val <= 2) {
    return ['#fecaca', '#ef4444'];
  } else if (val <= 3) {
    return ['#fef08a', '#eab308'];
  } else {
    return ['#bbf7d0', '#22c55e'];
  }
};

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  onChange,
  onRelease,
  editable = true,
  size = 80,
  strokeWidth = 8,
  score,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [gradientStart, gradientEnd] = getGradientId(displayValue, score);
  const progressColor = getColorByProgress(displayValue, score);

  const offset = useMemo(() => {
    return circumference - (displayValue / 100) * circumference;
  }, [circumference, displayValue]);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const calculateAngle = useCallback(
      (clientX: number, clientY: number): number => {
        if (!svgRef.current) return displayValue;
        const rect = svgRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI) + 90;
        const normalizedAngle = angle < 0 ? angle + 360 : angle;
        return Math.round((normalizedAngle / 360) * 100);
      },
      [displayValue]
    );

  const handleStart = useCallback(
      (clientX: number, clientY: number) => {
        if (!editable) return;
        setIsDragging(true);
        const newValue = calculateAngle(clientX, clientY);
        const clamped = Math.max(0, Math.min(100, newValue));
        setDisplayValue(clamped);
        onChange?.(clamped);
      },
      [editable, calculateAngle, onChange]
    );

  const handleMove = useCallback(
      (clientX: number, clientY: number) => {
        if (!isDragging) return;
        const newValue = calculateAngle(clientX, clientY);
        const clamped = Math.max(0, Math.min(100, newValue));
        setDisplayValue(clamped);
        onChange?.(clamped);
      },
      [isDragging, calculateAngle, onChange]
    );

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    onRelease?.(displayValue);
  }, [isDragging, displayValue, onRelease]);

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
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const gradientId = `circular-gradient-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      style={{
        cursor: editable ? (isDragging ? 'grabbing' : 'grab') : 'default',
        touchAction: 'none',
        display: 'block',
      }}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        if (e.touches.length > 0) {
          handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gradientStart} />
          <stop offset="100%" stopColor={gradientEnd} />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{
          transition: isDragging ? 'none' : 'stroke-dashoffset 0.3s ease',
        }}
      />
      <circle
        cx={size / 2 + radius * Math.cos((displayValue / 100) * 2 * Math.PI - Math.PI / 2)}
        cy={size / 2 + radius * Math.sin((displayValue / 100) * 2 * Math.PI - Math.PI / 2)}
        r={editable ? strokeWidth / 1.5 : 0}
        fill={progressColor}
        stroke="#fff"
        strokeWidth={2}
        style={{
          transition: isDragging ? 'none' : 'all 0.3s ease',
          filter: editable ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none',
        }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size / 4}
        fontWeight="bold"
        fill={progressColor}
        style={{
          transition: 'fill 0.3s ease',
          userSelect: 'none',
        }}
      >
        {displayValue}%
      </text>
    </svg>
  );
};

export default CircularProgress;
