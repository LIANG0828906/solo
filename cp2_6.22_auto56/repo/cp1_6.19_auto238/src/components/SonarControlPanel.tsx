import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import './SonarControlPanel.css';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  ticks?: number[];
}

const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  ticks,
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="slider-container">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <motion.span
          className="slider-value"
          key={value}
          initial={{ opacity: 0.5, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {value.toFixed(step < 1 ? 1 : 0)} {unit}
        </motion.span>
      </div>
      <div className="slider-track-wrapper">
        <div className="slider-track">
          <motion.div
            className="slider-fill"
            style={{ width: `${percentage}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="slider-input"
        />
      </div>
      {ticks && (
        <div className="slider-ticks">
          {ticks.map((tick) => (
            <div key={tick} className="tick-mark" />
          ))}
        </div>
      )}
    </div>
  );
};

export const SonarControlPanel: React.FC = () => {
  const { params, setParams } = useStore();

  const frequencyTicks = [10, 50, 100, 150, 200];
  const angleTicks = [30, 60, 90, 120];
  const pulseTicks = [0.1, 0.5, 1.0, 1.5, 2.0];

  return (
    <motion.div
      className="sonar-control-panel"
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h2 className="panel-title">声呐控制</h2>
      <p className="panel-subtitle">调整参数观察水下探测效果</p>

      <div className="sliders-container">
        <Slider
          label="发射频率"
          value={params.frequency}
          min={10}
          max={200}
          step={1}
          unit="kHz"
          onChange={(v) => setParams({ frequency: v })}
          ticks={frequencyTicks}
        />

        <Slider
          label="扫描角度"
          value={params.scanAngle}
          min={30}
          max={120}
          step={1}
          unit="°"
          onChange={(v) => setParams({ scanAngle: v })}
          ticks={angleTicks}
        />

        <Slider
          label="脉冲宽度"
          value={params.pulseWidth}
          min={0.1}
          max={2.0}
          step={0.1}
          unit="ms"
          onChange={(v) => setParams({ pulseWidth: v })}
          ticks={pulseTicks}
        />
      </div>

      <div className="status-info">
        <div className="status-item">
          <span className="status-label">波束范围</span>
          <span className="status-value">{params.scanAngle}°</span>
        </div>
        <div className="status-item">
          <span className="status-label">脉冲周期</span>
          <span className="status-value">
            {(1000 / (params.frequency / 50)).toFixed(1)} ms
          </span>
        </div>
      </div>
    </motion.div>
  );
};
