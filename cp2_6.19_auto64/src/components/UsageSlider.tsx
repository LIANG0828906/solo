import { useState, useCallback } from 'react';
import { Droplets } from 'lucide-react';

interface UsageSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const UsageSlider = ({
  value,
  onChange,
  min = 1,
  max = 20,
  step = 0.5,
}: UsageSliderProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const roundToStep = useCallback((val: number): number => {
    const steps = Math.round(val / step) * step;
    return Math.round(steps * 10) / 10;
  }, [step]);

  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseFloat(e.target.value);
    const roundedValue = roundToStep(rawValue);
    onChange(roundedValue);
  };

  const displayValue = roundToStep(value);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-primary" />
          <span className="text-gray-600 font-medium">今日用量</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-primary">{displayValue}</span>
          <span className="text-gray-500">ml/g</span>
        </div>
      </div>

      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary-dark rounded-full transition-all duration-150"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={displayValue}
        onChange={handleChange}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
        className="w-full h-3 -mt-3 appearance-none bg-transparent cursor-pointer relative z-10"
        style={{
          WebkitAppearance: 'none',
        }}
      />

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #8B9DAF;
          cursor: pointer;
          box-shadow: ${isDragging ? '0 0 0 8px rgba(139, 157, 175, 0.2)' : '0 2px 8px rgba(0,0,0,0.2)'};
          transition: box-shadow 0.2s;
          margin-top: -2px;
        }
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #8B9DAF;
          cursor: pointer;
          border: none;
          box-shadow: ${isDragging ? '0 0 0 8px rgba(139, 157, 175, 0.2)' : '0 2px 8px rgba(0,0,0,0.2)'};
          transition: box-shadow 0.2s;
        }
        input[type="range"]::-webkit-slider-runnable-track {
          height: 0;
        }
        input[type="range"]::-moz-range-track {
          height: 0;
          background: transparent;
        }
      `}</style>

      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>{min} ml/g</span>
        <span>{max} ml/g</span>
      </div>
    </div>
  );
};

interface QuickUsageButtonsProps {
  value: number;
  onChange: (value: number) => void;
}

export const QuickUsageButtons = ({ value, onChange }: QuickUsageButtonsProps) => {
  const quickValues = [1, 2, 3, 5];

  return (
    <div className="flex flex-wrap gap-2">
      {quickValues.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            value === v
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {v} ml/g
        </button>
      ))}
    </div>
  );
};
