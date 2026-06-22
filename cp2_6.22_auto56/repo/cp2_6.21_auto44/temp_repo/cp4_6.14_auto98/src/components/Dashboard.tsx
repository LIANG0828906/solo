import React, { useEffect, useState, useRef } from 'react';
import { api, type StatsOverview } from '../api';

interface DashboardProps {
  onViewStudents: () => void;
}

const AnimatedNumber: React.FC<{ value: number; duration?: number }> = ({
  value,
  duration = 1000,
}) => {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return <>{display}</>;
};

const Dashboard: React.FC<DashboardProps> = ({ onViewStudents }) => {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getOverviewStats();
        if (!cancelled) {
          setStats(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">统计看板</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue" onClick={onViewStudents}>
          <div className="stat-number">
            {loading || !stats ? (
              <span className="loading-spinner" />
            ) : (
              <AnimatedNumber value={stats.totalStudents} />
            )}
          </div>
          <div className="stat-title">总学员数</div>
        </div>
        <div className="stat-card green">
          <div className="stat-number">
            {loading || !stats ? (
              <span className="loading-spinner" />
            ) : (
              <AnimatedNumber value={stats.todayConsume} />
            )}
          </div>
          <div className="stat-title">今日消课总课时</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-number">
            {loading || !stats ? (
              <span className="loading-spinner" />
            ) : (
              <AnimatedNumber value={stats.remainingHours} />
            )}
          </div>
          <div className="stat-title">剩余总课时</div>
        </div>
      </div>

      {error && (
        <div className="toast toast-error" style={{ position: 'static' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="dashboard-section">
        <div className="dashboard-recent-title">系统说明</div>
        <div style={{ color: '#475569', lineHeight: 1.8, fontSize: '14px' }}>
          <p>欢迎使用学员课时管理与消课记录系统。本系统主要功能包括：</p>
          <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
            <li>👥 <strong>学员管理</strong>：查看、搜索、筛选、添加学员，支持分页</li>
            <li>📝 <strong>消课记录</strong>：在学员详情页进行消课操作，自动扣除课时并记录</li>
            <li>💳 <strong>续费管理</strong>：为学员选择新的课程包或增加课时</li>
            <li>🔄 <strong>调课操作</strong>：在不同课程包之间调配合课时数</li>
            <li>📊 <strong>统计看板</strong>：实时展示学员数、消课量、剩余课时</li>
          </ul>
          <p style={{ marginTop: '16px' }}>
            请点击左侧「学员管理」开始使用，或点击上方「总学员数」卡片直接跳转。
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
