import { memo, useState, useEffect } from 'react';
import type { CoverageStats } from '../types';
import { TOWER_CONFIGS } from '../towerManager';

interface DataPanelProps {
  towerCount: number;
  coverageStats: CoverageStats | null;
  pathSteps: number;
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value === displayValue) return;

    setIsAnimating(true);
    const startValue = displayValue;
    const diff = value - startValue;
    const duration = 100;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + diff * easeProgress);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span className={`stat-value ${isAnimating ? 'animating' : ''}`}>
      {displayValue}
    </span>
  );
}

const DataPanel = memo(function DataPanel({
  towerCount,
  coverageStats,
  pathSteps,
}: DataPanelProps) {
  const coveragePercent = coverageStats?.coveragePercent ?? 0;
  const coveredLength = coverageStats?.coveredPathLength ?? 0;
  const totalLength = coverageStats?.totalPathLength ?? 0;

  return (
    <div className="data-panel">
      <h2 className="panel-title">数据统计</h2>

      <div className="stat-item">
        <div className="stat-label">炮塔总数</div>
        <AnimatedNumber value={towerCount} />
      </div>

      <div className="stat-item">
        <div className="stat-label">路径总步数</div>
        <AnimatedNumber value={pathSteps} />
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          从入口到出口
        </div>
      </div>

      <div className="stat-item">
        <div className="stat-label">
          火力覆盖占比
          {totalLength > 0 && (
            <span style={{ fontSize: '12px', color: '#666' }}>
              {' '}({coveredLength}/{totalLength} 格)
            </span>
          )}
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${coveragePercent}%` }}
          />
          <span className="progress-text">{coveragePercent}%</span>
        </div>
      </div>

      <div className="tower-legend">
        <div className="stat-label" style={{ marginBottom: '12px' }}>
          炮塔类型
        </div>
        {Object.values(TOWER_CONFIGS).map((config) => (
          <div key={config.type} className="legend-item">
            <div className={`legend-color ${config.type}`} />
            <span>{config.name}</span>
            <span style={{ marginLeft: 'auto', color: '#999', fontSize: '11px' }}>
              范围: {config.range}格
            </span>
          </div>
        ))}
      </div>

      <div className="help-text">
        <p>💡 <strong>操作提示:</strong></p>
        <p>• 点击通道格子放置炮塔</p>
        <p>• 右键点击已放置炮塔移除</p>
        <p>• 炮塔会阻挡敌人路径</p>
        <p>• 红色路径表示已被完全阻挡</p>
      </div>
    </div>
  );
});

export default DataPanel;
