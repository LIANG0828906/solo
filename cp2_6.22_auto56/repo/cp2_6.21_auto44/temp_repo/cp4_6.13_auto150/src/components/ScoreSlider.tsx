import React from 'react';
import { useStore } from '@/store/useStore';
import { getScoreColor } from '@/utils/format';

interface ScoreSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function ScoreSlider({ value, onChange, disabled }: ScoreSliderProps) {
  const theme = useStore((state) => state.theme);
  
  const color = getScoreColor(value);
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span
          className={`text-sm ${
            theme === 'dark' ? 'text-dark-text/80' : 'text-light-text/80'
          }`}
        >
          评分
        </span>
        <span
          className="text-2xl font-bold animate-pulse-scale"
          style={{ color }}
        >
          {value}
        </span>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, #e74c3c 0%, #e74c3c 20%, #f1c40f 20%, #f1c40f 40%, #f1c40f 40%, #f1c40f 60%, #2ecc71 60%, #2ecc71 80%, #2ecc71 80%, #2ecc71 100%)`,
          }}
        />
        
        <div className="flex justify-between mt-1">
          {[1, 2, 3, 4, 5].map((num) => (
            <span
              key={num}
              className={`text-xs ${
                theme === 'dark' ? 'text-dark-text/60' : 'text-light-text/60'
              }`}
            >
              {num}
            </span>
          ))}
        </div>
      </div>
      
      <div className="flex gap-2 mt-2">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            onClick={() => onChange(num)}
            disabled={disabled}
            className={`flex-1 py-2 rounded-lg transition-all duration-200 ${
              value === num
                ? 'scale-105 shadow-md'
                : 'hover:scale-102'
            } ${
              disabled
                ? theme === 'dark'
                  ? 'bg-dark-accent1/30 cursor-not-allowed'
                  : 'bg-gray-200 cursor-not-allowed'
                : value === num
                ? 'bg-gradient-to-r from-gradient-start to-gradient-end text-white'
                : theme === 'dark'
                ? 'bg-dark-accent1 hover:bg-dark-accent1/80'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            style={{
              color: value === num && !disabled ? 'white' : getScoreColor(num),
            }}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}