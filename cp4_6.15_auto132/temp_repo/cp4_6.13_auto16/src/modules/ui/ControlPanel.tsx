import React from 'react';
import { useAppStore } from '../../store/appStore';

const ControlPanel: React.FC = () => {
  const { currentHour, showHeatmap, showTrails, setCurrentHour, toggleHeatmap, toggleTrails } = useAppStore();

  const formatHour = (hour: number): string => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const getTimePeriod = (hour: number): string => {
    if (hour >= 5 && hour < 9) return '早高峰';
    if (hour >= 9 && hour < 12) return '上午';
    if (hour >= 12 && hour < 14) return '中午';
    if (hour >= 14 && hour < 17) return '下午';
    if (hour >= 17 && hour < 20) return '晚高峰';
    if (hour >= 20 && hour < 23) return '晚间';
    return '夜间';
  };

  const hourMarks = [0, 3, 6, 9, 12, 15, 18, 21, 23];

  return (
    <div className="control-panel">
      <h2 className="panel-title">交通流量控制台</h2>
      
      <div className="control-section">
        <div className="section-header">
          <label className="section-label">时段选择</label>
          <span className="time-display">
            {formatHour(currentHour)}
            <span className="time-period">{getTimePeriod(currentHour)}</span>
          </span>
        </div>
        
        <div className="slider-container">
          <input
            type="range"
            min="0"
            max="23"
            value={currentHour}
            onChange={(e) => setCurrentHour(parseInt(e.target.value))}
            className="time-slider"
          />
          <div className="slider-marks">
            {hourMarks.map((hour) => (
              <div
                key={hour}
                className={`slider-mark ${currentHour === hour ? 'active' : ''}`}
                onClick={() => setCurrentHour(hour)}
              >
                <span className="mark-line"></span>
                <span className="mark-label">{formatHour(hour)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="control-section">
        <label className="section-label">显示选项</label>
        
        <button
          className={`toggle-btn ${showHeatmap ? 'active' : ''}`}
          onClick={toggleHeatmap}
        >
          <span className="toggle-track">
            <span className="toggle-thumb"></span>
          </span>
          <span className="toggle-label">
            <span className="toggle-icon heatmap-icon">🔥</span>
            热力图模式
          </span>
        </button>

        <button
          className={`toggle-btn ${showTrails ? 'active' : ''}`}
          onClick={toggleTrails}
        >
          <span className="toggle-track">
            <span className="toggle-thumb"></span>
          </span>
          <span className="toggle-label">
            <span className="toggle-icon trail-icon">📍</span>
            车辆轨迹
          </span>
        </button>
      </div>

      <div className="legend-section">
        <label className="section-label">热力图图例</label>
        <div className="legend-bar">
          <div className="legend-gradient"></div>
          <div className="legend-labels">
            <span>畅通</span>
            <span>缓行</span>
            <span>拥堵</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
