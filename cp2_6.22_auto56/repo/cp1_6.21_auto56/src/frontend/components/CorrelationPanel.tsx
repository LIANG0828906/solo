import type { CorrelationResult } from '../../types';

interface StatisticsPanelProps {
  correlation: CorrelationResult;
  dataCount: number;
}

const items: { key: keyof CorrelationResult; label: string; icon: string }[] = [
  { key: 'sleepHours', label: '睡眠时长', icon: 'bed' },
  { key: 'exerciseMinutes', label: '运动时长', icon: 'directions_run' },
  { key: 'waterCups', label: '饮水量', icon: 'water_drop' },
];

export default function CorrelationPanel({ correlation, dataCount }: StatisticsPanelProps) {
  return (
    <div className="card">
      <h2 className="card-title">
        <span className="material-icons">analytics</span>
        关联分析（Pearson相关系数）
      </h2>

      <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>
        基于 {dataCount} 天数据计算 · 正相关表示行为越多情绪越强
      </div>

      <div className="correlation-chart">
        {items.map((item) => {
          const value = correlation[item.key];
          const absValue = Math.abs(value);
          const widthPercent = absValue * 100;
          const color = value >= 0 ? '#1565C0' : '#D32F2F';

          return (
            <div key={item.key} className="correlation-item">
              <span className="material-icons" style={{ fontSize: '20px', color: '#666' }}>
                {item.icon}
              </span>
              <div className="correlation-label">{item.label}</div>
              <div className="correlation-bar-container">
                <div
                  className="correlation-bar"
                  style={{
                    width: `${Math.max(widthPercent, 2)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <div className="correlation-value" style={{ color }}>
                {value >= 0 ? '+' : ''}
                {value.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #F0F0F0' }}>
        <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#666' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', background: '#1565C0', borderRadius: '3px' }} />
            正相关
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', background: '#D32F2F', borderRadius: '3px' }} />
            负相关
          </span>
        </div>
      </div>
    </div>
  );
}
