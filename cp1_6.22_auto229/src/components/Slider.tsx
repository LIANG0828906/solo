import React from 'react';

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  className = '',
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  const trackStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: '4px',
    transform: 'translateY(-50%)',
    backgroundColor: 'var(--color-bg-tertiary)',
    borderRadius: '2px',
    overflow: 'hidden',
  };

  const fillStyle: React.CSSProperties = {
    height: '100%',
    width: `${percentage}%`,
    backgroundColor: 'var(--color-accent)',
    borderRadius: '2px',
    transition: 'width 0.1s ease',
  };

  const inputStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    margin: 0,
  };

  const thumbStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: `calc(${percentage}% - 6px)`,
    width: '12px',
    height: '12px',
    transform: 'translateY(-50%)',
    backgroundColor: 'var(--color-white)',
    borderRadius: '50%',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    pointerEvents: 'none',
    transition: 'left 0.1s ease',
  };

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        height: '16px',
        width: '100%',
      }}
    >
      <div style={trackStyle}>
        <div style={fillStyle} />
      </div>
      <div style={thumbStyle} />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        style={inputStyle}
      />
    </div>
  );
};
