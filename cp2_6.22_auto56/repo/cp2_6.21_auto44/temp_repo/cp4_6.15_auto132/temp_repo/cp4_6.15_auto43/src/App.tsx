import { useState, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import type { ReadingPlan } from './types';
import PlanCreator from './modules/plan/PlanCreator';
import CalendarGrid from './modules/plan/CalendarGrid';
import ProgressDashboard from './modules/tracking/ProgressDashboard';
import ReadingChart from './modules/tracking/ReadingChart';

export default function App() {
  const location = useLocation();
  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const handlePlanCreated = useCallback((newPlan: ReadingPlan) => {
    setPlan(newPlan);
    setSelectedMemberId(newPlan.members[0]?.id || null);
  }, []);

  const handleToggleComplete = useCallback(
    (date: string) => {
      if (!plan) return;

      setPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          dailyAssignments: prev.dailyAssignments.map((a) =>
            a.date === date
              ? {
                  ...a,
                  isCompleted: !a.isCompleted,
                  completedBy: !a.isCompleted
                    ? [...new Set([...a.completedBy, 'me'])]
                    : a.completedBy.filter((m) => m !== 'me'),
                }
              : a
          ),
        };
      });
    },
    [plan]
  );

  const handleProgressUpdate = useCallback(
    (memberId: string, date: string, pages: number) => {
      setPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members.map((m) => {
            if (m.id !== memberId) return m;
            const existingIdx = m.dailyProgress.findIndex((p) => p.date === date);
            let newProgress;
            if (existingIdx >= 0) {
              newProgress = [...m.dailyProgress];
              newProgress[existingIdx] = { date, pagesRead: pages };
            } else {
              newProgress = [...m.dailyProgress, { date, pagesRead: pages }];
            }
            return {
              ...m,
              dailyProgress: newProgress,
              totalPagesRead: newProgress.reduce((s, p) => s + p.pagesRead, 0),
            };
          }),
        };
      });
    },
    []
  );

  const handleLikeMilestone = useCallback(
    (milestoneId: string, memberId: string) => {
      setPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          milestones: prev.milestones.map((m) => {
            if (m.id !== milestoneId) return m;
            const hasLiked = m.likes.includes(memberId);
            return {
              ...m,
              likes: hasLiked
                ? m.likes.filter((l) => l !== memberId)
                : [...m.likes, memberId],
            };
          }),
        };
      });
    },
    []
  );

  const handleAddComment = useCallback(
    (milestoneId: string, memberId: string, content: string) => {
      setPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          milestones: prev.milestones.map((m) => {
            if (m.id !== milestoneId) return m;
            return {
              ...m,
              comments: [
                ...m.comments,
                {
                  id: `c-${Date.now()}`,
                  memberId,
                  content,
                  createdAt: new Date().toISOString(),
                },
              ],
            };
          }),
        };
      });
    },
    []
  );

  const navItems = [
    { path: '/', label: '计划中心', icon: '📋' },
    { path: '/dashboard', label: '进度看板', icon: '📊' },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="glass-card sidebar-inner">
          <div className="logo-section">
            <div className="logo-icon">📖</div>
            <div>
              <h1 className="logo-title">共读追踪</h1>
              <p className="logo-subtitle">Book Club Tracker</p>
            </div>
          </div>

          <nav className="nav-list">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${
                    isActive ? 'nav-link-active' : 'nav-link-inactive'
                  }`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {plan && (
            <div className="current-plan-section">
              <div className="current-plan-label">当前计划</div>
              <div className="current-plan-card">
                <div className="current-plan-title">{plan.bookTitle}</div>
                <div className="current-plan-author">{plan.author}</div>
                <div className="current-plan-meta">
                  {plan.totalChapters}章 · {plan.totalPages}页
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">
        <header className="glass-card page-header">
          <div>
            <h2 className="page-title">
              {location.pathname === '/' ? '📋 阅读计划管理' : '📊 进度追踪看板'}
            </h2>
            <p className="page-subtitle">
              {location.pathname === '/'
                ? '创建和管理你的社群共读计划'
                : '追踪全队和每个人的阅读进度'}
            </p>
          </div>
          {plan && (
            <div className="member-avatars-group">
              <div className="member-avatars-label">队员</div>
              <div className="member-avatars-row">
                {plan.members.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    className="member-avatar-sm"
                    style={{
                      background: `${m.color}22`,
                      boxShadow: `0 0 12px ${m.color}55`,
                    }}
                  >
                    {m.avatar}
                  </div>
                ))}
              </div>
            </div>
          )}
        </header>

        <Routes>
          <Route
            path="/"
            element={
              <div className="content-space">
                {!plan && <PlanCreator onPlanCreated={handlePlanCreated} />}
                {plan && (
                  <>
                    <div
                      className="glass-card plan-info-card"
                      style={{ animation: 'fadeInUp 0.5s ease' }}
                    >
                      <div className="plan-info-header">
                        <div>
                          <div className="plan-book-title">
                            <h3 className="plan-book-title-text">📖 {plan.bookTitle}</h3>
                          </div>
                          <p className="plan-book-author">作者：{plan.author}</p>
                          <div className="plan-meta-row">
                            <div className="plan-meta-item">
                              章节数：
                              <span className="plan-meta-value">
                                {plan.totalChapters}章
                              </span>
                            </div>
                            <div className="plan-meta-item">
                              总页数：
                              <span className="plan-meta-value">
                                {plan.totalPages}页
                              </span>
                            </div>
                            <div className="plan-meta-item">
                              周期：
                              <span className="plan-meta-value">
                                {plan.startDate} ~ {plan.endDate}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setPlan(null);
                            setSelectedMemberId(null);
                          }}
                        >
                          新建计划
                        </button>
                      </div>
                    </div>
                    <CalendarGrid
                      assignments={plan.dailyAssignments}
                      onToggleComplete={handleToggleComplete}
                    />
                  </>
                )}
              </div>
            }
          />
          <Route
            path="/dashboard"
            element={
              plan ? (
                <ProgressDashboard
                  plan={plan}
                  selectedMemberId={selectedMemberId || plan.members[0]?.id}
                  onSelectMember={setSelectedMemberId}
                  onProgressUpdate={handleProgressUpdate}
                  onLikeMilestone={handleLikeMilestone}
                  onAddComment={handleAddComment}
                />
              ) : (
                <div
                  className="glass-card empty-state"
                  style={{ animation: 'fadeInUp 0.5s ease' }}
                >
                  <div className="empty-state-icon">📚</div>
                  <h3 className="empty-state-title">还没有阅读计划</h3>
                  <p className="empty-state-desc">请先到计划中心创建一个共读计划</p>
                  <Link to="/" className="btn btn-primary">
                    前往创建 →
                  </Link>
                </div>
              )
            }
          />
        </Routes>

        {plan &&
          location.pathname === '/dashboard' &&
          selectedMemberId &&
          (() => {
            const member = plan.members.find((m) => m.id === selectedMemberId);
            if (!member) return null;
            return (
              <div className="mt-6">
                <ReadingChart
                  dailyAssignments={plan.dailyAssignments}
                  memberProgress={member.dailyProgress}
                  memberName={member.name}
                  memberColor={member.color}
                  totalPages={plan.totalPages}
                />
              </div>
            );
          })()}
      </main>
    </div>
  );
}
