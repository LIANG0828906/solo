import React from 'react';
import { DisplayMode } from '../scene/SceneManager';
import { SpectralType, SPECTRAL_COLORS } from '../scene/StarData';

interface ControlPanelProps {
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  magnitudeRange: [number, number];
  onMagnitudeRangeChange: (range: [number, number]) => void;
  spectralFilters: SpectralType[];
  onSpectralFilterChange: (filters: SpectralType[]) => void;
}

const displayModes: { value: DisplayMode; label: string }[] = [
  { value: 'stars-only', label: '仅恒星' },
  { value: 'stars-constellations', label: '恒星+连线' },
  { value: 'stars-nebula', label: '恒星+星云' },
  { value: 'full', label: '完整模式' },
];

const spectralTypes: SpectralType[] = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];

const ControlPanel: React.FC<ControlPanelProps> = ({
  displayMode,
  onDisplayModeChange,
  magnitudeRange,
  onMagnitudeRangeChange,
  spectralFilters,
  onSpectralFilterChange,
}) => {
  const handleSpectralToggle = (type: SpectralType) => {
    if (spectralFilters.includes(type)) {
      onSpectralFilterChange(spectralFilters.filter(t => t !== type));
    } else {
      onSpectralFilterChange([...spectralFilters, type]);
    }
  };

  const handleMinMagnitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const min = parseFloat(e.target.value);
    const max = magnitudeRange[1];
    if (min <= max) {
      onMagnitudeRangeChange([min, max]);
    }
  };

  const handleMaxMagnitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const min = magnitudeRange[0];
    const max = parseFloat(e.target.value);
    if (max >= min) {
      onMagnitudeRangeChange([min, max]);
    }
  };

  return (
    <div className="control-panel">
      <h3>显示控制</h3>

      <div className="control-section">
        <span className="control-label">显示模式</span>
        <div className="mode-buttons">
          {displayModes.map(mode => (
            <button
              key={mode.value}
              className={`capsule-btn ${displayMode === mode.value ? 'active' : ''}`}
              onClick={() => onDisplayModeChange(mode.value)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="control-section">
        <span className="control-label">视星等范围</span>
        <div className="slider-container">
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={magnitudeRange[0]}
            onChange={handleMinMagnitudeChange}
          />
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={magnitudeRange[1]}
            onChange={handleMaxMagnitudeChange}
          />
          <div className="slider-values">
            <span>{magnitudeRange[0].toFixed(1)}</span>
            <span>{magnitudeRange[1].toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="control-section">
        <span className="control-label">光谱类型</span>
        <div className="spectral-checkboxes">
          {spectralTypes.map(type => (
            <label key={type} className="spectral-checkbox">
              <input
                type="checkbox"
                checked={spectralFilters.includes(type)}
                onChange={() => handleSpectralToggle(type)}
              />
              <span
                className="spectral-color"
                style={{ backgroundColor: SPECTRAL_COLORS[type] }}
              />
              <span>{type}型</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
