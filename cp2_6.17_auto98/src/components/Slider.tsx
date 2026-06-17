import React, { useRef, useState, useCallback } from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

const TRACK_COLOR = '#3D3D5C';
const THUMB_COLOR = '#FF6B6B';

export const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, onChange }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const percent = ((value - min) / (max - min)) * 100;

  const updateValueFromEvent = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const ratio = x / rect.width;
      let newValue = min + ratio * (max - min);
      newValue = Math.round(newValue / step) * step;
      newValue = Math.max(min, Math.min(max, newValue));
      if (step < 1) {
        newValue = Math.round(newValue * 100) / 100;
      } else {
        newValue = Math.round(newValue);
      }
      onChange(newValue);
    },
    [min, max, step, onChange]
  );

  const triggerRipple = useCallback((x: number, y: number) => {
    const id = Date.now() + Math.random();
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 200);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateValueFromEvent(e.clientX);
    const thumbX = trackRef.current
      ? trackRef.current.getBoundingClientRect().left + (percent / 100) * trackRef.current.getBoundingClientRect().width
      : e.clientX;
    triggerRipple(thumbX - (e.currentTarget as HTMLElement).getBoundingClientRect().left, 14);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    updateValueFromEvent(e.touches[0].clientX);
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      updateValueFromEvent(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      updateValueFromEvent(e.touches[0].clientX);
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, updateValueFromEvent]);

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          color: '#FFFFFF',
          fontSize: 14,
          marginBottom: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{label}</span>
      </div>
      <div
        ref={trackRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          position: 'relative',
          width: '100%',
          height: 28,
          cursor: 'pointer',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: 4,
            backgroundColor: TRACK_COLOR,
            borderRadius: 2,
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: `${percent}%`,
            height: 4,
            backgroundColor: THUMB_COLOR,
            borderRadius: 2,
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `calc(${percent}% - 9px)`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 18,
            height: 18,
            borderRadius: '50%',
            backgroundColor: THUMB_COLOR,
            boxShadow: isDragging ? '0 0 10px rgba(255, 107, 107, 0.6)' : 'none',
            transition: 'box-shadow 0.15s ease',
            zIndex: 2,
          }}
        />
        {ripples.map((ripple) => (
          <div
            key={ripple.id}
            className="slider-ripple"
            style={{
              left: ripple.x - 9,
              top: '50%',
              width: 18,
              height: 18,
              marginTop: -9,
            }}
          />
        ))}
      </div>
      <div
        style={{
          color: '#8888AA',
          fontSize: 12,
          marginTop: 4,
          textAlign: 'right',
        }}
      >
        {value}
      </div>
    </div>
  );
};
