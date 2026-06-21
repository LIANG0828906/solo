import { useState, memo } from 'react';
import { PRESET_GRADIENTS } from '../types';
import './BackgroundPicker.css';

interface BackgroundPickerProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
  particleEnabled: boolean;
  onParticleToggle: (enabled: boolean) => void;
  customColors: string[];
  onCustomColorsChange: (colors: string[]) => void;
  noiseIntensity: number;
  onNoiseIntensityChange: (intensity: number) => void;
  isCustomTexture: boolean;
  onCustomTextureToggle: (isCustom: boolean) => void;
}

const BackgroundPicker = memo(function BackgroundPicker({
  selectedIndex,
  onSelect,
  particleEnabled,
  onParticleToggle,
  customColors,
  onCustomColorsChange,
  noiseIntensity,
  onNoiseIntensityChange,
  isCustomTexture,
  onCustomTextureToggle,
}: BackgroundPickerProps) {
  const [showCustomPanel, setShowCustomPanel] = useState(false);

  const handlePresetClick = (index: number) => {
    onSelect(index);
    onCustomTextureToggle(false);
    setShowCustomPanel(false);
  };

  const handleCustomClick = () => {
    onCustomTextureToggle(true);
    setShowCustomPanel(!showCustomPanel);
  };

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...customColors];
    newColors[index] = color;
    onCustomColorsChange(newColors);
  };

  return (
    <div className="background-picker">
      <div className="picker-header">
        <span className="picker-label">背景样式</span>
        <button
          className={`particle-toggle ${particleEnabled ? 'active' : ''}`}
          onClick={() => onParticleToggle(!particleEnabled)}
        >
          <span className="toggle-dot" />
          粒子效果
        </button>
      </div>

      <div className="gradient-cards">
        {PRESET_GRADIENTS.map((colors, index) => (
          <button
            key={index}
            className={`gradient-card ${selectedIndex === index && !isCustomTexture ? 'selected' : ''}`}
            style={{
              background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
            }}
            onClick={() => handlePresetClick(index)}
            title={`预设 ${index + 1}`}
          />
        ))}

        <button
          className={`gradient-card custom-card ${isCustomTexture ? 'selected' : ''}`}
          onClick={handleCustomClick}
          title="自定义纹理"
        >
          <span className="custom-icon">🎨</span>
        </button>
      </div>

      {showCustomPanel && (
        <div className="custom-panel">
          <div className="color-pickers">
            <div className="color-item">
              <label>起始色</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={customColors[0]}
                  onChange={(e) => handleColorChange(0, e.target.value)}
                  className="color-input"
                />
                <span className="color-value">{customColors[0]}</span>
              </div>
            </div>
            <div className="color-item">
              <label>结束色</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={customColors[1]}
                  onChange={(e) => handleColorChange(1, e.target.value)}
                  className="color-input"
                />
                <span className="color-value">{customColors[1]}</span>
              </div>
            </div>
          </div>

          <div className="noise-slider-container">
            <label>
              噪声强度 <span className="slider-value">{Math.round(noiseIntensity * 100)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={noiseIntensity}
              onChange={(e) => onNoiseIntensityChange(parseFloat(e.target.value))}
              className="noise-slider"
            />
          </div>
        </div>
      )}
    </div>
  );
});

export default BackgroundPicker;
