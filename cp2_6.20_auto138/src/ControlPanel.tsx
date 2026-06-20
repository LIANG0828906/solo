import { usePlantStore } from './store';
import { GROWTH_STAGES } from './PlantData';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  gradientFrom: string;
  gradientTo: string;
  onChange: (value: number) => void;
}

function Slider({ label, value, min, max, unit, gradientFrom, gradientTo, onChange }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="slider-container">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">
          {Math.round(value)}
          {unit}
        </span>
      </div>
      <div className="slider-track-wrapper">
        <div
          className="slider-track"
          style={{
            background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`,
          }}
        >
          <div
            className="slider-fill"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`,
              opacity: 0.8,
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
            background: `radial-gradient(circle, ${gradientTo}, ${gradientFrom})`,
            boxShadow: `0 0 12px ${gradientTo}80, 0 0 24px ${gradientFrom}40`,
          }}
        />
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
          gradientFrom="#ffd700"
          gradientTo="#ffffff"
          onChange={setLight}
        />

        <Slider
          label="水分"
          value={water}
          min={0}
          max={100}
          unit="%"
          gradientFrom="#1e90ff"
          gradientTo="#00ffff"
          onChange={setWater}
        />

        <Slider
          label="温度"
          value={temperature}
          min={10}
          max={40}
          unit="°C"
          gradientFrom="#ff4444"
          gradientTo="#4488ff"
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
            <span className="stage-badge">{currentStageName}</span>
          </div>
        )}

        {isSimulating && (
          <div className="growth-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${growthStage * 100}%` }}
              />
            </div>
            <span className="progress-label">{getProgressLabel()}</span>
          </div>
        )}
      </div>

      <button className="reset-btn" onClick={handleReset}>
        重置所有
      </button>
    </div>
  );
}
