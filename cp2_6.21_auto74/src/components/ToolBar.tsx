import { useRef } from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';
import type { PresetType } from '@/utils/types';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

function Slider({ label, value, min, max, step, unit = '', onChange }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: '#d0d0e0', fontSize: '11px', fontWeight: 500 }}>{label}</span>
        <span
          style={{
            color: '#2a9df4',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 600,
          }}
        >
          {value.toFixed(step < 1 ? 2 : 0)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          height: '6px',
          borderRadius: '3px',
          background: `linear-gradient(to right, #2a9df4 0%, #6741d9 ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`,
          appearance: 'none',
          cursor: 'pointer',
          outline: 'none',
        }}
        onMouseDown={(e) => (e.currentTarget.style.opacity = '0.9')}
        onMouseUp={(e) => (e.currentTarget.style.opacity = '1')}
      />
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2a9df4, #6741d9);
          cursor: pointer;
          box-shadow: 0 0 12px rgba(42, 157, 244, 0.6);
          transition: box-shadow 0.2s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          box-shadow: 0 0 16px rgba(42, 157, 244, 0.8);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2a9df4, #6741d9);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 12px rgba(42, 157, 244, 0.6);
        }
      `}</style>
    </div>
  );
}

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

function Button({ children, onClick, variant = 'secondary', disabled = false }: ButtonProps) {
  const baseStyle = {
    padding: '8px 14px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '11px',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.5 : 1,
  };

  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #2a9df4, #6741d9)',
      color: '#ffffff',
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.1)',
      color: '#d0d0e0',
      border: '1px solid rgba(255, 255, 255, 0.15)',
    },
    danger: {
      background: 'rgba(255, 68, 68, 0.2)',
      color: '#ff4444',
      border: '1px solid rgba(255, 68, 68, 0.3)',
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...baseStyle, ...variantStyles[variant] } as React.CSSProperties}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          if (variant === 'secondary') {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          }
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        if (variant === 'secondary') {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }
      }}
    >
      {children}
    </button>
  );
}

const presets: { key: PresetType; label: string; icon: string }[] = [
  { key: 'binary', label: '双星系统', icon: '⚬⚭' },
  { key: 'three-body', label: '三体系统', icon: '☍' },
  { key: 'solar-system', label: '太阳系', icon: '☀' },
  { key: 'random-cluster', label: '随机星团', icon: '✧' },
];

export function ToolBar() {
  const { params, setParam, starFieldDensity, setStarFieldDensity, trajectoryLength, setTrajectoryLength } =
    useSimulationStore();
  const { togglePause, loadPreset, saveSnapshot, undo, exportState, importState, history, currentPreset } =
    useSimulationStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importState(file);
    }
    e.target.value = '';
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: '16px',
        right: '16px',
        bottom: '16px',
        height: '60px',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(107, 65, 217, 0.3)',
        borderRadius: '12px',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Button variant="primary" onClick={togglePause}>
          {params.paused ? '▶ 继续' : '⏸ 暂停'}
        </Button>
        <Button onClick={saveSnapshot}>💾 保存</Button>
        <Button onClick={undo} disabled={history.length === 0}>
          ↶ 回退 ({history.length})
        </Button>
        <Button onClick={exportState}>⬇ 导出</Button>
        <Button onClick={handleImport}>⬆ 导入</Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.1)' }} />

      <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
        <Slider
          label="引力常数 G"
          value={params.G}
          min={0.5}
          max={2.0}
          step={0.1}
          unit="x"
          onChange={(v) => setParam('G', v)}
        />
        <Slider
          label="模拟速度"
          value={params.speed}
          min={0.1}
          max={3.0}
          step={0.1}
          unit="x"
          onChange={(v) => setParam('speed', v)}
        />
        <Slider
          label="时间步长"
          value={params.dt}
          min={0.001}
          max={0.05}
          step={0.001}
          unit="s"
          onChange={(v) => setParam('dt', v)}
        />
        <Slider
          label="星场密度"
          value={starFieldDensity}
          min={0}
          max={200}
          step={1}
          onChange={setStarFieldDensity}
        />
        <Slider
          label="轨迹长度"
          value={trajectoryLength}
          min={50}
          max={500}
          step={10}
          onChange={setTrajectoryLength}
        />
      </div>

      <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.1)' }} />

      <div style={{ display: 'flex', gap: '6px' }}>
        {presets.map((preset) => (
          <Button
            key={preset.key}
            variant={currentPreset === preset.key ? 'primary' : 'secondary'}
            onClick={() => loadPreset(preset.key)}
          >
            {preset.icon} {preset.label}
          </Button>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '20px',
          fontSize: '10px',
          color: '#8888a0',
          fontFamily: 'monospace',
        }}
      >
        {params.paused ? '⏸ PAUSED' : '● RUNNING'}
      </div>
    </div>
  );
}
