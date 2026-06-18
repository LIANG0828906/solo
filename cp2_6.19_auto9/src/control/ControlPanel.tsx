import { useState, useCallback } from 'react';
import { Shuffle, Save, Plus, Zap } from 'lucide-react';
import type { LightParams, BlinkPattern } from '../types';
import { LIGHT_COUNT } from '../types';
import { hslToHex } from '../utils/storage';
import clsx from 'clsx';

interface ControlPanelProps {
  lights: LightParams[];
  currentLightIndex: number;
  onLightChange: (index: number, params: Partial<LightParams>) => void;
  onRandomize: () => void;
  onAddKeyframe: () => void;
  onSave: () => void;
  onSelectLight: (index: number) => void;
  canAddKeyframe: boolean;
}

const patternLabels: Record<BlinkPattern, string> = {
  static: '常亮',
  breathing: '呼吸',
  strobe: '频闪',
  wave: '波浪',
};

const HueWheel = ({ hue, onChange }: { hue: number; onChange: (h: number) => void }) => {
  const size = 180;
  const radius = size / 2;
  const innerSize = size - 50;
  const isDragging = useRef(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      isDragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updateHue(e);
    },
    [onChange],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;
      updateHue(e);
    },
    [onChange],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      isDragging.current = false;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    },
    [],
  );

  const updateHue = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - radius;
    const y = e.clientY - rect.top - radius;
    const angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    const newHue = ((angle + 360) % 360);
    onChange(Math.round(newHue));
  };

  const indicatorAngle = (hue - 90) * (Math.PI / 180);
  const indicatorRadius = (size - 50) / 2 - 10;
  const indicatorX = radius + Math.cos(indicatorAngle) * indicatorRadius;
  const indicatorY = radius + Math.sin(indicatorAngle) * indicatorRadius;

  const conicGradient = Array.from({ length: 360 }, (_, i) => `hsl(${i}, 100%, 55%)`).join(', ');

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-sm text-gray-300 font-medium">色相选择</div>
      <div
        className="relative cursor-pointer select-none"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(from 0deg, ${conicGradient})`,
          borderRadius: '50%',
          boxShadow: '0 0 20px rgba(100, 150, 255, 0.2), inset 0 0 10px rgba(0,0,0,0.3)',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: innerSize,
            height: innerSize,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, #1a1a2e 0%, #0f0f1a 100%)',
            boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.5)',
          }}
        />
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-white pointer-events-none"
          style={{
            left: indicatorX - 8,
            top: indicatorY - 8,
            backgroundColor: hslToHex(hue, 100, 60),
            boxShadow: `0 0 10px ${hslToHex(hue, 100, 60)}, 0 0 20px rgba(255,255,255,0.3)`,
          }}
        />
      </div>
      <div className="text-xs text-gray-400">
        H: <span className="text-white font-mono">{Math.round(hue)}°</span>
      </div>
    </div>
  );
};

const Slider = ({
  label,
  value,
  min,
  max,
  onChange,
  unit = '',
  accentColor = '#4a9eff',
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  unit?: string;
  accentColor?: string;
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-300">{label}</span>
        <span className="text-sm font-mono text-white">
          {Math.round(value)}
          {unit}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-gray-700/50 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-75"
          style={{
            width: `${percentage}%`,
            backgroundColor: accentColor,
            boxShadow: `0 0 10px ${accentColor}`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
};

const LightSelector = ({
  count,
  selectedIndex,
  lights,
  onSelect,
}: {
  count: number;
  selectedIndex: number;
  lights: LightParams[];
  onSelect: (index: number) => void;
}) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-gray-300">灯光组选择</span>
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={clsx(
              'w-10 h-10 rounded-lg border-2 transition-all duration-200 flex items-center justify-center text-xs font-bold',
              selectedIndex === i
                ? 'scale-110 shadow-lg'
                : 'border-gray-600 hover:scale-105 hover:border-gray-400',
            )}
            style={{
              backgroundColor: hslToHex(lights[i].hue, lights[i].saturation, lights[i].brightness * 0.6),
              borderColor: selectedIndex === i ? '#fff' : undefined,
              color: lights[i].brightness > 50 ? '#000' : '#fff',
              boxShadow: selectedIndex === i
                ? `0 0 15px ${hslToHex(lights[i].hue, lights[i].saturation, 60)}`
                : undefined,
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

const PatternSelector = ({
  value,
  onChange,
}: {
  value: BlinkPattern;
  onChange: (pattern: BlinkPattern) => void;
}) => {
  const patterns: BlinkPattern[] = ['static', 'breathing', 'strobe', 'wave'];

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-gray-300">闪烁模式</span>
      <div className="grid grid-cols-4 gap-1.5">
        {patterns.map((pattern) => (
          <button
            key={pattern}
            onClick={() => onChange(pattern)}
            className={clsx(
              'py-2 px-1 text-xs rounded-md transition-all duration-200',
              value === pattern
                ? 'bg-blue-500/30 text-white border border-blue-400/50 shadow-lg shadow-blue-500/20'
                : 'bg-gray-700/30 text-gray-400 border border-gray-600/30 hover:bg-gray-600/30 hover:text-gray-200',
            )}
          >
            {patternLabels[pattern]}
          </button>
        ))}
      </div>
    </div>
  );
};

const GlassButton = ({
  children,
  onClick,
  variant = 'default',
  disabled = false,
  icon: Icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  disabled?: boolean;
  icon?: React.ElementType;
}) => {
  const variantStyles = {
    default: 'hover:bg-white/10 hover:shadow-lg hover:shadow-blue-500/10',
    primary: 'bg-blue-500/20 border-blue-400/30 hover:bg-blue-500/30 hover:shadow-lg hover:shadow-blue-500/30 text-blue-200',
    success: 'bg-emerald-500/20 border-emerald-400/30 hover:bg-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/30 text-emerald-200',
    warning: 'bg-amber-500/20 border-amber-400/30 hover:bg-amber-500/30 hover:shadow-lg hover:shadow-amber-500/30 text-amber-200',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl backdrop-blur-md',
        'border border-white/10 bg-white/5 text-gray-200 text-sm font-medium',
        'transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
        variantStyles[variant],
      )}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};

const ControlPanel = ({
  lights,
  currentLightIndex,
  onLightChange,
  onRandomize,
  onAddKeyframe,
  onSave,
  onSelectLight,
  canAddKeyframe,
}: ControlPanelProps) => {
  const currentLight = lights[currentLightIndex];
  const accentColor = hslToHex(currentLight.hue, currentLight.saturation, 60);

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="text-center mb-1">
        <h2 className="text-xl font-bold text-white mb-1">
          <Zap className="inline-block mr-2" size={20} style={{ color: accentColor }} />
          灯光控制台
        </h2>
        <p className="text-xs text-gray-400">实时控制舞台灯光效果</p>
      </div>

      <LightSelector
        count={LIGHT_COUNT}
        selectedIndex={currentLightIndex}
        lights={lights}
        onSelect={onSelectLight}
      />

      <div
        className="rounded-2xl p-4 backdrop-blur-md bg-white/5 border border-white/10"
        style={{ boxShadow: `0 0 30px ${accentColor}10` }}
      >
        <HueWheel
          hue={currentLight.hue}
          onChange={(h) => onLightChange(currentLightIndex, { hue: h })}
        />
      </div>

      <div className="flex flex-col gap-4">
        <Slider
          label="亮度"
          value={currentLight.brightness}
          min={0}
          max={100}
          onChange={(v) => onLightChange(currentLightIndex, { brightness: v })}
          unit="%"
          accentColor={accentColor}
        />

        <Slider
          label="饱和度"
          value={currentLight.saturation}
          min={0}
          max={100}
          onChange={(v) => onLightChange(currentLightIndex, { saturation: v })}
          unit="%"
          accentColor={accentColor}
        />

        <Slider
          label="闪烁速度"
          value={currentLight.patternSpeed}
          min={0.1}
          max={3}
          onChange={(v) => onLightChange(currentLightIndex, { patternSpeed: v })}
          unit="x"
          accentColor={accentColor}
        />
      </div>

      <PatternSelector
        value={currentLight.pattern}
        onChange={(p) => onLightChange(currentLightIndex, { pattern: p })}
      />

      <div className="flex flex-col gap-2.5 pt-2 border-t border-white/10">
        <GlassButton variant="primary" icon={Plus} onClick={onAddKeyframe} disabled={!canAddKeyframe}>
          添加关键帧
        </GlassButton>
        <div className="flex gap-2.5">
          <GlassButton variant="warning" icon={Shuffle} onClick={onRandomize}>
            随机
          </GlassButton>
          <GlassButton variant="success" icon={Save} onClick={onSave}>
            保存
          </GlassButton>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
