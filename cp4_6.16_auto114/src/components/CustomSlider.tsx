import React from 'react';
import ReactSlider from 'react-slider';

interface CustomSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  onChangeComplete?: (value: number) => void;
}

const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  onChangeComplete
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <ReactSlider
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(val) => onChange(val as number)}
      onAfterChange={(val) => onChangeComplete?.(val as number)}
      renderTrack={({ props, children, index }: any) => (
        <div key={index} {...props} className="custom-slider">
          <div
            className="custom-slider-track"
            style={{ width: `${percentage}%` }}
          />
          {children}
        </div>
      )}
      renderThumb={({ props, index }: any) => (
        <div key={index} {...props} className="custom-slider-thumb" />
      )}
    />
  );
};

export default CustomSlider;
