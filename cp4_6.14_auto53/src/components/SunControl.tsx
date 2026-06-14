import React from 'react';
import { SunParams } from '../App';

interface SunControlProps {
  sunParams: SunParams;
  onUpdate: (updates: Partial<SunParams>) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  autoRotateProgress: number;
}

const SunControl: React.FC<SunControlProps> = ({
  sunParams,
  onUpdate,
  autoRotate,
  onToggleAutoRotate,
  autoRotateProgress
}) => {
  const strokeWidth = 8;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - autoRotateProgress);

  return (
    <div>
      <div className="control-row">
        <label>方位角 (0°-360°)</label>
        <div className="control-inputs">
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={Math.round(sunParams.azimuth)}
            onChange={(e) => onUpdate({ azimuth: Number(e.target.value) })}
            disabled={autoRotate}
          />
          <input
            type="number"
            min={0}
            max={360}
            step={1}
            value={Math.round(sunParams.azimuth)}
            onChange={(e) => onUpdate({
              azimuth: Math.min(360, Math.max(0, Number(e.target.value)))
            })}
            disabled={autoRotate}
          />
        </div>
      </div>

      <div className="control-row">
        <label>高度角 (0°-90°)</label>
        <div className="control-inputs">
          <input
            type="range"
            min={0}
            max={90}
            step={1}
            value={Math.round(sunParams.altitude)}
            onChange={(e) => onUpdate({ altitude: Number(e.target.value) })}
            disabled={autoRotate}
          />
          <input
            type="number"
            min={0}
            max={90}
            step={1}
            value={Math.round(sunParams.altitude)}
            onChange={(e) => onUpdate({
              altitude: Math.min(90, Math.max(0, Number(e.target.value)))
            })}
            disabled={autoRotate}
          />
        </div>
      </div>

      <div className="auto-rotate-container">
        <svg
          className="progress-ring"
          width="64"
          height="64"
          viewBox="0 0 64 64"
        >
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="rgba(148, 163, 184, 0.2)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke={autoRotate ? '#3b82f6' : 'transparent'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={autoRotate ? dashOffset : circumference}
            transform="rotate(-90 32 32)"
            style={{ transition: autoRotate ? 'stroke-dashoffset 0.1s linear' : 'none' }}
          />
          <text
            x="32"
            y="36"
            textAnchor="middle"
            fill={autoRotate ? '#3b82f6' : '#94a3b8'}
            fontSize="14"
            fontWeight="700"
          >
            {autoRotate ? `${Math.round(autoRotateProgress * 100)}%` : '☀️'}
          </text>
        </svg>
        <div className="auto-rotate-info">
          <span className="auto-rotate-label">
            {autoRotate ? '模拟进行中...' : '时间动态模拟'}
          </span>
          <span className="auto-rotate-sub">
            {autoRotate ? '周期30秒' : '方位角自动旋转'}
          </span>
        </div>
        <button
          onClick={onToggleAutoRotate}
          style={{
            background: autoRotate ? '#ef4444' : '#3b82f6',
            borderColor: autoRotate ? '#ef4444' : '#3b82f6'
          }}
        >
          {autoRotate ? '⏹ 停止' : '▶ 开始'}
        </button>
      </div>
    </div>
  );
};

export default SunControl;
