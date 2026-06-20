import React, { useEffect, useState, useMemo } from 'react';
import './FengMian.css';

export interface FengMianProps {
  value?: number;
  current?: number;
  maxValue?: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  onChange?: (value: number) => void;
}

const FengMian: React.FC<FengMianProps> = ({
  value,
  current,
  maxValue = 100,
  max,
  label = '氛围值',
  showValue = true,
  onChange,
}) => {
  const actualValue = value !== undefined ? value : current ?? 0;
  const actualMax = max !== undefined ? max : maxValue;
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const clampedValue = Math.max(0, Math.min(actualMax, actualValue));
  const percentage = (clampedValue / actualMax) * 100;

  const inkDrops = useMemo(() => {
    const drops: { id: number; size: number; delay: number; left: number }[] = [];
    const dropCount = Math.floor(percentage / 10);
    for (let i = 0; i < dropCount; i++) {
      drops.push({
        id: i,
        size: 4 + Math.random() * 6,
        delay: i * 0.08,
        left: 5 + (i * (90 / Math.max(dropCount - 1, 1))),
      });
    }
    return drops;
  }, [percentage]);

  useEffect(() => {
    if (displayValue === clampedValue) return;
    
    setIsAnimating(true);
    const startValue = displayValue;
    const diff = clampedValue - startValue;
    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + diff * easeOut);
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        if (onChange) {
          onChange(clampedValue);
        }
      }
    };

    requestAnimationFrame(animate);
  }, [clampedValue]);

  const getLevelText = (): string => {
    if (percentage >= 80) return '大雅';
    if (percentage >= 60) return '雅致';
    if (percentage >= 40) return '尚可';
    if (percentage >= 20) return '平淡';
    return '冷清';
  };

  const getLevelColor = (): string => {
    if (percentage >= 80) return 'var(--ink-accent)';
    if (percentage >= 60) return 'var(--ink-primary)';
    if (percentage >= 40) return 'var(--ink-secondary)';
    if (percentage >= 20) return 'var(--ink-light)';
    return 'var(--ink-danger)';
  };

  return (
    <div className="fengmian-container">
      <div className="fengmian-header">
        <div className="label-section">
          <span className="fengmian-icon">🎋</span>
          <span className="fengmian-label">{label}</span>
        </div>
        {showValue && (
          <div className="value-section">
            <span className="value-number" style={{ color: getLevelColor() }}>
              {displayValue}
            </span>
            <span className="value-max">/{actualMax}</span>
            <span className="level-badge" style={{ borderColor: getLevelColor(), color: getLevelColor() }}>
              {getLevelText()}
            </span>
          </div>
        )}
      </div>

      <div className="progress-wrapper">
        <div className="ink-progress-track">
          <div className="track-pattern"></div>
        </div>
        
        <div 
          className="ink-progress-fill" 
          style={{ 
            width: `${percentage}%`,
            backgroundColor: getLevelColor(),
          }}
        >
          <div className="fill-texture"></div>
          <div className="fill-shine"></div>
        </div>

        <div className="ink-drops-container">
          {inkDrops.map((drop) => (
            <div
              key={drop.id}
              className={`ink-drop ${isAnimating ? 'animating' : ''}`}
              style={{
                width: `${drop.size}px`,
                height: `${drop.size}px`,
                left: `${drop.left}%`,
                animationDelay: `${drop.delay}s`,
                backgroundColor: getLevelColor(),
              }}
            >
              <div className="drop-ripple"></div>
            </div>
          ))}
        </div>

        <div 
          className="ink-brush-tip"
          style={{ 
            left: `calc(${percentage}% - 8px)`,
            backgroundColor: getLevelColor(),
          }}
        >
          <div className="brush-particle"></div>
          <div className="brush-particle delay-1"></div>
          <div className="brush-particle delay-2"></div>
        </div>
      </div>

      <div className="fengmian-footer">
        <div className="scale-markers">
          {[0, 25, 50, 75, 100].map((mark) => (
            <div 
              key={mark} 
              className={`scale-marker ${percentage >= mark ? 'active' : ''}`}
              style={percentage >= mark ? { borderColor: getLevelColor() } : {}}
            >
              <span className="marker-label">{mark}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FengMian;
