import { COLOR_THEMES, WAVEFORM_INFO } from './types';
import type { WaveformType, ColorTheme } from './types';

interface ControlPanelProps {
  waveform: WaveformType;
  speed: number;
  themeId: string;
  particleCount: number;
  fps: number;
  onWaveformChange: (w: WaveformType) => void;
  onSpeedChange: (s: number) => void;
  onThemeChange: (t: ColorTheme) => void;
  onPreviewWaveform: (w: WaveformType) => void;
}

export function ControlPanel({
  waveform,
  speed,
  themeId,
  particleCount,
  fps,
  onWaveformChange,
  onSpeedChange,
  onThemeChange,
  onPreviewWaveform,
}: ControlPanelProps) {
  const currentTheme = COLOR_THEMES.find((t) => t.id === themeId) || COLOR_THEMES[0];

  return (
    <div className="control-panel">
      <div>
        <h1 className="panel-title">色彩交响曲</h1>
        <p className="panel-subtitle">点击或拖拽画布，创造你的视觉音乐</p>
      </div>

      <div className="panel-section">
        <label className="section-label">波形选择</label>
        <div className="waveform-grid">
          {WAVEFORM_INFO.map((info) => (
            <div
              key={info.type}
              className={`waveform-btn ${waveform === info.type ? 'active' : ''}`}
              onClick={() => onWaveformChange(info.type)}
              role="button"
              tabIndex={0}
            >
              <span className="waveform-icon">{info.icon}</span>
              <span className="waveform-label">{info.label}</span>
              <span
                className="waveform-preview"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreviewWaveform(info.type);
                }}
                role="button"
                tabIndex={0}
                title="预览音效"
              >
                ▶
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <div className="slider-container">
          <div className="slider-header">
            <label className="section-label">播放速度</label>
            <span className="slider-value">{speed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          />
        </div>
      </div>

      <div className="panel-section">
        <label className="section-label">配色主题</label>
        <select
          className="theme-select"
          value={themeId}
          onChange={(e) => {
            const theme = COLOR_THEMES.find((t) => t.id === e.target.value);
            if (theme) onThemeChange(theme);
          }}
        >
          {COLOR_THEMES.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name}
            </option>
          ))}
        </select>
        <div className="theme-preview">
          {currentTheme.colors.map((color, i) => (
            <div
              key={i}
              className="theme-color"
              style={{ background: color, color }}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-value">{particleCount}</span>
          <span className="stat-label">粒子</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{fps}</span>
          <span className="stat-label">FPS</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{200}</span>
          <span className="stat-label">上限</span>
        </div>
      </div>
    </div>
  );
}
