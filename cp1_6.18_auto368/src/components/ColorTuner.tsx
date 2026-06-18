import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getGradientStyle, hslToHex } from '@/utils/colors';

export const ColorTuner: React.FC = () => {
  const colorSchemes = useAppStore((state) => state.colorSchemes);
  const currentScheme = useAppStore((state) => state.currentScheme);
  const setColorScheme = useAppStore((state) => state.setColorScheme);
  const setCustomColors = useAppStore((state) => state.setCustomColors);

  const [customPrimary, setCustomPrimary] = useState(currentScheme.primary);
  const [customSecondary, setCustomSecondary] = useState(currentScheme.secondary);
  const [hue, setHue] = useState(200);

  const handlePresetClick = (scheme: typeof colorSchemes[0]) => {
    setColorScheme(scheme);
    setCustomPrimary(scheme.primary);
    setCustomSecondary(scheme.secondary);
  };

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = parseInt(e.target.value);
    setHue(newHue);
    const primary = hslToHex(newHue, 70, 40);
    const secondary = hslToHex(newHue, 30, 85);
    setCustomPrimary(primary);
    setCustomSecondary(secondary);
  };

  const applyCustomColors = () => {
    setCustomColors(customPrimary, customSecondary);
  };

  const handlePrimaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPrimary(e.target.value);
  };

  const handleSecondaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomSecondary(e.target.value);
  };

  return (
    <div className="color-tuner">
      <h3 className="section-title">🎨 配色方案</h3>

      <div className="preset-themes">
        <h4 className="subsection-title">预设主题</h4>
        <div className="themes-grid">
          {colorSchemes.map((scheme) => (
            <button
              key={scheme.id}
              type="button"
              className={`theme-swatch ${currentScheme.id === scheme.id ? 'active' : ''}`}
              onClick={() => handlePresetClick(scheme)}
              title={scheme.name}
            >
              <div
                className="theme-gradient"
                style={{ background: getGradientStyle(scheme.primary, scheme.secondary) }}
              />
              <span className="theme-name">{scheme.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="custom-colors">
        <h4 className="subsection-title">自定义配色</h4>

        <div className="color-picker-section">
          <label className="picker-label">色环拾色器</label>
          <input
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={handleHueChange}
            className="hue-slider"
          />
          <div
            className="hue-gradient"
            style={{
              background: 'linear-gradient(to right, hsl(0,70%,50%), hsl(60,70%,50%), hsl(120,70%,50%), hsl(180,70%,50%), hsl(240,70%,50%), hsl(300,70%,50%), hsl(360,70%,50%))',
            }}
          />
        </div>

        <div className="color-inputs">
          <div className="color-input-group">
            <label>主色</label>
            <div className="color-input-row">
              <input
                type="color"
                value={customPrimary}
                onChange={handlePrimaryChange}
                className="color-picker"
              />
              <input
                type="text"
                value={customPrimary}
                onChange={handlePrimaryChange}
                className="color-text"
              />
            </div>
          </div>
          <div className="color-input-group">
            <label>辅色</label>
            <div className="color-input-row">
              <input
                type="color"
                value={customSecondary}
                onChange={handleSecondaryChange}
                className="color-picker"
              />
              <input
                type="text"
                value={customSecondary}
                onChange={handleSecondaryChange}
                className="color-text"
              />
            </div>
          </div>
        </div>

        <div className="preview-section">
          <span>预览</span>
          <div
            className="preview-gradient"
            style={{ background: getGradientStyle(customPrimary, customSecondary) }}
          />
        </div>

        <button type="button" className="apply-btn" onClick={applyCustomColors}>
          应用自定义配色
        </button>
      </div>

      <div className="current-scheme">
        <h4 className="subsection-title">当前配色</h4>
        <div className="scheme-info">
          <span className="scheme-name">{currentScheme.name}</span>
          <div className="scheme-colors">
            <div
              className="color-dot"
              style={{ backgroundColor: currentScheme.primary }}
            />
            <span>{currentScheme.primary}</span>
            <div
              className="color-dot"
              style={{ backgroundColor: currentScheme.secondary }}
            />
            <span>{currentScheme.secondary}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
