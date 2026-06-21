import React from 'react';
import { ViewMode } from './types';

interface ControlPanelProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  year: number;
  onYearChange: (year: number) => void;
  compareMode: boolean;
  onCompareModeChange: (enabled: boolean) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  viewMode,
  onViewModeChange,
  year,
  onYearChange,
  compareMode,
  onCompareModeChange,
}) => {
  return (
    <div className="control-panel">
      <div className="panel-title">
        <span className="material-symbols-outlined">public</span>
        3D 气候可视化控制台
      </div>

      <div className="control-group">
        <div className="control-label">
          <span className="material-symbols-outlined">visibility</span>
          视角模式
        </div>
        <select
          className="view-select"
          value={viewMode}
          onChange={(e) => onViewModeChange(e.target.value as ViewMode)}
        >
          <option value="auto-rotate">自动旋转</option>
          <option value="free-explore">自由探索</option>
          <option value="locked">锁定视角</option>
        </select>
      </div>

      <div className="control-group">
        <div className="control-label">
          <span className="material-symbols-outlined">date_range</span>
          数据年份
        </div>
        <div className="slider-container">
          <input
            type="range"
            className="slider"
            min={2010}
            max={2020}
            step={1}
            value={year}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
          />
          <div className="year-display">{year}</div>
        </div>
      </div>

      <div className="control-group">
        <div className="control-label" style={{ marginBottom: '10px' }}>
          <span className="material-symbols-outlined">compare</span>
          城市对比
        </div>
        <div
          className="switch-container"
          onClick={() => onCompareModeChange(!compareMode)}
        >
          <div className="switch-label">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: compareMode ? '#4FC3F7' : '#b0bec5' }}>
              {compareMode ? 'toggle_on' : 'toggle_off'}
            </span>
            {compareMode ? '点击两个城市进行对比' : '开启对比模式'}
          </div>
          <div className={`switch ${compareMode ? 'active' : ''}`}>
            <div className="switch-knob"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
