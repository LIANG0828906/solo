import '../styles.css';
import React, { useCallback, useRef, useState } from 'react';

export interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  showValue?: boolean;
  disabled?: boolean;
  className?: string;
  onChange?: (v: number) => void;
  onChangeEnd?: (v: number) => void;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  orientation = 'vertical',
  label,
  showValue = false,
  disabled = false,
  className = '',
  onChange,
  onChangeEnd,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const clamp = useCallback(
    (v: number): number => {
      const range = max - min;
      const steps = Math.round((v - min) / step);
      const snapped = min + steps * step;
      return Math.min(max, Math.max(min, snapped));
    },
    [min, max, step]
  );

  const percentage = ((clamp(value) - min) / (max - min)) * 100;

  const getValueFromPointer = useCallback(
    (clientX: number, clientY: number): number => {
      const track = trackRef.current;
      if (!track) return clamp(value);
      const rect = track.getBoundingClientRect();
      let ratio: number;
      if (orientation === 'horizontal') {
        ratio = (clientX - rect.left) / rect.width;
      } else {
        ratio = 1 - (clientY - rect.top) / rect.height;
      }
      ratio = Math.min(1, Math.max(0, ratio));
      return clamp(min + ratio * (max - min));
    },
    [clamp, min, max, orientation, value]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setIsDragging(true);
      const newValue = getValueFromPointer(e.clientX, e.clientY);
      onChange?.(newValue);
    },
    [disabled, getValueFromPointer, onChange]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || disabled) return;
      const newValue = getValueFromPointer(e.clientX, e.clientY);
      onChange?.(newValue);
    },
    [isDragging, disabled, getValueFromPointer, onChange]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setIsDragging(false);
      const newValue = getValueFromPointer(e.clientX, e.clientY);
      onChangeEnd?.(newValue);
    },
    [isDragging, getValueFromPointer, onChangeEnd]
  );

  const isHorizontal = orientation === 'horizontal';

  const containerStyle: React.CSSProperties = isHorizontal
    ? {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        ...(disabled ? { pointerEvents: 'none', opacity: 0.5 } : {}),
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        height: '100%',
        ...(disabled ? { pointerEvents: 'none', opacity: 0.5 } : {}),
      };

  const trackStyle: React.CSSProperties = isHorizontal
    ? {
        position: 'relative',
        width: '100%',
        height: '8px',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        touchAction: 'none',
      }
    : {
        position: 'relative',
        width: '8px',
        height: '100%',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        touchAction: 'none',
      };

  const fillStyle: React.CSSProperties = isHorizontal
    ? {
        position: 'absolute',
        left: 0,
        top: 0,
        width: `${percentage}%`,
        height: '100%',
        background: 'linear-gradient(90deg, #60a5fa, #93c5fd)',
        borderRadius: '4px',
        transition: 'all 0.15s ease',
      }
    : {
        position: 'absolute',
        left: 0,
        bottom: 0,
        width: '100%',
        height: `${percentage}%`,
        background: 'linear-gradient(0deg, #60a5fa, #93c5fd)',
        borderRadius: '4px',
        transition: 'all 0.15s ease',
      };

  const getThumbScale = (): number => {
    if (isDragging) return 0.95;
    if (isHovering) return 1.1;
    return 1;
  };

  const getThumbTransition = (): string => {
    if (isHovering && !isDragging) return 'all 0.2s ease';
    return 'all 0.15s ease';
  };

  const thumbScale = getThumbScale();
  const thumbTransition = getThumbTransition();

  const thumbStyle: React.CSSProperties = isHorizontal
    ? {
        position: 'absolute',
        left: `${percentage}%`,
        top: '50%',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        transform: `translate(-50%, -50%) scale(${thumbScale})`,
        boxShadow: '0 0 8px rgba(96, 165, 250, 0.5)',
        transition: thumbTransition,
        zIndex: 1,
      }
    : {
        position: 'absolute',
        bottom: `${percentage}%`,
        left: '50%',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        transform: `translate(-50%, 50%) scale(${thumbScale})`,
        boxShadow: '0 0 8px rgba(96, 165, 250, 0.5)',
        transition: thumbTransition,
        zIndex: 1,
      };

  const labelContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    fontSize: '11px',
    color: '#a0a0b8',
    minWidth: '40px',
  };

  const valueLabelStyle: React.CSSProperties = {
    fontWeight: 600,
    color: '#e0e0e0',
    fontSize: '12px',
  };

  return (
    <div className={`slider-container ${className}`} style={containerStyle}>
      {!isHorizontal && label && (
        <div style={labelContainerStyle}>
          <span>{label}</span>
        </div>
      )}
      <div
        ref={trackRef}
        className="glass"
        style={trackStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div style={fillStyle} />
        <div
          className="glass"
          style={thumbStyle}
          onMouseEnter={() => !disabled && setIsHovering(true)}
          onMouseLeave={() => {
            setIsHovering(false);
          }}
        />
      </div>
      {(label || showValue) && (
        <div style={labelContainerStyle}>
          {isHorizontal && label && <span>{label}</span>}
          {showValue && <span style={valueLabelStyle}>{clamp(value)}</span>}
        </div>
      )}
    </div>
  );
};

export default Slider;
