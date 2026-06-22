import { useCallback } from 'react';
import type { Color } from '@/types';
import { cn } from '@/lib/utils';

interface HSLSlidersProps {
  color: Color;
  onChange: (h: number, s: number, l: number) => void;
  disabled?: boolean;
}

const sliderBaseClass = cn(
  'w-full h-3 rounded-full appearance-none cursor-pointer',
  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c5cfc]',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'transition-shadow'
);

function hueBackground(h: number) {
  return `linear-gradient(to right,
    hsl(0, 100%, 50%) 0%,
    hsl(60, 100%, 50%) 16.67%,
    hsl(120, 100%, 50%) 33.33%,
    hsl(180, 100%, 50%) 50%,
    hsl(240, 100%, 50%) 66.67%,
    hsl(300, 100%, 50%) 83.33%,
    hsl(360, 100%, 50%) 100%
  )`;
}

export default function HSLSliders({ color, onChange, disabled = false }: HSLSlidersProps) {
  const { h, s, l } = color.hsl;

  const handleHueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value), s, l);
    },
    [onChange, s, l]
  );

  const handleSaturationChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(h, Number(e.target.value), l);
    },
    [onChange, h, l]
  );

  const handleLightnessChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(h, s, Number(e.target.value));
    },
    [onChange, h, s]
  );

  return (
    <div className="space-y-5 w-full">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            色相 (H)
          </label>
          <span className="text-sm font-mono text-gray-500 dark:text-gray-400 tabular-nums w-14 text-right">
            {h}°
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={360}
          value={h}
          onChange={handleHueChange}
          disabled={disabled}
          className={sliderBaseClass}
          style={{
            background: hueBackground(h)
          }}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            饱和度 (S)
          </label>
          <span className="text-sm font-mono text-gray-500 dark:text-gray-400 tabular-nums w-14 text-right">
            {s}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={s}
          onChange={handleSaturationChange}
          disabled={disabled}
          className={sliderBaseClass}
          style={{
            background: `linear-gradient(to right, hsl(${h}, 0%, ${l}%), hsl(${h}, 100%, ${l}%))`
          }}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            明度 (L)
          </label>
          <span className="text-sm font-mono text-gray-500 dark:text-gray-400 tabular-nums w-14 text-right">
            {l}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={l}
          onChange={handleLightnessChange}
          disabled={disabled}
          className={sliderBaseClass}
          style={{
            background: `linear-gradient(to right, hsl(${h}, ${s}%, 0%), hsl(${h}, ${s}%, 50%), hsl(${h}, ${s}%, 100%))`
          }}
        />
      </div>
    </div>
  );
}
