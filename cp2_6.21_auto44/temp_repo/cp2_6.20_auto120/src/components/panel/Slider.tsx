import React, { useState, useRef, useEffect } from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

export const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, onChange }) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isHovering, setIsHovering] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    onChange(v);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    let v = parseFloat(inputValue);
    if (isNaN(v)) {
      v = min;
    }
    v = Math.max(min, Math.min(max, v));
    v = Math.round(v / step) * step;
    onChange(v);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  const formatTooltip = (v: number): string => {
    if (step >= 1) return v.toFixed(0);
    if (step >= 0.1) return v.toFixed(1);
    return v.toFixed(2);
  };

  return (
    <div className="slider-wrapper">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <input
          type="number"
          className="number-input"
          min={min}
          max={max}
          step={step}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
        />
      </div>
      <div
        className="slider-container"
        ref={trackRef}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="slider-track">
          <div className="slider-fill" style={{ width: `${percentage}%` }} />
        </div>
        <input
          type="range"
          className="slider-input"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
        />
        <div className="slider-thumb" style={{ left: `${percentage}%` }} />
        <div className="slider-tooltip" style={{ left: `${percentage}%` }}>
          {formatTooltip(value)}
        </div>
      </div>
    </div>
  );
};

export default Slider;
