import React, { useState, useCallback, useRef } from 'react';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
}

export const SliderControl: React.FC<SliderControlProps> = React.memo(
  ({ label, value, min, max, step, onChange, unit = '' }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState(0);
    const sliderRef = useRef<HTMLInputElement>(null);

    const updateTooltipPosition = useCallback(() => {
      if (!sliderRef.current) return;
      const slider = sliderRef.current;
      const percentage = ((value - min) / (max - min)) * 100;
      setTooltipPosition(percentage);
    }, [value, min, max]);

    const handleSliderChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);
        onChange(newValue);
        updateTooltipPosition();
      },
      [onChange, updateTooltipPosition]
    );

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = parseFloat(e.target.value);
        if (isNaN(newValue)) return;
        newValue = Math.min(Math.max(newValue, min), max);
        newValue = Math.round(newValue / step) * step;
        onChange(newValue);
      },
      [onChange, min, max, step]
    );

    const handleMouseDown = useCallback(() => {
      setIsDragging(true);
      updateTooltipPosition();
    }, [updateTooltipPosition]);

    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
    }, []);

    const displayValue = Number.isInteger(step)
      ? Math.round(value)
      : value.toFixed(2);

    return (
      <div className="form-group">
        <label className="form-label">{label}</label>
        <div className="slider-control">
          <div className="slider-wrapper">
            <div
              className={`slider-tooltip ${isDragging ? 'visible' : ''}`}
              style={{ left: `${tooltipPosition}%` }}
            >
              {displayValue}
              {unit}
            </div>
            <input
              ref={sliderRef}
              type="range"
              className="slider"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={handleSliderChange}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
            />
          </div>
          <input
            type="number"
            className="number-input"
            min={min}
            max={max}
            step={step}
            value={displayValue}
            onChange={handleInputChange}
          />
        </div>
      </div>
    );
  }
);

SliderControl.displayName = 'SliderControl';
