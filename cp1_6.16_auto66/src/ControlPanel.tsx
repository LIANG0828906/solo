import React, { useState } from 'react';

interface ControlPanelProps {
  alpha: number;
  theta: number;
  delta: number;
  onAlphaChange: (value: number) => void;
  onThetaChange: (value: number) => void;
  onDeltaChange: (value: number) => void;
  isRunning: boolean;
  onToggleRun: () => void;
}

interface SliderGroupProps {
  label: string;
  color: 'alpha' | 'theta' | 'delta';
  value: number;
  min: number;
  max: number;
  step: number;
  recommendedRange: string;
  onChange: (value: number) => void;
}

const SliderGroup: React.FC<SliderGroupProps> = ({
  label,
  color,
  value,
  min,
  max,
  step,
  recommendedRange,
  onChange,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  return (
    <div className="slider-group">
      <div className="slider-label">
        <div className="slider-label-name">
          <span className={`slider-label-dot ${color}`}></span>
          <span>{label}</span>
        </div>
        <div className="slider-value">
          <strong>{value.toFixed(1)}</strong> Hz
        </div>
      </div>
      <div
        className="slider-container"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isHovered && (
          <div className="slider-tooltip">
            <div>当前值: {value.toFixed(1)} Hz</div>
            <div className="slider-tooltip-range">推荐范围: {recommendedRange}</div>
          </div>
        )}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          aria-label={`${label}频率滑块`}
        />
      </div>
    </div>
  );
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  alpha,
  theta,
  delta,
  onAlphaChange,
  onThetaChange,
  onDeltaChange,
  isRunning,
  onToggleRun,
}) => {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const toggleMobilePanel = () => {
    setIsMobileExpanded(!isMobileExpanded);
  };

  return (
    <>
      <button
        className={`mobile-panel-toggle ${isMobileExpanded ? 'expanded' : ''}`}
        onClick={toggleMobilePanel}
        aria-label={isMobileExpanded ? '收起控制面板' : '展开控制面板'}
      >
        <svg
          className="mobile-panel-toggle-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
        <span>控制面板</span>
      </button>

      <div className={`control-panel ${isMobileExpanded ? 'mobile-expanded' : ''}`}>
        <div className="control-panel-header">
          <div className="control-panel-title">梦境频率调节</div>
          <div className="control-panel-subtitle">调整脑波频率以进入不同意识状态</div>
        </div>

        <SliderGroup
          label="Alpha 波"
          color="alpha"
          value={alpha}
          min={8}
          max={12}
          step={0.1}
          recommendedRange="9 - 11 Hz"
          onChange={onAlphaChange}
        />

        <SliderGroup
          label="Theta 波"
          color="theta"
          value={theta}
          min={4}
          max={8}
          step={0.1}
          recommendedRange="5 - 7 Hz"
          onChange={onThetaChange}
        />

        <SliderGroup
          label="Delta 波"
          color="delta"
          value={delta}
          min={0.5}
          max={4}
          step={0.1}
          recommendedRange="1.5 - 3 Hz"
          onChange={onDeltaChange}
        />

        <button
          className={`toggle-button ${isRunning ? 'running' : ''}`}
          onClick={onToggleRun}
        >
          {isRunning ? '停止' : '开始'}
        </button>
      </div>
    </>
  );
};

export default ControlPanel;
