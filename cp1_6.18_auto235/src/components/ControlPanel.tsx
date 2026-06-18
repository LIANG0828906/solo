import React from 'react';
import { useAppStore, ColorTheme } from '@/store/appStore';

const THEME_OPTIONS: { key: ColorTheme; label: string; colors: string[] }[] = [
  { key: 'cool', label: '冷光蓝紫', colors: ['#00D2FF', '#3A7BD5'] },
  { key: 'warm', label: '暖光红金', colors: ['#FF6B6B', '#FFD700'] },
  { key: 'nature', label: '自然绿银', colors: ['#00FF88', '#C0C0C0'] },
];

export const ControlPanel: React.FC = () => {
  const rotationSpeed = useAppStore((s) => s.rotationSpeed);
  const glowIntensity = useAppStore((s) => s.glowIntensity);
  const colorTheme = useAppStore((s) => s.colorTheme);
  const isGenerated = useAppStore((s) => s.isGenerated);

  const setRotationSpeed = useAppStore((s) => s.setRotationSpeed);
  const setGlowIntensity = useAppStore((s) => s.setGlowIntensity);
  const setColorTheme = useAppStore((s) => s.setColorTheme);

  return (
    <div className="control-panel">
      <h3 className="panel-title">交互控制</h3>

      <div className="control-group">
        <div className="control-label">
          <span>旋转速度</span>
          <span className="control-value">{rotationSpeed.toFixed(4)} rad/s</span>
        </div>
        <input
          type="range"
          min="0"
          max="0.02"
          step="0.0005"
          value={rotationSpeed}
          onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
          className="slider"
          disabled={!isGenerated}
        />
      </div>

      <div className="control-group">
        <div className="control-label">
          <span>发光强度</span>
          <span className="control-value">{glowIntensity.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={glowIntensity}
          onChange={(e) => setGlowIntensity(parseFloat(e.target.value))}
          className="slider"
          disabled={!isGenerated}
        />
      </div>

      <div className="control-group">
        <div className="control-label">
          <span>颜色主题</span>
        </div>
        <div className="theme-options">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              className={`theme-btn ${colorTheme === opt.key ? 'active' : ''}`}
              onClick={() => setColorTheme(opt.key)}
              disabled={!isGenerated}
            >
              <div className="theme-preview">
                <div
                  className="theme-color"
                  style={{ background: `linear-gradient(90deg, ${opt.colors[0]}, ${opt.colors[1]})` }}
                />
              </div>
              <span className="theme-label">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {!isGenerated && (
        <div className="panel-hint">请先在左侧绘制轮廓并点击"生成"按钮</div>
      )}
    </div>
  );
};
