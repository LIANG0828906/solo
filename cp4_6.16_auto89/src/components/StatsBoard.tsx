import React, { useMemo } from 'react';
import {
  useGardenStore,
  computeLeaderboard,
  computeStats,
  PRESET_COLORS,
} from '../store/gardenStore';
import { format } from 'date-fns';

const HEATMAP_COLORS = ['#e8f5e9', '#a5d6a7', '#66bb6a', '#43a047', '#2e7d32'];

const StatsBoard: React.FC = () => {
  const plots = useGardenStore((s) => s.plots);
  const logs = useGardenStore((s) => s.logs);
  const users = useGardenStore((s) => s.users);
  const leaderboardPeriod = useGardenStore((s) => s.leaderboardPeriod);
  const setLeaderboardPeriod = useGardenStore((s) => s.setLeaderboardPeriod);

  const stats = useMemo(() => computeStats(plots, logs), [plots, logs]);

  const leaderboard = useMemo(
    () => computeLeaderboard(plots, logs, users, leaderboardPeriod),
    [plots, logs, users, leaderboardPeriod]
  );

  const donutData = useMemo(() => {
    const total = stats.cropDistribution.reduce((s, c) => s + c.weight, 0);
    if (total === 0) return { segments: [], total: 0 };
    const radius = 60;
    const innerRadius = 36;
    const cx = 80;
    const cy = 80;
    let currentAngle = -Math.PI / 2;

    const segments = stats.cropDistribution.map((crop) => {
      const fraction = crop.weight / total;
      const startAngle = currentAngle;
      const endAngle = currentAngle + fraction * 2 * Math.PI;
      currentAngle = endAngle;

      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy + radius * Math.sin(endAngle);
      const ix1 = cx + innerRadius * Math.cos(endAngle);
      const iy1 = cy + innerRadius * Math.sin(endAngle);
      const ix2 = cx + innerRadius * Math.cos(startAngle);
      const iy2 = cy + innerRadius * Math.sin(startAngle);

      const largeArc = fraction > 0.5 ? 1 : 0;

      const d = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2}`,
        'Z',
      ].join(' ');

      return {
        d,
        color: crop.color,
        cropName: crop.cropName,
        weight: crop.weight,
        fraction,
      };
    });

    return { segments, total };
  }, [stats.cropDistribution]);

  return (
    <div className="sidebar">
      <div className="stats-card">
        <h3>📊 花园概览</h3>
        <div className="stats-summary">
          <div className="stat-item">
            <div className="stat-value">{stats.claimedPlots}/{stats.totalPlots}</div>
            <div className="stat-label">已认领地块</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.totalLogs}</div>
            <div className="stat-label">日志总数</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{(stats.totalHarvest / 1000).toFixed(1)}kg</div>
            <div className="stat-label">总收获量</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">参与居民</div>
          </div>
        </div>
      </div>

      <div className="stats-card">
        <h3>🥧 作物分布</h3>
        {donutData.segments.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <span className="empty-icon">🌱</span>
            <p>暂无收获数据</p>
          </div>
        ) : (
          <div className="donut-chart-container">
            <svg width="160" height="160" viewBox="0 0 160 160">
              {donutData.segments.map((seg, i) => (
                <path
                  key={i}
                  d={seg.d}
                  fill={seg.color}
                  stroke="white"
                  strokeWidth="1"
                />
              ))}
              <text
                x="80"
                y="76"
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="#3e2723"
              >
                {(donutData.total / 1000).toFixed(1)}kg
              </text>
              <text
                x="80"
                y="92"
                textAnchor="middle"
                fontSize="9"
                fill="#795548"
              >
                总产量
              </text>
            </svg>
            <div className="donut-legend">
              {stats.cropDistribution.map((crop) => (
                <div className="legend-item" key={crop.cropName}>
                  <div className="legend-dot" style={{ background: crop.color }} />
                  {crop.cropName} {(crop.weight / 1000).toFixed(1)}kg
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="stats-card">
        <h3>📅 近7天活动</h3>
        <div className="heatmap-row">
          {stats.activityHeatmap.map((day) => (
            <div
              key={day.date}
              className="heatmap-cell"
              style={{
                background: HEATMAP_COLORS[day.level],
              }}
              title={`${day.date}: ${day.count} 条记录`}
            >
              <span className="heatmap-count">{day.count}</span>
            </div>
          ))}
        </div>
        <div className="heatmap-labels">
          {stats.activityHeatmap.map((day) => (
            <span key={day.date}>
              {format(new Date(day.date), 'MM/dd')}
            </span>
          ))}
        </div>
      </div>

      <div className="stats-card">
        <h3>🏆 邻里贡献榜</h3>
        <div className="leaderboard-period-toggle">
          <button
            className={`period-btn ${leaderboardPeriod === 'month' ? 'active' : ''}`}
            onClick={() => setLeaderboardPeriod('month')}
          >
            本月
          </button>
          <button
            className={`period-btn ${leaderboardPeriod === 'all' ? 'active' : ''}`}
            onClick={() => setLeaderboardPeriod('all')}
          >
            全部
          </button>
        </div>
        {leaderboard.length === 0 ? (
          <div className="empty-state" style={{ padding: '16px 0' }}>
            <span className="empty-icon">🌱</span>
            <p>暂无贡献数据</p>
          </div>
        ) : (
          <div className="leaderboard-list">
            {leaderboard.map((entry) => (
              <div
                className={`leaderboard-item ${entry.rank <= 3 ? 'top3' : ''}`}
                key={entry.userId}
              >
                <span className="lb-rank">
                  {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                </span>
                <div
                  className="lb-avatar"
                  style={{ background: entry.userColor }}
                >
                  {entry.userName.slice(0, 2).toUpperCase()}
                </div>
                <div className="lb-info">
                  <div className="lb-name">{entry.userName}</div>
                  <div className="lb-score">
                    日志 {entry.logCount} · 产量 {entry.harvestWeight}g · 地块 {entry.plotCount}
                  </div>
                </div>
                <div className="lb-score-value">{entry.score}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsBoard;
