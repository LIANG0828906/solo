import React from 'react';
import { useTeaStore } from '../store/teaStore';

const ControlPanel: React.FC = () => {
  const {
    varieties,
    currentTeaId,
    temperature,
    brewTime,
    setCurrentTea,
    setTemperature,
    setBrewTime
  } = useTeaStore();

  const currentTea = useTeaStore(state => state.getCurrentTea());

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs > 0 ? secs + '秒' : ''}`;
  };

  return (
    <div className="control-panel">
      <h2 className="panel-title">冲泡控制面板</h2>

      <div className="control-group">
        <label className="control-label">茶叶品种</label>
        <div className="tea-select-wrapper">
          <select
            className="tea-select"
            value={currentTeaId}
            onChange={(e) => setCurrentTea(e.target.value)}
          >
            {varieties.map(tea => (
              <option key={tea.id} value={tea.id}>
                {tea.name}
              </option>
            ))}
          </select>
          <div className="tea-dropdown">
            {varieties.map(tea => (
              <div
                key={tea.id}
                className={`tea-option ${tea.id === currentTeaId ? 'selected' : ''}`}
                onClick={() => setCurrentTea(tea.id)}
              >
                <span
                  className="tea-dot"
                  style={{ backgroundColor: tea.color }}
                ></span>
                <span className="tea-name">{tea.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="control-group">
        <label className="control-label">
          水温: <span className="value-display">{temperature}℃</span>
        </label>
        <div className="slider-wrapper temp-slider">
          <input
            type="range"
            min="60"
            max="100"
            step="1"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="slider temp-slider-input"
          />
          <div className="slider-track-bg temp-track"></div>
        </div>
        <div className="slider-labels">
          <span>60℃</span>
          <span>100℃</span>
        </div>
        {currentTea && (
          <div className="optimal-hint">
            推荐温度: {currentTea.optimalTemp}℃
          </div>
        )}
      </div>

      <div className="control-group">
        <label className="control-label">
          冲泡时间: <span className="value-display">{formatTime(brewTime)}</span>
        </label>
        <div className="slider-wrapper">
          <input
            type="range"
            min="30"
            max="300"
            step="5"
            value={brewTime}
            onChange={(e) => setBrewTime(Number(e.target.value))}
            className="slider time-slider-input"
          />
        </div>
        <div className="slider-labels">
          <span>30秒</span>
          <span>5分钟</span>
        </div>
        {currentTea && (
          <div className="optimal-hint">
            推荐时间: {formatTime(currentTea.optimalTime)}
          </div>
        )}
      </div>

      <div className="current-tea-info">
        <div className="tea-color-indicator" style={{ backgroundColor: currentTea?.color }}></div>
        <div>
          <div className="current-tea-name">{currentTea?.name}</div>
          <div className="current-tea-desc">当前冲泡参数</div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
