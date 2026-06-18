import React from 'react';
import { useSortStore } from '../store/sortStore';
import { PSEUDOCODE } from '../algorithms/types';

const InfoPanel: React.FC = () => {
  const {
    algorithm,
    steps,
    currentStepIndex,
    comparisons,
    swaps,
    elapsedTime,
  } = useSortStore();

  const pseudocodeLines = PSEUDOCODE[algorithm] || [];
  const currentStep = steps[currentStepIndex];
  const activeLine = currentStep?.pseudocodeLine ?? -1;

  const totalSteps = Math.max(steps.length - 1, 0);
  const currentStepDisplay = Math.min(currentStepIndex, totalSteps);

  return (
    <div className="info-panel">
      <div className="panel-section">
        <div className="panel-title">伪代码</div>
        <div className="pseudocode">
          {pseudocodeLines.map((line, index) => (
            <div
              key={index}
              className={`pseudocode-line ${index === activeLine ? 'active' : ''}`}
            >
              {line || '\u00A0'}
            </div>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-title">统计信息</div>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-label">步骤</span>
            <span className="stat-value step-counter">
              {currentStepDisplay} / {totalSteps}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">比较次数</span>
            <span className="stat-value">{comparisons}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">交换次数</span>
            <span className="stat-value">{swaps}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">运行耗时</span>
            <span className="stat-value">{elapsedTime.toFixed(0)} ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(InfoPanel);
