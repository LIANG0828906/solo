import { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { checkInAPI } from '../services/api';
import type { DashboardStats } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const lastRefreshRef = useRef(Date.now());

  const fetchStats = async () => {
    try {
      const data = await checkInAPI.getDashboardStats();
      setStats(data);
      lastRefreshRef.current = Date.now();
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
    return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const chartData = stats
    ? {
        labels: stats.trend.map(t => t.time),
        datasets: [
          {
            label: '签到人数',
            data: stats.trend.map(t => t.count),
            borderColor: '#4A90D9',
            backgroundColor: 'rgba(74, 144, 217, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#4A90D9',
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
          },
        ],
      }
    : { labels: [], datasets: [] };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: 'easeInOutQuart' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 46, 0.9)',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: { size: 12 },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#F3F4F6',
        },
        ticks: {
          color: '#9CA3AF',
          font: { size: 12 },
          stepSize: 1,
        },
      },
    },
  };

  if (loading && !stats) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">⏳</div>
          <div className="empty-text">加载数据中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">数据看板</h1>
          <p className="page-subtitle">实时查看活动签到统计数据</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">活动总数</div>
          <div className="stat-value primary">{stats?.totalEvents || 0}</div>
          <div className="stat-trend">所有已创建的活动</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">进行中活动</div>
          <div className="stat-value success">{stats?.ongoingEvents || 0}</div>
          <div className="stat-trend">当前正在进行的活动</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">累计签到人数</div>
          <div className="stat-value">{stats?.totalCheckIns || 0}</div>
          <div className="stat-trend">所有活动签到总人次</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">平均签到率</div>
          <div className="stat-value warning">{stats?.averageCheckInRate || 0}%</div>
          <div className="stat-trend">各活动签到率平均值</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">签到人数趋势（近24小时）</div>
        <div className="chart-container">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="recent-list">
        <div className="recent-list-header">
          <div className="recent-list-title">最近签到记录</div>
          <div className="refresh-indicator">
            <span className="refresh-dot"></span>
            <span>每 5 秒自动刷新</span>
          </div>
        </div>
        {!stats?.recentCheckIns?.length ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-text">暂无签到记录</div>
          </div>
        ) : (
          <ul className="recent-list-items">
            {stats.recentCheckIns.map((record, idx) => (
              <li key={record.id} className="recent-item">
                <div className="avatar" style={{ animationDelay: `${idx * 0.05}s` }}>
                  {getInitial(record.participantName)}
                </div>
                <div className="recent-info">
                  <div className="recent-name">{record.participantName}</div>
                  <div className="recent-event">{record.eventTitle}</div>
                </div>
                <div className="recent-time">{formatTime(record.checkInTime)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
