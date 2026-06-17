import React, { useState, useCallback } from 'react';

interface ScoreSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const ScoreSlider: React.FC<ScoreSliderProps> = ({ label, value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  const [animating, setAnimating] = useState(false);

  const handleChange = useCallback(
    (newValue: number) => {
      const rounded = Math.round(newValue * 10) / 10;
      if (rounded !== displayValue) {
        setAnimating(true);
        setDisplayValue(rounded);
        onChange(rounded);
        setTimeout(() => setAnimating(false), 150);
      }
    },
    [displayValue, onChange]
  );

  const percent = (value / 10) * 100;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '8px 0',
      }}
    >
      <span
        style={{
          width: 48,
          fontSize: 14,
          fontFamily: "'Noto Serif SC', serif",
          color: '#5D4037',
          fontWeight: 600,
          flexShrink: 0,
          textAlign: 'right',
        }}
      >
        {label}
      </span>
      <div
        style={{
          width: 320,
          position: 'relative',
          height: 24,
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '100%',
            height: 6,
            borderRadius: 3,
            backgroundColor: '#D2B48C',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${percent}%`,
              height: '100%',
              borderRadius: 3,
              backgroundColor: '#6B8E23',
              transition: 'width 0.1s ease',
            }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={10}
          step={0.1}
          value={value}
          onChange={(e) => handleChange(parseFloat(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 24,
            opacity: 0,
            cursor: 'pointer',
            margin: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${percent}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: isDragging ? 18 : 14,
            height: isDragging ? 18 : 14,
            borderRadius: '50%',
            backgroundColor: '#6B8E23',
            border: '2px solid #fff',
            boxShadow: '0 2px 6px rgba(107,142,35,0.4)',
            transition: 'width 0.15s, height 0.15s',
            pointerEvents: 'none',
          }}
        />
      </div>
      <span
        style={{
          width: 40,
          fontSize: 16,
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
          color: '#6B8E23',
          textAlign: 'center',
          transition: 'transform 0.15s ease',
          transform: animating ? 'scale(1.2)' : 'scale(1)',
          flexShrink: 0,
        }}
      >
        {value.toFixed(1)}
      </span>
    </div>
  );
};

export default ScoreSlider;
