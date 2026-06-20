import React, { useState } from 'react';
import './UIControls.css';

const seasons = [
  { id: 'spring', name: '春', icon: '🌸', color: '#4ade80' },
  { id: 'summer', name: '夏', icon: '☀️', color: '#60a5fa' },
  { id: 'autumn', name: '秋', icon: '🍂', color: '#fb923c' },
  { id: 'winter', name: '冬', icon: '❄️', color: '#f0f4f8' }
];

const weathers = [
  { id: 'sunny', name: '晴', icon: '☀️' },
  { id: 'cloudy', name: '多云', icon: '⛅' },
  { id: 'rainy', name: '雨', icon: '🌧️' },
  { id: 'foggy', name: '雾', icon: '🌫️' }
];

const formatTime = (t) => {
  const hours = Math.floor(t);
  const minutes = Math.floor((t % 1) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const UIControls = ({
  time,
  season,
  weather,
  onTimeChange,
  onSeasonChange,
  onWeatherChange,
  presets,
  onSavePreset,
  onLoadPreset
}) => {
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDesc, setPresetDesc] = useState('');

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    onSavePreset({
      name: presetName,
      description: presetDesc,
      time,
      season,
      weather
    });
    setPresetName('');
    setPresetDesc('');
    setShowPresets(false);
  };

  return (
    <div className="ui-controls">
      <div className="controls-section time-section">
        <div className="section-label">时间</div>
        <div className="time-display">{formatTime(time)}</div>
        <div className="slider-container">
          <div className="slider-gradient-track" />
          <input
            type="range"
            min="0"
            max="24"
            step="0.1"
            value={time}
            onChange={(e) => onTimeChange(parseFloat(e.target.value))}
            className="time-slider"
          />
        </div>
        <div className="time-markers">
          <span>00</span>
          <span>06</span>
          <span>12</span>
          <span>18</span>
          <span>24</span>
        </div>
      </div>

      <div className="controls-section season-section">
        <div className="section-label">季节</div>
        <div className="season-buttons">
          {seasons.map((s) => (
            <button
              key={s.id}
              className={`season-btn ${season === s.id ? 'active' : ''}`}
              style={{ '--season-color': s.color }}
              onClick={() => onSeasonChange(s.id)}
              title={s.name}
            >
              <span className="season-icon">{s.icon}</span>
              <span className="season-name">{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="controls-section weather-section">
        <div className="section-label">天气</div>
        <div className="weather-buttons">
          {weathers.map((w) => (
            <button
              key={w.id}
              className={`weather-btn ${weather === w.id ? 'active' : ''}`}
              onClick={() => onWeatherChange(w.id)}
              title={w.name}
            >
              <span className="weather-icon">{w.icon}</span>
              <span className="weather-name">{w.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="controls-section presets-section">
        <div className="section-label">场景预设</div>
        <button
          className="preset-toggle-btn"
          onClick={() => setShowPresets(!showPresets)}
        >
          {showPresets ? '收起预设 ▲' : '展开预设 ▼'}
        </button>

        {showPresets && (
          <div className="presets-panel">
            <div className="save-preset-form">
              <input
                type="text"
                placeholder="预设名称"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="preset-input"
              />
              <input
                type="text"
                placeholder="描述（可选）"
                value={presetDesc}
                onChange={(e) => setPresetDesc(e.target.value)}
                className="preset-input"
              />
              <button className="save-btn" onClick={handleSavePreset}>
                保存当前状态
              </button>
            </div>

            <div className="presets-list">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="preset-item"
                  onClick={() => onLoadPreset(preset)}
                >
                  <div className="preset-item-name">{preset.name}</div>
                  <div className="preset-item-desc">
                    {preset.description ||
                      `${formatTime(preset.time)} · ${
                        seasons.find((s) => s.id === preset.season)?.name || preset.season
                      } · ${weathers.find((w) => w.id === preset.weather)?.name || preset.weather}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="controls-footer">
        <span className="hint-text">拖拽旋转 · 滚轮缩放</span>
      </div>
    </div>
  );
};

export default UIControls;
