import { useMemo } from 'react';
import { usePlantStore } from './store';
import { GROWTH_STAGES } from './PlantData';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  gradientColors: { start: string; mid?: string; end: string };
  onChange: (value: number) => void;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

function interpolateColor(colors: { start: string; mid?: string; end: string }, t: number): string {
  const clampedT = Math.max(0, Math.min(1, t));

  if (colors.mid && clampedT >= 0.5) {
    const t2 = (clampedT - 0.5) * 2;
    const c1 = hexToRgb(colors.mid);
    const c2 = hexToRgb(colors.end);
    return rgbToHex(
      c1.r + (c2.r - c1.r) * t2,
      c1.g + (c2.g - c1.g) * t2,
      c1.b + (c2.b - c1.b) * t2,
    );
  } else if (colors.mid) {
    const t2 = clampedT * 2;
    const c1 = hexToRgb(colors.start);
    const c2 = hexToRgb(colors.mid);
    return rgbToHex(
      c1.r + (c2.r - c1.r) * t2,
      c1.g + (c2.g - c1.g) * t2,
      c1.b + (c2.b - c1.b) * t2,
    );
  } else {
    const c1 = hexToRgb(colors.start);
    const c2 = hexToRgb(colors.end);
    return rgbToHex(
      c1.r + (c2.r - c1.r) * clampedT,
      c1.g + (c2.g - c1.g) * clampedT,
      c1.b + (c2.b - c1.b) * clampedT,
    );
  }
}

function Slider({ label, value, min, max, unit, gradientColors, onChange }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  const gradientStyle = useMemo(() => {
    const stops: string[] = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const color = interpolateColor(gradientColors, t);
      stops.push(`${color} ${t * 100}%`);
    }
    return `linear-gradient(to right, ${stops.join(', ')})`;
  }, [gradientColors]);

  const thumbColor = useMemo(() => {
    const t = (value - min) / (max - min);
    return interpolateColor(gradientColors, t);
  }, [value, min, max, gradientColors]);

  return (
    <div className="slider-container">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span
          className="slider-value"
          style={{
            color: thumbColor,
            textShadow: `0 0 8px ${thumbColor}40`,
          }}
        >
          {Math.round(value)}
          {unit}
        </span>
      </div>
      <div className="slider-track-wrapper">
        <div
          className="slider-track"
          style={{
            background: gradientStyle,
            opacity: 0.9,
          }}
        >
          <div
            className="slider-fill"
            style={{
              width: `${percentage}%`,
              background: gradientStyle,
              opacity: 1,
              boxShadow: `0 0 10px ${thumbColor}60`,
            }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider-input"
        />
        <div
          className="slider-thumb"
          style={{
            left: `calc(${percentage}% - 10px)`,
            background: `radial-gradient(circle at 30% 30%, #ffffff, ${thumbColor})`,
            boxShadow: `0 0 12px ${thumbColor}aa, 0 0 24px ${thumbColor}60, inset 0 0 6px rgba(255,255,255,0.5)`,
          }}
        />
      </div>
      <div className="slider-ticks">
        <span style={{ color: gradientColors.start, opacity: 0.7 }}>{min}{unit}</span>
        {gradientColors.mid && (
          <span style={{ color: gradientColors.mid, opacity: 0.7 }}>{Math.round((min + max) / 2)}{unit}</span>
        )}
        <span style={{ color: gradientColors.end, opacity: 0.7 }}>{max}{unit}</span>
      </div>
    </div>
  );
}

export default function ControlPanel() {
  const light = usePlantStore((state) => state.light);
  const water = usePlantStore((state) => state.water);
  const temperature = usePlantStore((state) => state.temperature);
  const isSimulating = usePlantStore((state) => state.isSimulating);
  const showStageLabel = usePlantStore((state) => state.showStageLabel);
  const currentStageName = usePlantStore((state) => state.currentStageName);
  const growthStage = usePlantStore((state) => state.growthStage);

  const setLight = usePlantStore((state) => state.setLight);
  const setWater = usePlantStore((state) => state.setWater);
  const setTemperature = usePlantStore((state) => state.setTemperature);
  const startGrowthSimulation = usePlantStore((state) => state.startGrowthSimulation);
  const resetEnvironment = usePlantStore((state) => state.resetEnvironment);
  const resetGrowth = usePlantStore((state) => state.resetGrowth);

  const handleReset = () => {
    resetEnvironment();
    resetGrowth();
  };

  const getProgressLabel = () => {
    if (growthStage < GROWTH_STAGES.seedling.threshold) return GROWTH_STAGES.seedling.label;
    if (growthStage < GROWTH_STAGES.growing.threshold) return GROWTH_STAGES.growing.label;
    return GROWTH_STAGES.mature.label;
  };

  const getProgressColor = () => {
    if (growthStage < GROWTH_STAGES.seedling.threshold) return '#4a9f4a';
    if (growthStage < GROWTH_STAGES.growing.threshold) return '#8fc14a';
    return '#ffd700';
  };

  return (
    <div className="control-panel">
      <h2 className="panel-title">环境控制</h2>

      <div className="sliders-section">
        <Slider
          label="光照"
          value={light}
          min={0}
          max={100}
          unit="%"
          gradientColors={{
            start: '#5a4a1a',
            mid: '#b8860b',
            end: '#fff8dc',
          }}
          onChange={setLight}
        />

        <Slider
          label="水分"
          value={water}
          min={0}
          max={100}
          unit="%"
          gradientColors={{
            start: '#4a3a2a',
            mid: '#1e90ff',
            end: '#00ffff',
          }}
          onChange={setWater}
        />

        <Slider
          label="温度"
          value={temperature}
          min={10}
          max={40}
          unit="°C"
          gradientColors={{
            start: '#4488ff',
            mid: '#88cc44',
            end: '#ff4444',
          }}
          onChange={setTemperature}
        />
      </div>

      <div className="growth-section">
        <h3 className="section-subtitle">生长模拟</h3>

        <button
          className="simulate-btn"
          onClick={startGrowthSimulation}
          disabled={isSimulating}
        >
          {isSimulating ? '模拟中...' : '模拟生长'}
        </button>

        {showStageLabel && (
          <div className="stage-label">
            <span
              className="stage-badge"
              style={{
                color: getProgressColor(),
                borderColor: `${getProgressColor()}60`,
                background: `${getProgressColor()}15`,
              }}
            >
              {currentStageName}
            </span>
          </div>
        )}

        {isSimulating && (
          <div className="growth-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${growthStage * 100}%`,
                  background: `linear-gradient(90deg, #4a9f4a, ${getProgressColor()})`,
                  boxShadow: `0 0 8px ${getProgressColor()}60`,
                }}
              />
            </div>
            <span
              className="progress-label"
              style={{ color: getProgressColor() }}
            >
              {getProgressLabel()} · {Math.round(growthStage * 100)}%
            </span>
          </div>
        )}
      </div>

      <button className="reset-btn" onClick={handleReset}>
        重置所有
      </button>
    </div>
  );
}
