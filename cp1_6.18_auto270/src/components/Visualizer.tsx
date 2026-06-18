import React, { useMemo } from 'react';
import { useSortStore } from '../store/sortStore';
import { SortStep } from '../algorithms/types';

const Visualizer: React.FC = () => {
  const { array, steps, currentStepIndex, algorithm } = useSortStore();

  const currentStep: SortStep | null = steps[currentStepIndex] || null;

  const barStyles = useMemo(() => {
    const maxVal = Math.max(...array, 1);
    const containerWidth = window.innerWidth - 80;
    const gap = 2;
    const n = array.length;
    const availableWidth = containerWidth - gap * (n - 1);
    let barWidth = Math.floor(availableWidth / n);
    const minWidth = window.innerWidth < 768 ? 8 : 10;
    barWidth = Math.max(minWidth, Math.min(40, barWidth));

    return {
      barWidth,
      maxVal,
    };
  }, [array.length]);

  if (array.length === 0) {
    return (
      <div className="visualizer-container">
        <div className="empty-state">点击随机生成开始</div>
      </div>
    );
  }

  const getBarClass = (index: number): string => {
    const classes: string[] = [];

    if (currentStep) {
      const sortedIndices = currentStep.sortedIndices || [];
      const isInIndices = currentStep.indices.includes(index);

      if (sortedIndices.length === array.length || sortedIndices.includes(index)) {
        if (currentStep.type === 'swap' || currentStep.type === 'compare') {
          if (isInIndices) {
            classes.push(currentStep.type);
          } else {
            classes.push('sorted');
          }
        } else {
          classes.push('sorted');
        }
      } else if (isInIndices) {
        classes.push(currentStep.type);
      }

      if (algorithm === 'quick' && currentStep.type === 'pivot' && isInIndices) {
        classes.push('pivot');
      }
    }

    return classes.join(' ');
  };

  return (
    <div className="visualizer-container">
      <div className="bars-wrapper">
        {array.map((value, index) => {
          const heightPercent = (value / barStyles.maxVal) * 100;
          return (
            <div
              key={index}
              className={`bar ${getBarClass(index)}`}
              style={{
                width: `${barStyles.barWidth}px`,
                height: `${heightPercent}%`,
              }}
              title={`索引: ${index}, 值: ${value}`}
            >
              <span className="bar-value">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(Visualizer);
