import { useMemo } from 'react';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useJointStore } from '../store/useJointStore';
import {
  JOINTS,
  JointKey,
  isAngleSafe,
  getRiskLevel,
  normalizeAngle
} from '../utils/anatomyData';

const RING_CIRCUMFERENCE = 2 * Math.PI * 48;

function RiskRing({ score }: { score: number }) {
  const level = getRiskLevel(score);
  const offset = useMemo(() => {
    return RING_CIRCUMFERENCE - (score / 100) * RING_CIRCUMFERENCE;
  }, [score]);

  return (
    <div className="risk-result" key={score}>
      <div className="risk-ring-container">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle
            className="risk-ring-bg"
            cx="60"
            cy="60"
            r="48"
          />
          <circle
            className="risk-ring-fill"
            cx="60"
            cy="60"
            r="48"
            stroke={level.color}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="risk-score-text" style={{ color: level.color }}>
          {score}
        </div>
      </div>
      <div className="risk-description" style={{ color: level.color }}>
        {level.text}
      </div>
    </div>
  );
}

function JointCard({ jointKey }: { jointKey: JointKey }) {
  const {
    angles,
    targetAngles,
    expandedJoints,
    setTargetAngle,
    setSelectedJoint,
    toggleJointExpanded,
    selectedJoint
  } = useJointStore();

  const joint = JOINTS.find((j) => j.key === jointKey)!;
  const currentAngle = angles[jointKey];
  const targetAngle = targetAngles[jointKey];
  const expanded = expandedJoints[jointKey];
  const safe = isAngleSafe(currentAngle, joint.range);
  const isSelected = selectedJoint === jointKey;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setTargetAngle(jointKey, value);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value)) value = joint.initialAngle;
    value = Math.max(joint.range.min, Math.min(joint.range.max, value));
    setTargetAngle(jointKey, value);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.slider-container') ||
        (e.target as HTMLElement).closest('.number-input-wrapper')) {
      return;
    }
    toggleJointExpanded(jointKey);
  };

  const handleSelectForChart = () => {
    setSelectedJoint(jointKey);
    toast.success(`已选择 ${joint.name} 进行实时追踪`);
  };

  const fillPercent =
    (normalizeAngle(targetAngle, joint.range) * 100).toFixed(1);

  return (
    <div
      className="joint-card"
      onClick={handleCardClick}
      style={{
        border: isSelected ? `2px solid ${joint.color}` : '2px solid transparent'
      }}
    >
      <div className="joint-card-header">
        <div className="joint-name-wrapper">
          <div
            className="joint-color-dot"
            style={{ background: joint.color }}
          />
          <span className="joint-name">{joint.name}</span>
          <span style={{ fontSize: '11px', color: '#9e9e9e' }}>
            {joint.description}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="joint-angle-display" style={{ color: safe ? '#ffffff' : '#FF4444' }}>
            {currentAngle.toFixed(0)}°
          </span>
          {expanded ? (
            <FaChevronUp size={12} color="#9e9e9e" />
          ) : (
            <FaChevronDown size={12} color="#9e9e9e" />
          )}
        </div>
      </div>

      <div className={`joint-card-content ${expanded ? 'expanded' : 'collapsed'}`}>
        <div className="control-row" onClick={(e) => e.stopPropagation()}>
          <div className="slider-wrapper">
            <span className="slider-range-label">{joint.range.min}°</span>
            <div className="slider-container">
              <div className={`slider-track ${!safe ? 'unsafe' : ''}`}>
                <div
                  className="slider-fill"
                  style={{
                    width: `${fillPercent}%`,
                    background: joint.color
                  }}
                />
              </div>
              <input
                type="range"
                min={joint.range.min}
                max={joint.range.max}
                step={1}
                value={targetAngle}
                onChange={handleSliderChange}
              />
            </div>
            <span className="slider-range-label">{joint.range.max}°</span>
            <div className="number-input-wrapper">
              <input
                type="number"
                className={!safe ? 'unsafe' : ''}
                min={joint.range.min}
                max={joint.range.max}
                step={1}
                value={targetAngle.toFixed(0)}
                onChange={handleNumberChange}
              />
            </div>
          </div>
          <div className="safe-range-label">
            安全范围：{joint.range.safeMin}° ~ {joint.range.safeMax}°
            <span
              style={{
                marginLeft: '12px',
                color: '#4A90D9',
                cursor: 'pointer',
                textDecoration: isSelected ? 'underline' : 'none',
                fontWeight: isSelected ? 600 : 400
              }}
              onClick={handleSelectForChart}
            >
              {isSelected ? '✓ 正在追踪' : '点击追踪此关节'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ControlPanel() {
  const { riskScore, hasEvaluatedRisk, evaluateRisk } = useJointStore();

  const handleEvaluate = () => {
    evaluateRisk();
    toast.success('风险评估完成');
  };

  return (
    <div className="control-panel">
      <div>
        <h1 className="panel-title">关节活动范围控制</h1>
        <p className="panel-subtitle">
          拖动滑块或输入数值调整各关节角度，观察3D模型的实时变化
        </p>
      </div>

      {JOINTS.map((joint) => (
        <JointCard key={joint.key} jointKey={joint.key} />
      ))}

      <div className="risk-section">
        <button className="evaluate-btn" onClick={handleEvaluate}>
          评估风险
        </button>
        {hasEvaluatedRisk && <RiskRing score={riskScore} />}
        <p className="select-joint-hint">
          提示：点击"点击追踪此关节"可切换折线图追踪的关节
        </p>
      </div>
    </div>
  );
}

export default ControlPanel;
