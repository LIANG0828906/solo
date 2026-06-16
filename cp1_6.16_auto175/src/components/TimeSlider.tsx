import React, { useCallback, useRef, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useAQIStore } from '../store/aqiStore';

export const TimeSlider: React.FC = () => {
  const currentYear = useAQIStore((s) => s.currentYear);
  const setYear = useAQIStore((s) => s.setYear);
  const [isDragging, setIsDragging] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setYear(parseInt(e.target.value, 10));
    },
    [setYear]
  );

  const goBack = useCallback(() => {
    setYear(currentYear - 1);
  }, [currentYear, setYear]);

  const goForward = useCallback(() => {
    setYear(currentYear + 1);
  }, [currentYear, setYear]);

  const percentage = (currentYear - 2014) / (2023 - 2014);

  return (
    <div
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 60,
        background: 'rgba(30, 30, 30, 0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 20px', zIndex: 100,
      }}
    >
      <button
        onClick={goBack}
        disabled={currentYear <= 2014}
        style={{
          background: 'none', border: 'none', color: '#00BCD4', fontSize: 24,
          cursor: currentYear <= 2014 ? 'not-allowed' : 'pointer',
          opacity: currentYear <= 2014 ? 0.4 : 1,
          padding: '8px 12px', borderRadius: '4px',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => { if (currentYear > 2014) e.currentTarget.style.background = 'rgba(0,188,212,0.2)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
      >
        ◀
      </button>

      <div style={{ position: 'relative', width: '80%', maxWidth: 800, height: 22, margin: '0 20px' }}>
        <div
          style={{
            position: 'absolute', top: '50%', left: 0, right: 0, height: 4,
            background: '#424242', borderRadius: 2, transform: 'translateY(-50%)',
          }}
        />
        <div
          style={{
            position: 'absolute', top: '50%', left: 0, width: `${percentage * 100}%`,
            height: 4, background: '#00BCD4', borderRadius: 2,
            transform: 'translateY(-50%)',
          }}
        />
        <input
          type="range"
          min={2014}
          max={2023}
          step={1}
          value={currentYear}
          onChange={handleSliderChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="aqi-range-slider"
          style={{
            position: 'absolute', width: '100%', height: 22,
            appearance: 'none', background: 'transparent',
            outline: 'none', cursor: 'pointer', margin: 0,
          }}
          onMouseEnter={() => {
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
          }}
        />
        <YearIndicator year={currentYear} visible={isDragging} />
      </div>

      <button
        onClick={goForward}
        disabled={currentYear >= 2023}
        style={{
          background: 'none', border: 'none', color: '#00BCD4', fontSize: 24,
          cursor: currentYear >= 2023 ? 'not-allowed' : 'pointer',
          opacity: currentYear >= 2023 ? 0.4 : 1,
          padding: '8px 12px', borderRadius: '4px',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => { if (currentYear < 2023) e.currentTarget.style.background = 'rgba(0,188,212,0.2)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
      >
        ▶
      </button>
    </div>
  );
};

interface YearIndicatorProps {
  year: number;
  visible: boolean;
}

const YearIndicator: React.FC<YearIndicatorProps> = ({ year, visible }) => {
  const props = useSpring({
    opacity: visible ? 1 : 0.85,
    translateY: visible ? -30 : 0,
    config: { tension: 300, friction: 10 },
  });

  return (
    <animated.div
      style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        transform: props.translateY.to((v: number) => `translate(-50%, calc(-100% + ${v}px))`),
        opacity: props.opacity,
        pointerEvents: 'none',
        background: '#00BCD4',
        color: '#FFFFFF',
        fontFamily: 'monospace',
        fontSize: 14,
        padding: '4px 10px',
        borderRadius: 4,
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      }}
    >
      {year}
    </animated.div>
  );
};
