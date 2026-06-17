import { useState } from 'react';
import { useStore } from '../store';
import type { ControlParams } from '../engine/types';

const sliderStyle: React.CSSProperties = {
  width: '100%',
  height: '48px',
  WebkitAppearance: 'none',
  appearance: 'none',
  background: 'transparent',
  cursor: 'pointer',
};

const sliderTrackStyle = `
  input[type="range"]::-webkit-slider-runnable-track {
    height: 4px;
    background: #2A2A3A;
    border-radius: 4px;
  }
  input[type="range"]::-moz-range-track {
    height: 4px;
    background: #2A2A3A;
    border-radius: 4px;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: #00D4AA;
    border-radius: 50%;
    cursor: pointer;
    margin-top: -8px;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 0 10px rgba(0, 212, 170, 0.5);
  }
  input[type="range"]::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: #00D4AA;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  input[type="range"]::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 0 10px rgba(0, 212, 170, 0.5);
  }
`;

const buttonStyle: React.CSSProperties = {
  width: '100%',
  height: '48px',
  backgroundColor: '#00D4AA',
  color: '#0A0A15',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const buttonHoverStyle: React.CSSProperties = {
  filter: 'brightness(1.15)',
};

const buttonActiveStyle: React.CSSProperties = {
  transform: 'scale(0.95)',
};

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}

function Slider({ label, value, min, max, step, unit, onChange }: SliderProps) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <label style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 500 }}>
          {label}
        </label>
        <span style={{ color: '#00D4AA', fontSize: '14px', fontWeight: 600 }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={sliderStyle}
      />
    </div>
  );
}

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const style: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: variant === 'primary' ? '#00D4AA' : '#2A2A3A',
    color: variant === 'primary' ? '#0A0A15' : '#FFFFFF',
    ...(isHovered ? buttonHoverStyle : {}),
    ...(isActive ? buttonActiveStyle : {}),
  };

  return (
    <button
      onClick={onClick}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsActive(false); }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
    >
      {children}
    </button>
  );
}

export default function ControlPanel() {
  const controlParams = useStore((state) => state.controlParams);
  const isPaused = useStore((state) => state.isPaused);
  const setControlParam = useStore((state) => state.setControlParam);
  const togglePause = useStore((state) => state.togglePause);
  const reset = useStore((state) => state.reset);
  const emitParticles = useStore((state) => state.emitParticles);
  const incrementEmittedCount = useStore((state) => state.incrementEmittedCount);

  const handleParamChange = <K extends keyof ControlParams>(key: K, value: ControlParams[K]) => {
    setControlParam(key, value);
  };

  const handleEmit = () => {
    emitParticles(100);
    incrementEmittedCount(100);
  };

  return (
    <>
      <style>{sliderTrackStyle}</style>
      <div
        style={{
          width: '320px',
          height: '100vh',
          backgroundColor: '#0A0A15CC',
          backdropFilter: 'blur(10px)',
          borderLeft: '1px solid #2A2A3A',
          padding: '20px',
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
      >
        <h1
          style={{
            color: '#FFFFFF',
            fontSize: '24px',
            fontWeight: 700,
            margin: '0 0 8px 0',
            letterSpacing: '-0.5px',
          }}
        >
          FluidSculpt
        </h1>
        <p
          style={{
            color: '#888899',
            fontSize: '13px',
            margin: '0 0 32px 0',
          }}
        >
          三维流体粒子雕塑系统
        </p>

        <Slider
          label="粒子数量"
          value={controlParams.particleCount}
          min={1000}
          max={10000}
          step={1000}
          unit=""
          onChange={(v) => handleParamChange('particleCount', v)}
        />

        <Slider
          label="噪声强度"
          value={controlParams.noiseStrength}
          min={0.05}
          max={0.8}
          step={0.05}
          unit=""
          onChange={(v) => handleParamChange('noiseStrength', v)}
        />

        <Slider
          label="粒子寿命"
          value={controlParams.particleLife}
          min={1}
          max={10}
          step={0.5}
          unit="s"
          onChange={(v) => handleParamChange('particleLife', v)}
        />

        <div style={{ marginBottom: '16px' }}>
          <Button onClick={handleEmit}>发射粒子</Button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <Button onClick={reset} variant="secondary">重置</Button>
        </div>

        <Button onClick={togglePause} variant="secondary">
          {isPaused ? '继续' : '暂停'}
        </Button>

        <div
          style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid #2A2A3A',
          }}
        >
          <h3
            style={{
              color: '#888899',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              margin: '0 0 16px 0',
            }}
          >
            操作提示
          </h3>
          <ul
            style={{
              color: '#666677',
              fontSize: '12px',
              lineHeight: 1.8,
              paddingLeft: '16px',
              margin: 0,
            }}
          >
            <li>拖拽场景旋转视角</li>
            <li>滚轮缩放视图</li>
            <li>点击场景发射100个粒子</li>
            <li>拖拽时持续发射粒子</li>
            <li>拖拽手势会影响粒子运动</li>
          </ul>
        </div>
      </div>
    </>
  );
}
