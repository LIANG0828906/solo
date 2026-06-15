import { useEffect, useRef } from 'react';
import type { HSLColor } from '@/types';
import { hslToString } from '@/utils/hsl';

interface HSLPickerProps {
  value: HSLColor;
  onChange: (color: HSLColor) => void;
  compact?: boolean;
}

export function HSLPicker({ value, onChange, compact = false }: HSLPickerProps) {
  const hueRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hueRef.current) {
      hueRef.current.style.background =
        'linear-gradient(to right, hsl(0, 80%, 50%), hsl(60, 80%, 50%), hsl(120, 80%, 50%), hsl(180, 80%, 50%), hsl(240, 80%, 50%), hsl(300, 80%, 50%), hsl(360, 80%, 50%))';
    }
  }, []);

  const handleChange = (key: keyof HSLColor, val: number) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className={`space-y-${compact ? '2' : '3'}`}>
      {!compact && (
        <div
          className="w-full h-12 rounded-xl mb-2 border border-cyan-500/20"
          style={{
            background: hslToString(value),
            boxShadow: `0 0 30px ${hslToString(value)}40`,
          }}
        />
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-cyan-300/60 w-6">H</span>
          <input
            ref={hueRef}
            type="range"
            min="0"
            max="360"
            value={value.h}
            onChange={(e) => handleChange('h', Number(e.target.value))}
            className="hsl-slider flex-1"
          />
          <span className="text-xs font-mono-sans text-white w-10 text-right">
            {value.h}°
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-cyan-300/60 w-6">S</span>
          <input
            type="range"
            min="0"
            max="100"
            value={value.s}
            onChange={(e) => handleChange('s', Number(e.target.value))}
            className="hsl-slider flex-1"
            style={{
              background: `linear-gradient(to right, hsl(${value.h}, 0%, 50%), hsl(${value.h}, 100%, 50%))`,
            }}
          />
          <span className="text-xs font-mono-sans text-white w-10 text-right">
            {value.s}%
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-cyan-300/60 w-6">L</span>
          <input
            type="range"
            min="10"
            max="90"
            value={value.l}
            onChange={(e) => handleChange('l', Number(e.target.value))}
            className="hsl-slider flex-1"
            style={{
              background: `linear-gradient(to right, hsl(${value.h}, ${value.s}%, 10%), hsl(${value.h}, ${value.s}%, 50%), hsl(${value.h}, ${value.s}%, 90%))`,
            }}
          />
          <span className="text-xs font-mono-sans text-white w-10 text-right">
            {value.l}%
          </span>
        </div>
      </div>
    </div>
  );
}
