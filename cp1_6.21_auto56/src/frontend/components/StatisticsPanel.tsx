import type { StatResult } from '../../types';

interface StatisticsPanelProps {
  stats: StatResult;
}

export default function StatisticsPanel({ stats }: StatisticsPanelProps) {
  const maxHeight = 150;
  const maxValue = 10;

  const filteredHeight = (stats.filteredAvg / maxValue) * maxHeight;
  const overallHeight = (stats.overallAvg / maxValue) * maxHeight;

  return (
    <div className="card">
      <h2 className="card-title">
        <span className="material-icons">bar_chart</span>
        统计对比
      </h2>

      <div className="stat-bars">
        <div className="stat-bar-group">
          <div className="stat-bar-value">{stats.filteredAvg}</div>
          <div
            className="stat-bar"
            style={{
              height: `${filteredHeight}px`,
              backgroundColor: '#FF8A65',
              animationDelay: '0.1s',
            }}
          />
          <div className="stat-bar-label">筛选组</div>
        </div>
        <div className="stat-bar-group">
          <div className="stat-bar-value">{stats.overallAvg}</div>
          <div
            className="stat-bar"
            style={{
              height: `${overallHeight}px`,
              backgroundColor: '#90A4AE',
              animationDelay: '0.2s',
            }}
          />
          <div className="stat-bar-label">总体</div>
        </div>
      </div>

      <div className="stat-info">
        <div className="stat-info-row">
          <span>筛选样本数</span>
          <span style={{ color: '#FF8A65', fontWeight: 600 }}>{stats.filteredCount}</span>
        </div>
        <div className="stat-info-row">
          <span>总样本数</span>
          <span style={{ color: '#90A4AE', fontWeight: 600 }}>{stats.totalCount}</span>
        </div>
        <div className="stat-info-row">
          <span>筛选组标准差</span>
          <span>{stats.filteredStd}</span>
        </div>
        <div className="stat-info-row">
          <span>总体标准差</span>
          <span>{stats.overallStd}</span>
        </div>
      </div>
    </div>
  );
}
