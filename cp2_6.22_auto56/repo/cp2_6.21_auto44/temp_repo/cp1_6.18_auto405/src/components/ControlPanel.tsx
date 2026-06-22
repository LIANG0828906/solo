import { useRef, useState, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import useGrowthStore from '@/store/useGrowthStore';
import { GrowthParams } from '@/types';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  startColor: string;
  endColor: string;
  onChange: (value: number) => void;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  startColor,
  endColor,
  onChange,
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;
  const gradient = `linear-gradient(90deg, ${startColor} 0%, ${endColor} 100%)`;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newValue = min + percentage * (max - min);
    onChange(Math.round(newValue / step) * step);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-[14px] text-white font-medium">{label}</label>
        <span className="text-[14px] text-white/70 font-mono">
          {value.toFixed(1)}
        </span>
      </div>
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative h-[4px] rounded-[2px] cursor-pointer"
        style={{
          background: `${gradient}`,
          opacity: 0.3,
        }}
      >
        <div
          className="absolute h-[4px] rounded-[2px] left-0 top-0"
          style={{
            width: `${percentage}%`,
            background: gradient,
            opacity: 1,
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-[16px] h-[16px] rounded-full cursor-grab active:cursor-grabbing shadow-lg transition-transform hover:scale-110"
          style={{
            left: `calc(${percentage}% - 8px)`,
            background: `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`,
          }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleInputChange}
        className="absolute opacity-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  );
}

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[14px] text-white font-medium">{label}</label>
      <button
        onClick={handleClick}
        className="h-[32px] rounded-lg border border-white/20 overflow-hidden transition-all hover:border-white/40 hover:scale-[1.02]"
        style={{ backgroundColor: value }}
      >
        <div className="w-full h-full backdrop-blur-sm bg-white/5" />
      </button>
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={handleChange}
        className="absolute opacity-0 pointer-events-none"
      />
    </div>
  );
}

export default function ControlPanel() {
  const { params, setParams, reset, seeds, totalParticles } = useGrowthStore();

  const handleGrowthSpeedChange = useCallback(
    (value: number) => {
      setParams({ growthSpeed: value });
    },
    [setParams]
  );

  const handleBranchDensityChange = useCallback(
    (value: number) => {
      setParams({ branchDensity: value });
    },
    [setParams]
  );

  const handleStartColorChange = useCallback(
    (color: string) => {
      setParams({ startColor: color });
    },
    [setParams]
  );

  const handleEndColorChange = useCallback(
    (color: string) => {
      setParams({ endColor: color });
    },
    [setParams]
  );

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  return (
    <div
      className="fixed right-6 bottom-6 w-[280px] rounded-[12px] p-5 space-y-5 backdrop-blur-xl border shadow-2xl"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderColor: 'rgba(255, 255, 255, 0.12)',
      }}
    >
      <div className="space-y-1">
        <h2 className="text-[16px] font-bold text-white tracking-wide">
          有机生长控制
        </h2>
        <div className="flex gap-3 text-[11px] text-white/50">
          <span>种子: {seeds.filter(s => s.status !== 'fading').length}/10</span>
          <span>粒子: {totalParticles}</span>
        </div>
      </div>

      <div className="h-px bg-white/10" />

      <div className="space-y-3">
        <Slider
          label="生长速度"
          value={params.growthSpeed}
          min={0.1}
          max={5}
          step={0.1}
          startColor={params.startColor}
          endColor={params.endColor}
          onChange={handleGrowthSpeedChange}
        />

        <Slider
          label="分支密度"
          value={params.branchDensity}
          min={1}
          max={8}
          step={1}
          startColor={params.startColor}
          endColor={params.endColor}
          onChange={handleBranchDensityChange}
        />
      </div>

      <div className="h-px bg-white/10" />

      <div className="grid grid-cols-2 gap-3">
        <ColorPicker
          label="起始颜色"
          value={params.startColor}
          onChange={handleStartColorChange}
        />
        <ColorPicker
          label="结束颜色"
          value={params.endColor}
          onChange={handleEndColorChange}
        />
      </div>

      <div className="h-px bg-white/10" />

      <button
        onClick={handleReset}
        className="w-full h-[40px] rounded-lg flex items-center justify-center gap-2 text-[14px] font-medium text-white transition-all hover:bg-white/10 active:scale-[0.98] border border-white/10 hover:border-white/20"
      >
        <RotateCcw size={16} />
        <span>重置场景</span>
      </button>

      <div className="text-[11px] text-white/40 text-center leading-relaxed">
        点击场景播种种子
        <br />
        鼠标拖拽旋转视角，滚轮缩放
      </div>
    </div>
  );
}
