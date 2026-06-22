import { useState, useEffect } from 'react';
import { BarChart3, Users, Calendar, CheckCircle } from 'lucide-react';
import type { DashboardStats } from '@/types';
import { statsApi } from '@/api/statsApi';
import { BarChart } from '@/components/BarChart';
import type { ToastContextType } from '@/hooks/useToast';

interface DashboardPageProps {
  toast: ToastContextType;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ toast }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await statsApi.getDashboardStats();
      setStats(data);
    } catch (error) {
      toast.showError(error instanceof Error ? error.message : '加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <h3 className="empty-state-title">暂无数据</h3>
        <p className="empty-state-text">统计数据加载失败，请稍后重试</p>
        <button className="btn btn-primary" onClick={loadStats}>
          重新加载
        </button>
      </div>
    );
  }

  const statCards = [
    {
      label: '总活动数',
      value: stats.totalActivities,
      unit: '场',
      icon: <Calendar size={24} />,
      color: '#8B5CF6',
    },
    {
      label: '总报名人次',
      value: stats.totalRegistrations,
      unit: '人次',
      icon: <Users size={24} />,
      color: '#06B6D4',
    },
    {
      label: '平均签到率',
      value: stats.averageCheckInRate,
      unit: '%',
      icon: <CheckCircle size={24} />,
      color: '#10B981',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <BarChart3 size={28} style={{ display: 'inline', marginRight: 12, color: '#8B5CF6' }} />
          数据统计看板
        </h1>
        <p className="page-subtitle">活动运营数据分析概览</p>
      </div>

      <div className="dashboard-overview">
        {statCards.map((card, index) => (
          <div key={index} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: `${card.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color,
                }}
              >
                {card.icon}
              </div>
            </div>
            <p className="stat-card-label">{card.label}</p>
            <p className="stat-card-value">
              {card.value}
              <span className="stat-card-unit">{card.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="chart-container">
        <h2 className="chart-title">近6个月活动参与与签到趋势</h2>
        <BarChart data={stats.monthlyData} />
      </div>
    </div>
  );
};

export default DashboardPage;
