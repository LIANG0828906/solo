import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';

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
  /** 主题强调色，覆盖默认的蓝色。传入后渐变、光晕、指示针都使用该颜色 */
  accentColor?: string;
}

/**
 * 将十六进制颜色（如 #ff0000）转成 rgba 格式
 * 支持 3/4/6/8 位十六进制
 */
const hexToRgba = (hex: string, alpha: number): string => {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  } else if (clean.length === 4) {
    clean = clean.slice(0, 3).split('').map((c) => c + c).join('');
  } else if (clean.length === 8) {
    clean = clean.slice(0, 6);
  }
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    clean = '63b3ed'; // fallback blue
  }
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * 生成一个比指定颜色略浅/略深的变体，用于渐变
 * amount: 正数变亮，负数变暗，范围 0-1
 */
const shiftColor = (hex: string, amount: number): string => {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    clean = '63b3ed';
  }
  let r = parseInt(clean.slice(0, 2), 16);
  let g = parseInt(clean.slice(2, 4), 16);
  let b = parseInt(clean.slice(4, 6), 16);
  if (amount >= 0) {
    r = Math.round(r + (255 - r) * amount);
    g = Math.round(g + (255 - g) * amount);
    b = Math.round(b + (255 - b) * amount);
  } else {
    r = Math.round(r * (1 + amount));
    g = Math.round(g * (1 + amount));
    b = Math.round(b * (1 + amount));
  }
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

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
  accentColor,
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);

  // 处理默认蓝色主题 & 自定义 accentColor
  const theme = useMemo(() => {
    const main = accentColor ?? '#63b3ed';
    const light = accentColor ? shiftColor(accentColor, 0.25) : '#90cdf4';
    const dark = accentColor ? shiftColor(accentColor, -0.2) : '#4299e1';
    const glow = accentColor ? hexToRgba(accentColor, 0.8) : 'rgba(99, 179, 237, 0.8)';
    const glowSoft = accentColor ? hexToRgba(accentColor, 0.6) : 'rgba(99, 179, 237, 0.6)';
    const gradientId = `knob-grad-${main.replace('#', '')}-${size}`;
    return { main, light, dark, glow, glowSoft, gradientId };
  }, [accentColor, size]);

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

  const handleReset = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (defaultValue !== undefined) {
      onChange(defaultValue);
    }
  };

  const trackRadius = size / 2 - 4;
  const knobRadius = trackRadius - 6;
  const indicatorLength = knobRadius - 8;
  const circumference = 2 * Math.PI * trackRadius;
  const dashOffset = (0.75 * circumference) / 2;

  return (
    <div className="flex flex-col items-center gap-1" style={{ width: size }}>
      {label && (
        <span className="text-xs text-gray-400 font-medium">{label}</span>
      )}
      <button
        onClick={handleReset}
        className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors px-2 py-0.5 rounded hover:bg-white/10"
        title="重置为默认值"
        style={{ color: accentColor ? theme.main : undefined }}
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
          <defs>
            <linearGradient id={theme.gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={theme.light} />
              <stop offset="100%" stopColor={theme.dark} />
            </linearGradient>
          </defs>
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
            stroke={`url(#${theme.gradientId})`}
            strokeWidth="4"
            strokeDasharray={`${(percentage / 100) * circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{
              filter:
                isDragging || isHovering
                  ? `drop-shadow(0 0 8px ${theme.glow})`
                  : 'none',
              transition: 'filter 0.2s ease',
            }}
          />
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
                ? `0 0 20px ${theme.glowSoft}, inset 0 2px 4px rgba(0,0,0,0.5)`
                : 'inset 0 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: 4,
              height: indicatorLength + 4,
              left: knobRadius - 2,
              top: knobRadius - indicatorLength - 2,
              background: theme.main,
              transformOrigin: 'center bottom',
              boxShadow: `0 0 6px ${theme.glow}`,
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
