import { useMemo } from 'react';
import type { Stats, Team } from '../types';
import { getWeekDates, getDayName } from '../utils/dateUtils';

interface StatsDashboardProps {
  stats: Stats;
  teams: Team[];
}

export default function StatsDashboard({ stats, teams }: StatsDashboardProps) {
  const weekDates = useMemo(() => getWeekDates(), []);
  const maxRegistrations = Math.max(...stats.weeklyEventRegistrations, 1);

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return 'var(--color-success)';
    if (rate >= 50) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const getTrendIcon = (rate: number) => {
    if (rate >= 70) return '📈';
    if (rate >= 40) return '📊';
    return '📉';
  };

  return (
    <>
      <div className="stats-dashboard">
        <div className="stats-grid">
          <div className="stat-card card">
            <div className="stat-header">
              <span className="stat-icon">🏢</span>
              <span className="stat-trend">{getTrendIcon(stats.roomUtilizationRate)}</span>
            </div>
            <div className="stat-content">
              <div className="stat-value" style={{ color: getUtilizationColor(stats.roomUtilizationRate) }}>
                {stats.roomUtilizationRate}%
              </div>
              <div className="stat-label">会议室当日使用率</div>
              <div className="stat-progress">
                <div
                  className="progress-fill"
                  style={{
                    width: `${stats.roomUtilizationRate}%`,
                    backgroundColor: getUtilizationColor(stats.roomUtilizationRate),
                  }}
                />
              </div>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-header">
              <span className="stat-icon">💺</span>
              <span className="stat-trend">{getTrendIcon(stats.overallSpaceUtilization)}</span>
            </div>
            <div className="stat-content">
              <div className="stat-value" style={{ color: getUtilizationColor(stats.overallSpaceUtilization) }}>
                {stats.overallSpaceUtilization}%
              </div>
              <div className="stat-label">空间整体使用率</div>
              <div className="stat-progress">
                <div
                  className="progress-fill"
                  style={{
                    width: `${stats.overallSpaceUtilization}%`,
                    backgroundColor: getUtilizationColor(stats.overallSpaceUtilization),
                  }}
                />
              </div>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-header">
              <span className="stat-icon">👥</span>
              <span className="stat-trend">🏢</span>
            </div>
            <div className="stat-content">
              <div className="stat-value">{teams.length}</div>
              <div className="stat-label">入驻团队数</div>
              <div className="stat-subtext">
                共 {teams.reduce((sum, t) => sum + t.memberCount, 0)} 名成员
              </div>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-header">
              <span className="stat-icon">📅</span>
              <span className="stat-trend">🎉</span>
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {stats.weeklyEventRegistrations.reduce((a, b) => a + b, 0)}
              </div>
              <div className="stat-label">本周活动报名</div>
              <div className="stat-subtext">
                累计 {stats.weeklyEventRegistrations.length} 场活动
              </div>
            </div>
          </div>
        </div>

        <div className="chart-section card">
          <div className="chart-header">
            <h3 className="chart-title">
              <span>📊</span>
              本周活动报名趋势
            </h3>
            <div className="chart-legend">
              <span className="legend-dot" />
              <span>每日报名人数</span>
            </div>
          </div>

          <div className="bar-chart">
            <div className="chart-y-axis">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="y-axis-label">
                  {Math.ceil((maxRegistrations * (4 - i)) / 4)}
                </div>
              ))}
            </div>

            <div className="chart-content">
              <div className="chart-grid">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="grid-line" />
                ))}
              </div>

              <div className="bars-container">
                {stats.weeklyEventRegistrations.map((count, index) => {
                  const height = maxRegistrations > 0 ? (count / maxRegistrations) * 100 : 0;
                  const isToday = weekDates[index] === new Date().toISOString().split('T')[0];

                  return (
                    <div key={index} className="bar-column">
                      <div className="bar-wrapper">
                        <div
                          className={`chart-bar ${isToday ? 'today' : ''}`}
                          style={{
                            height: `${height}%`,
                            animationDelay: `${index * 0.05}s`,
                          }}
                        >
                          {count > 0 && (
                            <span className="bar-value">{count}</span>
                          )}
                        </div>
                      </div>
                      <div className={`bar-label ${isToday ? 'today' : ''}`}>
                        {getDayName(weekDates[index]).replace('周', '')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="team-stats-section card">
          <h3 className="section-title">
            <span>👥</span>
            团队工位使用率
          </h3>

          <div className="team-stats-grid">
            {teams.map(team => {
              const utilization = stats.teamSeatUtilization[team.id] || 0;
              return (
                <div key={team.id} className="team-stat-item">
                  <div className="team-stat-header">
                    <div className="team-info">
                      <span
                        className="team-color-dot"
                        style={{ backgroundColor: team.color }}
                      />
                      <span className="team-name">{team.name}</span>
                    </div>
                    <span
                      className="team-utilization-value"
                      style={{ color: getUtilizationColor(utilization) }}
                    >
                      {utilization}%
                    </span>
                  </div>
                  <div className="team-stat-progress">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${utilization}%`,
                        backgroundColor: team.color,
                      }}
                    />
                  </div>
                  <div className="team-stat-meta">
                    <span>{team.memberCount} 成员</span>
                    <span>/</span>
                    <span>{team.seatDemand} 工位</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .stats-dashboard {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--spacing-lg);
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          transition: transform var(--transition-fast);
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-icon {
          font-size: var(--font-size-2xl);
        }

        .stat-trend {
          font-size: var(--font-size-lg);
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .stat-value {
          font-size: var(--font-size-3xl);
          font-weight: 700;
          line-height: 1.2;
        }

        .stat-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .stat-subtext {
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
          margin-top: var(--spacing-xs);
        }

        .stat-progress {
          height: 6px;
          background: var(--color-bg-primary);
          border-radius: 3px;
          overflow: hidden;
          margin-top: var(--spacing-sm);
        }

        .stat-progress .progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width var(--transition-normal);
        }

        .chart-section {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--spacing-md);
        }

        .chart-title {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-lg);
          font