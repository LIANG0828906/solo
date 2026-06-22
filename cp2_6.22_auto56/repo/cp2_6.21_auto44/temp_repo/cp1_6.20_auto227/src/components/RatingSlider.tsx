import React, { useState, useCallback, memo } from 'react';

interface RatingSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const RatingSlider: React.FC<RatingSliderProps> = memo(({ value, onChange, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback(() => {
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!disabled) {
        onChange(Number(e.target.value));
      }
    },
    [onChange, disabled]
  );

  const sliderPercent = ((value - 1) / 9) * 100;

  return (
    <div className="slider-section">
      <div className="slider-label">
        <span className="slider-label-title">我的评分</span>
        <span style={{ fontWeight: 600, color: '#3498db' }}>{value}分</span>
      </div>
      <div className="slider-wrapper">
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={handleChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className="slider"
          disabled={disabled}
        />
        {isDragging && (
          <div
            className="slider-tooltip"
            style={{ left: `${sliderPercent}%` }}
          >
            {value}分
          </div>
        )}
      </div>
    </div>
  );
});

RatingSlider.displayName = 'RatingSlider';

export default RatingSlider;
