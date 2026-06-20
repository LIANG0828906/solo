import React from 'react';
import { EasingType, CubicBezierParams } from '../types';

interface ControlBarProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onReset: () => void;
  easingType: EasingType;
  onEasingChange: (easing: EasingType) => void;
  bezierParams: CubicBezierParams;
  onBezierChange: (params: CubicBezierParams) => void;
  onExport: () => void;
}

const EASING_OPTIONS: { value: EasingType; label: string }[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease', label: 'Ease' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In Out' },
  { value: 'cubic-bezier', label: 'Custom Bezier' },
];

export const ControlBar: React.FC<ControlBarProps> = ({
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onReset,
  easingType,
  onEasingChange,
  bezierParams,
  onBezierChange,
  onExport,
}) => {
  const currentMs = (currentTime / 100) * duration;

  const handleBezierInput = (key: keyof CubicBezierParams, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 1) {
      onBezierChange({ ...bezierParams, [key]: numValue });
    }
  };

  return (
    <div className="controls-bar">
      <div className="playback-controls">
        <button
          className="btn btn-primary playback-btn"
          onClick={onPlayPause}
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          className="btn btn-secondary playback-btn"
          onClick={onReset}
          title="重置"
        >
          ⟲
        </button>
      </div>

      <div className="time-display">
        {currentMs.toFixed(0)}ms / {duration}ms
      </div>

      <div className="easing-selector">
        <label className="form-label" style={{ margin: 0 }}>
          缓动函数:
        </label>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '140px' }}
          value={easingType}
          onChange={(e) => onEasingChange(e.target.value as EasingType)}
        >
          {EASING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {easingType === 'cubic-bezier' && (
          <div className="bezier-inputs">
            <input
              type="number"
              className="form-input"
              min="0"
              max="1"
              step="0.01"
              value={bezierParams.x1}
              onChange={(e) => handleBezierInput('x1', e.target.value)}
              title="x1"
            />
            <input
              type="number"
              className="form-input"
              min="0"
              max="1"
              step="0.01"
              value={bezierParams.y1}
              onChange={(e) => handleBezierInput('y1', e.target.value)}
              title="y1"
            />
            <input
              type="number"
              className="form-input"
              min="0"
              max="1"
              step="0.01"
              value={bezierParams.x2}
              onChange={(e) => handleBezierInput('x2', e.target.value)}
              title="x2"
            />
            <input
              type="number"
              className="form-input"
              min="0"
              max="1"
              step="0.01"
              value={bezierParams.y2}
              onChange={(e) => handleBezierInput('y2', e.target.value)}
              title="y2"
            />
          </div>
        )}
      </div>

      <button className="btn btn-primary" onClick={onExport}>
        导出 CSS
      </button>
    </div>
  );
};
