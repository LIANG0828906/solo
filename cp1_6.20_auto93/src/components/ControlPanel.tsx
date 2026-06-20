import { useState } from 'react';
import { MaterialConfig, EnvironmentPreset } from '../types';
import './ControlPanel.css';

interface ControlPanelProps {
  materialConfig: MaterialConfig;
  envPreset: EnvironmentPreset;
  onMaterialChange: (config: MaterialConfig) => void;
  onEnvPresetChange: (preset: EnvironmentPreset) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const ENV_PRESETS: { id: EnvironmentPreset; name: string; color: string }[] = [
  { id: 'solid_gray', name: '纯色灰', color: '#2a2a3e' },
  { id: 'outdoor_hdr', name: '室外HDR', color: '#87ceeb' },
  { id: 'indoor_warm', name: '室内暖光', color: '#d4a574' },
  { id: 'starry_night', name: '星空夜景', color: '#0a0a2a' },
];

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

function SliderControl({ label, value, min, max, step, onChange }: SliderControlProps) {
  const handleMinus = () => {
    onChange(Math.max(min, value - step));
  };

  const handlePlus = () => {
    onChange(Math.min(max, value + step));
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="control-item">
      <div className="control-label-row">
        <span className="control-label">{label}</span>
        <div className="control-value-group">
          <button className="step-btn" onClick={handleMinus}>
            −
          </button>
          <span className="control-value">{value.toFixed(2)}</span>
          <button className="step-btn" onClick={handlePlus}>
            +
          </button>
        </div>
      </div>
      <div className="slider-container">
        <div className="slider-track">
          <div className="slider-fill" style={{ width: `${percentage}%` }} />
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
    </div>
  );
}

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSwitch({ label, checked, onChange }: ToggleSwitchProps) {
  return (
    <div className="control-item toggle-item">
      <span className="control-label">{label}</span>
      <button
        className={`toggle-switch ${checked ? 'active' : ''}`}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
      >
        <span className="toggle-thumb" />
      </button>
    </div>
  );
}

interface ColorPickerProps {
  color: string;
  opacity: number;
  onColorChange: (color: string) => void;
  onOpacityChange: (opacity: number) => void;
}

function ColorPicker({ color, opacity, onColorChange, onOpacityChange }: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="control-item">
      <div className="control-label-row">
        <span className="control-label">颜色</span>
        <span className="color-hex">{color.toUpperCase()}</span>
      </div>
      <div className="color-picker-row">
        <button
          className="color-preview"
          style={{ backgroundColor: color, opacity }}
          onClick={() => setShowPicker(!showPicker)}
        />
        <div className="color-swatches">
          {['#e94560', '#4e6ce5', '#b67eff', '#50c878', '#f5a623', '#e0e0e0', '#ffffff', '#1a1a2e'].map((c) => (
            <button
              key={c}
              className="color-swatch"
              style={{ backgroundColor: c }}
              onClick={() => onColorChange(c)}
              aria-label={`选择颜色 ${c}`}
            />
          ))}
        </div>
      </div>
      {showPicker && (
        <div className="hue-picker">
          <input
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            className="native-color-input"
          />
        </div>
      )}
      <div className="opacity-slider">
        <span className="opacity-label">透明度</span>
        <div className="slider-container">
          <div className="slider-track">
            <div
              className="slider-fill"
              style={{ width: `${opacity * 100}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={opacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            className="slider-input"
          />
        </div>
        <span className="opacity-value">{Math.round(opacity * 100)}%</span>
      </div>
    </div>
  );
}

export function ControlPanel({
  materialConfig,
  envPreset,
  onMaterialChange,
  onEnvPresetChange,
  isCollapsed,
  onToggleCollapse,
}: ControlPanelProps) {
  const handleMaterialUpdate = (key: keyof MaterialConfig, value: string | number | boolean) => {
    onMaterialChange({
      ...materialConfig,
      [key]: value,
    });
  };

  if (isCollapsed) {
    return (
      <button className="floating-panel-btn" onClick={onToggleCollapse}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="control-panel-container">
      <div className="control-panel-header">
        <h3 className="control-panel-title">材质设置</h3>
        <button className="close-btn" onClick={onToggleCollapse}>
          ×
        </button>
      </div>

      <div className="control-panel-content">
        <section className="control-section">
          <h4 className="section-title">外观</h4>
          <ColorPicker
            color={materialConfig.color}
            opacity={materialConfig.opacity}
            onColorChange={(c) => handleMaterialUpdate('color', c)}
            onOpacityChange={(o) => handleMaterialUpdate('opacity', o)}
          />
        </section>

        <section className="control-section">
          <h4 className="section-title">材质属性</h4>
          <SliderControl
            label="金属度"
            value={materialConfig.metalness}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => handleMaterialUpdate('metalness', v)}
          />
          <SliderControl
            label="粗糙度"
            value={materialConfig.roughness}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => handleMaterialUpdate('roughness', v)}
          />
          <SliderControl
            label="发光强度"
            value={materialConfig.emissiveIntensity}
            min={0}
            max={5}
            step={0.1}
            onChange={(v) => handleMaterialUpdate('emissiveIntensity', v)}
          />
        </section>

        <section className="control-section">
          <h4 className="section-title">环境</h4>
          <ToggleSwitch
            label="环境贴图"
            checked={materialConfig.useEnvMap}
            onChange={(v) => handleMaterialUpdate('useEnvMap', v)}
          />
          
          <div className="env-presets">
            <span className="control-label">背景预设</span>
            <div className="env-preset-grid">
              {ENV_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  className={`env-preset-btn ${envPreset === preset.id ? 'active' : ''}`}
                  onClick={() => onEnvPresetChange(preset.id)}
                >
                  <span
                    className="env-preset-color"
                    style={{ backgroundColor: preset.color }}
                  />
                  <span className="env-preset-name">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
