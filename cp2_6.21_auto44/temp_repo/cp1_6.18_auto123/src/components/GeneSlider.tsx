import React, { useCallback, useRef } from 'react';
import { FontGeneProfile, GENE_RANGES, GENE_LABELS, GENE_UNITS } from '../types';

interface GeneSliderProps {
  geneKey: keyof FontGeneProfile;
  value: number;
  onChange: (key: keyof FontGeneProfile, value: number) => void;
  disabled?: boolean;
}

export const GeneSlider: React.FC<GeneSliderProps> = ({
  geneKey,
  value,
  onChange,
  disabled = false,
}) => {
  const range = GENE_RANGES[geneKey];
  const label = GENE_LABELS[geneKey];
  const unit = GENE_UNITS[geneKey];
  const rafRef = useRef<number | null>(null);
  const pendingValue = useRef<number | null>(null);

  const percentage = ((value - range.min) / (range.max - range.min)) * 100;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      pendingValue.current = newValue;

      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          if (pendingValue.current !== null) {
            onChange(geneKey, pendingValue.current);
            pendingValue.current = null;
          }
          rafRef.current = null;
        });
      }
    },
    [geneKey, onChange]
  );

  const formattedValue = Number.isInteger(range.step)
    ? Math.round(value)
    : value.toFixed(1);

  return (
    <div className="mb-5 last:mb-0">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[14px] text-[#E0E0E0] font-medium">{label}</span>
        <span className="text-[14px] text-[#4ECDC4] font-mono font-bold min-w-[50px] text-right">
          {formattedValue}
          {unit}
        </span>
      </div>
      <div className="relative h-1 flex items-center">
        <div
          className="absolute left-0 h-1 rounded-full bg-[#6C63FF] pointer-events-none"
          style={{ width: `${percentage}%` }}
        />
        <div className="absolute left-0 right-0 h-1 rounded-full bg-[#3D3D5C] pointer-events-none" />
        <input
          type="range"
          min={range.min}
          max={range.max}
          step={range.step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-4 opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
        />
        <div
          className="absolute w-4 h-4 rounded-full bg-[#6C63FF] shadow-lg pointer-events-none transform -translate-x-1/2 transition-transform hover:scale-110"
          style={{ left: `${percentage}%` }}
        >
          <div className="absolute inset-1 rounded-full bg-white/20" />
        </div>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[11px] text-[#6B6B7B]">
          {range.min}
          {unit}
        </span>
        <span className="text-[11px] text-[#6B6B7B]">
          {range.max}
          {unit}
        </span>
      </div>
    </div>
  );
};
