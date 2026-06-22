import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import OKRTimeline from '../components/OKRTimeline';
import { useAuth, useTheme } from '../context/AppContext';
import { okrApi, userApi } from '../api';
import type { Objective, User } from '../types';

const COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
];

const TimelinePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [quarterFilter, setQuarterFilter] = useState<string>('all');
  const [objectiveFilter, setObjectiveFilter] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [objRes, usersRes] = await Promise.all([
          okrApi.getAll(),
          userApi.getAll(),
        ]);
        setObjectives(objRes.objectives);
        setUsers(usersRes.users);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const quarters = useMemo(() => {
    const set = new Set(objectives.map((o) => o.quarter));
    return Array.from(set).sort();
  }, [objectives]);

  const filteredByQuarter = useMemo(() => {
    if (quarterFilter === 'all') return objectives;
    return objectives.filter((o) => o.quarter === quarterFilter);
  }, [objectives, quarterFilter]);

  const objectivesForFilter = filteredByQuarter;

  const timelineKeyResults = useMemo(() => {
    const krs: {
      id: string;
      title: string;
      description?: string;
      progress: number;
      ownerId: string;
      deadline: string;
      score?: number;
      feedback?: string;
      priority: number;
      weeklyProgress: { week: number; progress: number }[];
      createdAt: string;
      updatedAt: string;
      color: string;
      owner?: User;
    }[] = [];
    let colorIdx = 0;

    const targets =
      objectiveFilter === 'all'
        ? filteredByQuarter
        : filteredByQuarter.filter((o) => o.id === objectiveFilter);

    targets.forEach((obj) => {
      obj.keyResults.forEach((kr) => {
        const owner = users.find((u) => u.id === kr.ownerId);
        krs.push({
          ...kr,
          color: COLORS[colorIdx % COLORS.length],
          owner,
        });
        colorIdx++;
      });
    });
    return krs;
  }, [filteredByQuarter, objectiveFilter, users]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const avgProgress = useMemo(() => {
    if (timelineKeyResults.length === 0) return 0;
    return Math.round(
      timelineKeyResults.reduce((s, kr) => s + kr.progress, 0) / timelineKeyResults.length
    );
  }, [timelineKeyResults]);

  const completedCount = useMemo(
    () => timelineKeyResults.filter((kr) => kr.progress >= 100).length,
    [timelineKeyResults]
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">📈 时间轴</h1>
          <nav style={{ display: 'flex', gap: 4 }}>
            <Link to="/board" className="btn btn-secondary">
              看板
            </Link>
            <Link
              to="/timeline"
              className="btn"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
              }}
            >
              时间轴
            </Link>
          </nav>
          {quarters.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                季度：
              </span>
              <select
                className="select"
                value={quarterFilter}
                onChange={(e) => {
                  setQuarterFilter(e.target.value);
                  setObjectiveFilter('all');
                }}
              >
                <option value="all">全部季度</option>
                {quarters.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>
          )}
          {objectivesForFilter.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                目标：
              </span>
              <select
                className="select"
                value={objectiveFilter}
                onChange={(e) => setObjectiveFilter(e.target.value)}
              >
                <option value="all">全部目标</option>
                {objectivesForFilter.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title.length > 24 ? o.title.slice(0, 24) + '…' : o.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" onClick={toggleTheme}>
            {theme === 'light' ? '🌙 暗色' : '☀️ 亮色'}
          </button>
          {user && (
            <div className="user-info">
              <span className="user-avatar">{user.avatar}</span>
              <span style={{ fontWeight: 500 }}>{user.name}</span>
              <span
                style={{
                  fontSize: 11,
                  padding: '1px 6px',
                  borderRadius: 8,
                  backgroundColor:
                    user.role === 'manager'
                      ? 'var(--color-primary)'
                      : 'var(--color-text-secondary)',
                  color: '#fff',
                }}
              >
                {user.role === 'manager' ? '管理员' : '成员'}
              </span>
            </div>
          )}
          <button className="btn btn-secondary" onClick={handleLogout}>
            退出
          </button>
        </div>
      </header>

      <main className="page-content" style={{ flex: 1 }}>
        {loading ? (
          <div className="loading">加载中</div>
        ) : timelineKeyResults.length === 0 ? (
          <div className="empty">
            <div className="empty-title">暂无数据</div>
            <p>当前筛选条件下没有关键结果，请切换筛选条件或创建OKR</p>
            <Link to="/board" className="btn btn-primary" style={{ marginTop: 16 }}>
              前往看板
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
              }}
            >
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  关键结果总数
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)' }}>
                  {timelineKeyResults.length}
                </div>
              </div>
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  平均进度
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color:
                      avgProgress >= 80
                        ? 'var(--color-success)'
                        : avgProgress >= 50
                        ? 'var(--color-warning)'
                        : 'var(--color-danger)',
                  }}
                >
                  {avgProgress}%
                </div>
              </div>
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  已完成
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-success)' }}>
                  {completedCount}
                </div>
              </div>
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  进行中
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-warning)' }}>
                  {timelineKeyResults.length - completedCount}
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                    关键结果进度趋势
                  </h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                    展示第1-13周各关键结果的进度变化曲线
                  </p>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  共 {timelineKeyResults.length} 条关键结果 · 点击图例可切换显示
                </div>
              </div>
              <OKRTimeline keyResults={timelineKeyResults} weeks={13} />
            </div>

            <div className="card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>关键结果详情</h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 10,
                }}
              >
                {timelineKeyResults.map((kr) => (
                  <div
                    key={kr.id}
                    style={{
                      padding: 12,
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${kr.color}40`,
                      backgroundColor: `${kr.color}0a`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: kr.color,
                          marginTop: 5,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                          {kr.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          <span>{kr.owner?.avatar}</span>
                          <span>{kr.owner?.name || '未知'}</span>
                          {kr.score !== undefined && (
                            <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                              · ★{kr.score}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color:
                            kr.progress >= 80
                              ? 'var(--color-success)'
                              : kr.progress >= 50
                              ? 'var(--color-warning)'
                              : 'var(--color-danger)',
                        }}
                      >
                        {kr.progress}%
                      </div>
                    </div>
                    <div
                      style={{
                        height: 3,
                        backgroundColor: 'var(--color-border)',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${kr.progress}%`,
                          backgroundColor: kr.color,
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TimelinePage;
