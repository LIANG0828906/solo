import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useFootprintStore, ACHIEVEMENTS, Activity } from '../store/footprintStore';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

type TimeRange = 'day' | 'week' | 'month';

function aggregateActivities(activities: Activity[], range: TimeRange) {
  const now = new Date();
  const points: { label: string; value: number }[] = [];

  if (range === 'day') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      const dayStr = d.toISOString().slice(0, 10);
      const total = activities
        .filter((a) => a.timestamp.slice(0, 10) === dayStr)
        .reduce((sum, a) => sum + a.emission, 0);
      points.push({ label: key, value: parseFloat(total.toFixed(2)) });
    }
  } else if (range === 'week') {
    for (let i = 3; i >= 0; i--) {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
      const total = activities
        .filter((a) => {
          const t = new Date(a.timestamp);
          return t >= weekStart && t <= weekEnd;
        })
        .reduce((sum, a) => sum + a.emission, 0);
      points.push({ label, value: parseFloat(total.toFixed(2)) });
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${d.getFullYear()}/${d.getMonth() + 1}`;
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const total = activities
        .filter((a) => a.timestamp.slice(0, 7) === monthStr)
        .reduce((sum, a) => sum + a.emission, 0);
      points.push({ label, value: parseFloat(total.toFixed(2)) });
    }
  }

  return points;
}

export default function ImpactDashboard() {
  const { activities, currentUser, userChallenges, leaderboard } = useFootprintStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const chartRef = useRef<any>(null);

  const totalEmission = useMemo(
    () => parseFloat(activities.reduce((sum, a) => sum + a.emission, 0).toFixed(2)),
    [activities],
  );

  const completedChallenges = useMemo(
    () => userChallenges.filter((uc) => uc.completed).length,
    [userChallenges],
  );

  const chartData = useMemo(() => {
    const aggregated = aggregateActivities(activities, timeRange);
    return {
      labels: aggregated.map((p) => p.label),
      datasets: [
        {
          label: '碳排放 (kg CO2)',
          data: aggregated.map((p) => p.value),
          borderColor: '#2E7D32',
          backgroundColor: (ctx: any) => {
            const chart = ctx.chart;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return 'rgba(76, 175, 80, 0.1)';
            const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(76, 175, 80, 0.3)');
            gradient.addColorStop(1, 'rgba(76, 175, 80, 0.02)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#2E7D32',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
        },
      ],
    };
  }, [activities, timeRange]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 }, color: '#888' },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'kg CO2',
            font: { size: 12 },
            color: '#888',
          },
          ticks: { font: { size: 11 }, color: '#888' },
          grid: { color: 'rgba(0,0,0,0.06)' },
        },
      },
      plugins: {
        tooltip: {
          backgroundColor: '#1B5E20',
          titleFont: { size: 12 },
          bodyFont: { size: 12 },
          padding: 10,
          cornerRadius: 6,
          callbacks: {
            label: (ctx: any) => `${ctx.parsed.y} kg CO2`,
          },
        },
      },
    }),
    [],
  );

  const unlockedBadges = useMemo(() => {
    const badges: Record<string, boolean> = {};
    if (!currentUser) return badges;
    if (totalEmission > 50) badges['leaf'] = true;
    if (completedChallenges >= 3) badges['bike'] = true;
    if (currentUser.points >= 500) badges['earth'] = true;
    if (activities.length >= 30) badges['tree'] = true;
    if (currentUser.points >= 1000) badges['star'] = true;
    return badges;
  }, [totalEmission, completedChallenges, currentUser, activities.length]);

  return (
    <div>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{totalEmission}</div>
          <div className="stat-label">累计碳排放 (kg CO2)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{currentUser?.points ?? 0}</div>
          <div className="stat-label">绿色积分</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{completedChallenges}</div>
          <div className="stat-label">完成挑战</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 className="section-title" style={{ marginBottom: 0 }}>
            📊 碳排趋势
          </h3>
          <div className="tab-group">
            <button
              className={`tab-btn ${timeRange === 'day' ? 'active' : ''}`}
              onClick={() => setTimeRange('day')}
            >
              日
            </button>
            <button
              className={`tab-btn ${timeRange === 'week' ? 'active' : ''}`}
              onClick={() => setTimeRange('week')}
            >
              周
            </button>
            <button
              className={`tab-btn ${timeRange === 'month' ? 'active' : ''}`}
              onClick={() => setTimeRange('month')}
            >
              月
            </button>
          </div>
        </div>
        <div className="chart-container">
          <Line ref={chartRef} data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 className="section-title">🏅 成就徽章</h3>
        <div className="badges-grid">
          {ACHIEVEMENTS.map((badge) => (
            <div
              key={badge.id}
              className={`badge ${unlockedBadges[badge.id] ? '' : 'locked'}`}
            >
              {badge.icon}
              <div className="badge-tooltip">
                {badge.name}：{badge.condition}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">🏅 全球排行榜</h3>
        <ul className="leaderboard-list">
          {leaderboard.map((entry, idx) => (
            <li
              key={entry.userId}
              className={`leaderboard-item ${currentUser?.id === entry.userId ? 'current-user' : ''}`}
            >
              <span className="leaderboard-rank">
                {idx === 0 && <span className="crown-icon">👑</span>}
                {idx !== 0 && idx + 1}
              </span>
              <span className="leaderboard-avatar">{entry.avatar}</span>
              <span className="leaderboard-name">{entry.name}</span>
              <span className="leaderboard-points">{entry.points} 分</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
