import React from 'react';
import { motion } from 'framer-motion';
import { useTerrainStore, DATA_SOURCES } from '../store/useTerrainStore';
import './ControlPanel.css';

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({
  checked,
  onChange,
  label,
}) => (
  <div className="control-row">
    <span className="control-label">{label}</span>
    <motion.button
      className={`toggle-switch ${checked ? 'active' : ''}`}
      onClick={() => onChange(!checked)}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      aria-pressed={checked}
    >
      <motion.div
        className="toggle-knob"
        animate={{ x: checked ? 22 : 2 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      />
    </motion.button>
  </div>
);

const SliderControl: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step, unit = '', onChange }) => (
  <div className="control-row column">
    <div className="slider-header">
      <span className="control-label">{label}</span>
      <span className="control-value">
        {value.toFixed(step < 1 ? 1 : 0)}
        {unit}
      </span>
    </div>
    <motion.input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="custom-slider"
      whileTap={{ scale: 1.02 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    />
  </div>
);

const ControlPanel: React.FC = () => {
  const elevation = useTerrainStore((s) => s.elevation);
  const scale = useTerrainStore((s) => s.scale);
  const heatmapOpacity = useTerrainStore((s) => s.heatmapOpacity);
  const dataSourceIndex = useTerrainStore((s) => s.dataSourceIndex);
  const showContour = useTerrainStore((s) => s.showContour);
  const autoRotate = useTerrainStore((s) => s.autoRotate);

  const setElevation = useTerrainStore((s) => s.setElevation);
  const setScale = useTerrainStore((s) => s.setScale);
  const setHeatmapOpacity = useTerrainStore((s) => s.setHeatmapOpacity);
  const setDataSourceIndex = useTerrainStore((s) => s.setDataSourceIndex);
  const setShowContour = useTerrainStore((s) => s.setShowContour);
  const setAutoRotate = useTerrainStore((s) => s.setAutoRotate);

  return (
    <motion.div
      className="control-panel"
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <motion.h2
        className="panel-title"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        控制面板
      </motion.h2>

      <motion.div
        className="control-row column"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <span className="control-label">数据源</span>
        <select
          className="data-source-select"
          value={dataSourceIndex}
          onChange={(e) => setDataSourceIndex(parseInt(e.target.value))}
        >
          {DATA_SOURCES.map((ds, i) => (
            <option key={ds.key} value={i}>
              {ds.name}（{ds.min}-{ds.max}{ds.unit}）
            </option>
          ))}
        </select>
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <SliderControl
          label="地形起伏强度"
          value={elevation}
          min={0.0}
          max={3.0}
          step={0.1}
          onChange={setElevation}
        />
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <SliderControl
          label="地形缩放"
          value={scale}
          min={0.5}
          max={2.0}
          step={0.1}
          unit="×"
          onChange={setScale}
        />
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <SliderControl
          label="热力图透明度"
          value={heatmapOpacity}
          min={0.0}
          max={1.0}
          step={0.05}
          unit=""
          onChange={setHeatmapOpacity}
        />
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.35 }}
      >
        <ToggleSwitch
          label="显示等高线"
          checked={showContour}
          onChange={setShowContour}
        />
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <ToggleSwitch
          label="视角自动旋转"
          checked={autoRotate}
          onChange={setAutoRotate}
        />
      </motion.div>
    </motion.div>
  );
};

export default ControlPanel;
