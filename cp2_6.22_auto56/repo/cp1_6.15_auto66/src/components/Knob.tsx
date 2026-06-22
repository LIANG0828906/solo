import React, { useCallback, useEffect, useRef, useState } from 'react';
import '../styles.css';

export interface KnobProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  size?: 'normal' | 'mini';
  showGlow?: boolean;
  glowThreshold?: number;
  disabled?: boolean;
  onChange?: (v: number) => void;
  onChangeEnd?: (v: number) => void;
}

const TRANSITION_MS = 150;

export const Knob: React.FC<KnobProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit,
  size = 'normal',
  showGlow = false,
  glowThreshold = 50,
  disabled = false,
  onChange,
  onChangeEnd,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [labelVisible, setLabelVisible] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const startYRef = useRef<number>(0);
  const startValueRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);
  const targetValueRef = useRef<number>(value);
  const labelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clamp = useCallback((v: number): number => {
    const clamped = Math.min(Math.max(v, min), max);
    return Math.round(clamped / step) * step;
  }, [min, max, step]);

  const percent = ((displayValue - min) / (max - min)) * 100;
  const angle = (percent / 100) * 360;
  const exceedThreshold = displayValue > glowThreshold;

  useEffect(() => {
    targetValueRef.current = clamp(value);
    if (!isDragging) {
      animateTo(targetValueRef.current);
    }
  }, [value, clamp, isDragging]);

  const animateTo = (target: number): void => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }
    const startTime = performance.now();
    const startVal = displayValue;
    const duration = TRANSITION_MS;

    const tick = (now: number): void => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress;
      const current = startVal + (target - startVal) * eased;
      setDisplayValue(current);
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        animationRef.current = null;
        setDisplayValue(target);
      }
    };
    animationRef.current = requestAnimationFrame(tick);
  };

  const showLabel = (): void => {
    setLabelVisible(true);
    if (labelTimerRef.current !== null) {
      clearTimeout(labelTimerRef.current);
    }
    labelTimerRef.current = setTimeout(() => {
      setLabelVisible(false);
      labelTimerRef.current = null;
    }, TRANSITION_MS + 1000);
  };

  const handleStart = (clientY: number): void => {
    if (disabled) return;
    setIsDragging(true);
    startYRef.current = clientY;
    startValueRef.current = clamp(value);
    targetValueRef.current = startValueRef.current;
    setDisplayValue(startValueRef.current);
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    showLabel();
  };

  const handleMove = (clientY: number): void => {
    if (!isDragging || disabled) return;
    const deltaY = startYRef.current - clientY;
    const range = max - min;
    const sensitivity = range / 200;
    const rawValue = startValueRef.current + deltaY * sensitivity;
    const newValue = clamp(rawValue);
    targetValueRef.current = newValue;
    setDisplayValue(newValue);
    onChange?.(newValue);
  };

  const handleEnd = (): void => {
    if (!isDragging) return;
    setIsDragging(false);
    const finalValue = targetValueRef.current;
    onChangeEnd?.(finalValue);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent): void => {
      handleMove(e.clientY);
    };
    const onMouseUp = (): void => {
      handleEnd();
    };
    const onTouchMove = (e: TouchEvent): void => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientY);
      }
    };
    const onTouchEnd = (): void => {
      handleEnd();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging]);

  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      if (labelTimerRef.current !== null) {
        clearTimeout(labelTimerRef.current);
      }
    };
  }, []);

  const knobClasses = [
    'knob',
    'glass',
    size === 'mini' ? 'knob-mini' : '',
    showGlow && exceedThreshold ? 'knob-glow' : '',
  ].filter(Boolean).join(' ');

  const conicStyle: React.CSSProperties = {
    background: `conic-gradient(from 180deg, #60a5fa 0deg, #93c5fd ${angle}deg, rgba(255,255,255,0.08) ${angle}deg, rgba(255,255,255,0.08) 360deg)`,
    transition: 'background 0.15s ease',
  };

  const fontSize = size === 'mini' ? '10px' : '12px';
  const innerSize = size === 'mini' ? '20px' : '36px';
  const labelTop = size === 'mini' ? '-18px' : '-22px';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        handleStart(e.clientY);
      }}
      onTouchStart={(e) => {
        if (e.touches.length > 0) {
          handleStart(e.touches[0].clientY);
        }
      }}
    >
      <div
        className={knobClasses}
        style={{
          ...conicStyle,
          cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: innerSize,
            height: innerSize,
            borderRadius: '50%',
            background: '#0f0f1a',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          <span
            style={{
              color: '#e0e0e0',
              fontSize,
              fontWeight: 600,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              transition: 'all 0.15s ease',
            }}
          >
            {Math.round(displayValue)}
          </span>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: labelTop,
          left: '50%',
          transform: `translateX(-50%) translateY(${labelVisible ? '0' : '4px'})`,
          opacity: labelVisible ? 1 : 0,
          pointerEvents: 'none',
          background: 'rgba(0,0,0,0.7)',
          color: '#ffffff',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          transition: 'all 0.15s ease',
          fontVariantNumeric: 'tabular-nums',
          zIndex: 10,
        }}
      >
        {Math.round(displayValue)}
        {unit ?? ''}
      </div>

      {label && (
        <span
          style={{
            marginTop: size === 'mini' ? '4px' : '6px',
            color: '#a0a0b8',
            fontSize: size === 'mini' ? '9px' : '11px',
            fontWeight: 500,
            letterSpacing: '0.5px',
            textAlign: 'center',
            maxWidth: size === 'mini' ? '50px' : '70px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export default Knob;
