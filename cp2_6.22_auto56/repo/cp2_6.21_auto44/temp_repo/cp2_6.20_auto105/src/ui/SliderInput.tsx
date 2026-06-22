import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface SliderInputProps {
  value: number;
  min: number;
  max: number;
  step: number;
  label: string;
  unit?: string;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

export const SliderInput: React.FC<SliderInputProps> = ({
  value,
  min,
  max,
  step,
  label,
  unit = '',
  onChange,
  formatValue,
}) => {
  const displayValue = formatValue ? formatValue(value) : value.toFixed(1);

  const handleDecrease = () => {
    const newValue = Math.max(min, value - step);
    onChange(Number(newValue.toFixed(2)));
  };

  const handleIncrease = () => {
    const newValue = Math.min(max, value + step);
    onChange(Number(newValue.toFixed(2)));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onChange(Number(newValue.toFixed(2)));
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="param-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[#c8d6e5]">{label}</span>
        <span className="text-sm font-mono text-[#4fc3f7]">
          {displayValue}{unit && <span className="text-xs text-[#8892a6] ml-1">{unit}</span>}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrease}
          className="adjust-btn"
          aria-label={`减少${label}`}
        >
          <Minus size={14} />
        </button>
        <div className="flex-1 relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleSliderChange}
            className="slider-input"
            style={{
              background: `linear-gradient(to right, #4fc3f7 0%, #4fc3f7 ${percentage}%, #3a3a6a ${percentage}%, #3a3a6a 100%)`,
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleIncrease}
          className="adjust-btn"
          aria-label={`增加${label}`}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};
