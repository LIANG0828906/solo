import { useState, useEffect, useMemo } from 'react';
import type { ReadingPlan } from '../../types';
import { formatDate } from '../../utils/calculateProgress';

interface ProgressDashboardProps {
  plan: ReadingPlan;
  selectedMemberId: string;
  onSelectMember: (id: string) => void;
  onProgressUpdate: (memberId: string, date: string, pages: number) => void;
  onLikeMilestone: (milestoneId: string, memberId: string) => void;
  onAddComment: (milestoneId: string, memberId: string, content: string) => void;
}

export default function ProgressDashboard({
  plan,
  selectedMemberId,
  onSelectMember,
  onProgressUpdate,
  onLikeMilestone,
  onAddComment,
}: ProgressDashboardProps) {
  const [progressInput, setProgressInput] = useState<number>(0);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [ringKey, setRingKey] = useState(0);

  const teamProgress = useMemo(() => {
    if (plan.members.length === 0) return 0;
    const totalPlannedPages = plan.dailyAssignments.reduce(
      (sum, d) => sum + d.pageCount,
      0
    );
    const totalReadPages = plan.members.reduce(
      (sum, m) =>
        sum + m.dailyProgress.reduce((s, p) => s + p.pagesRead, 0),
      0
    );
    const avgPages = totalReadPages / plan.members.length;
    return Math.min(100, Math.round((avgPages / totalPlannedPages) * 100));
  }, [plan]);

  useEffect(() => {
    const duration = 1200;
    const startTime = Date.now();
    const startValue = animatedProgress;
    const endValue = teamProgress;

    if (startValue === endValue) return;

    setRingKey((k) => k + 1);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * easeOut);
      setAnimatedProgress(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [teamProgress]);

  const rankedMembers = useMemo(() => {
    const totalPlanned = plan.dailyAssignments.reduce(
      (sum, d) => sum + d.pageCount,
      0
    );
    return [...plan.members]
      .map((m) => {
        const totalRead = m.dailyProgress.reduce(
          (s, p) => s + p.pagesRead,
          0
        );
        const ratio = totalPlanned > 0 ? (totalRead / totalPlanned) * 100 : 0;
        return { ...m, ratio: Math.round(ratio), totalRead };
      })
      .sort((a, b) => b.totalRead - a.totalRead);
  }, [plan.members, plan.dailyAssignments]);

  const selectedMember = plan.members.find((m) => m.id === selectedMemberId);

  const handleSubmitProgress = () => {
    if (!selectedMember || progressInput <= 0) return;
    const today = formatDate(new Date());
    onProgressUpdate(selectedMember.id, today, progressInput);
    setProgressInput(0);
  };

  const handleSubmitComment = (milestoneId: string) => {
    const content = commentInputs[milestoneId]?.trim();
    if (!content || !selectedMember) return;
    onAddComment(milestoneId, selectedMember.id, content);
    setCommentInputs((prev) => ({ ...prev, [milestoneId]: '' }));
  };

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  return (
    <div className="content-space">
      <div
        className="glass-card dashboard-card"
        style={{ animation: 'fadeInUp 0.5s ease' }}
      >
        <div className="dashboard-top">
          <div className="progress-ring-container">
            <svg
              key={ringKey}
              width="220"
              height="220"
              viewBox="0 0 220 220"
              className="transform-rotate"
            >
              <defs>
                <linearGradient
                  id="progressGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="50%" stopColor="#764ba2" />
                  <stop offset="100%" stopColor="#f093fb" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle
                cx="110"
                cy="110"
                r="90"
                fill="none"
                stroke="rgba(102, 126, 234, 0.1)"
                strokeWidth="14"
              />
              <circle
                cx="110"
                cy="110"
                r="90"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                filter="url(#glow)"
                style={{
                  transition: 'stroke-dashoffset 0.3s ease',
                }}
              />
            </svg>
            <div className="progress-ring-text">
              <div
                key={animatedProgress}
                className="progress-ring-number"
                style={{ animation: 'countUp 0.5s ease' }}
              >
                {animatedProgress}%
              </div>
              <div className="progress-ring-label">全队完成度</div>
            </div>
          </div>

          <div className="dashboard-stats">
            <div className="stats-grid">
              <StatCard icon="📖" label="总页数" value={`${plan.totalPages}`} sub="页" />
              <StatCard icon="👥" label="队员" value={`${plan.members.length}`} sub="人" />
              <StatCard icon="🏆" label="里程碑" value={`${plan.milestones.length}`} sub="个" />
              <StatCard icon="📅" label="剩余天数" value={getRemainingDays(plan.endDate)} sub="天" />
            </div>

            {selectedMember && (
              <div className="progress-input-card">
                <div className="progress-input-header">
                  <div
                    className="member-avatar-md"
                    style={{
                      background: `${selectedMember.color}22`,
                      boxShadow: `0 0 20px ${selectedMember.color}44`,
                    }}
                  >
                    {selectedMember.avatar}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="progress-input-title">{selectedMember.name} 的今日打卡</div>
                    <div className="progress-input-desc">提交今日阅读页数，更新你的进度</div>
                  </div>
                </div>
                <div className="progress-input-row">
                  <input
                    type="number"
                    min="0"
                    className="input"
                    style={{ flex: 1 }}
                    placeholder="今日阅读页数..."
                    value={progressInput || ''}
                    onChange={(e) => setProgressInput(Number(e.target.value))}
                  />
                  <button className="btn btn-primary" onClick={handleSubmitProgress}>
                    ✓ 提交进度
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div
          className="glass-card ranking-card"
          style={{ animation: 'fadeInUp 0.5s ease 0.1s both' }}
        >
          <h3 className="ranking-title">
            <span className="ranking-title-icon">🏅</span>
            阅读排行榜
          </h3>
          <div className="ranking-list">
            {rankedMembers.map((member, index) => {
              const isSelected = member.id === selectedMemberId;
              const medals = ['🥇', '🥈', '🥉'];
              const itemClass = `ranking-item ${
                isSelected ? 'ranking-item-selected' : ''
              }`;

              return (
                <div
                  key={member.id}
                  onClick={() => onSelectMember(member.id)}
                  className={itemClass}
                >
                  <div className="ranking-medal">
                    {medals[index] || (
                      <span className="ranking-medal-num">{index + 1}</span>
                    )}
                  </div>
                  <div
                    className="member-avatar-ranking"
                    style={{
                      background: `${member.color}22`,
                      boxShadow: `0 0 16px ${member.color}44`,
                    }}
                  >
                    <div
                      className="member-avatar-glow"
                      style={{
                        background: `radial-gradient(circle, ${member.color} 0%, transparent 70%)`,
                      }}
                    />
                    <span className="member-avatar-content">{member.avatar}</span>
                  </div>
                  <div className="ranking-info">
                    <div className="ranking-name">
                      {member.name}
                      {isSelected && (
                        <span className="selected-badge">选中</span>
                      )}
                    </div>
                    <div className="ranking-read">已读 {member.totalRead} 页</div>
                  </div>
                  <div className="ranking-ratio">
                    <div
                      className="ranking-ratio-value"
                      style={{ color: member.color }}
                    >
                      {member.ratio}%
                    </div>
                    <div className="ranking-ratio-bar">
                      <div
                        className="ranking-ratio-fill"
                        style={{
                          width: `${member.ratio}%`,
                          background: `linear-gradient(90deg, ${member.color}, ${member.color}99)`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="glass-card milestones-card"
          style={{ animation: 'fadeInUp 0.5s ease 0.2s both' }}
        >
          <h3 className="milestones-title">
            <span className="milestones-title-icon">🎯</span>
            里程碑时间线
          </h3>
          <div className="timeline-wrapper">
            <div className="timeline-line" />

            {plan.milestones.length === 0 && (
              <div className="empty-timeline">
                <div className="empty-timeline-icon">🌱</div>
                <div>还没有完成的里程碑</div>
              </div>
            )}

            {plan.milestones.map((milestone, idx) => (
              <div
                key={milestone.id}
                className="timeline-item"
                style={{
                  animation: `slideInLeft 0.5s ease ${idx * 0.1}s both`,
                }}
              >
                <div className="timeline-marker">🏅</div>

                <div className="glass-card milestone-card">
                  <div className="milestone-header">
                    <div>
                      <h4 className="milestone-name">{milestone.title}</h4>
                      <div className="milestone-date">
                        📅 完成于 {milestone.completedAt}
                      </div>
                    </div>
                    <button
                      className={`like-btn ${
                        milestone.likes.includes(selectedMemberId || '')
                          ? 'like-btn-liked'
                          : 'like-btn-unliked'
                      }`}
                      onClick={() =>
                        onLikeMilestone(
                          milestone.id,
                          selectedMemberId || plan.members[0].id
                        )
                      }
                    >
                      <span className={milestone.likes.length > 0 ? 'animate-pulse' : ''}>
                        {milestone.likes.includes(selectedMemberId || '') ? '❤️' : '🤍'}
                      </span>
                      {milestone.likes.length}
                    </button>
                  </div>

                  <div className="milestone-comments">
                    {milestone.comments.map((comment) => {
                      const commentMember = plan.members.find(
                        (m) => m.id === comment.memberId
                      );
                      return (
                        <div
                          key={comment.id}
                          className="comment-item"
                          style={{ animation: 'fadeInUp 0.3s ease' }}
                        >
                          <div
                            className="member-avatar-xs"
                            style={{
                              background: `${commentMember?.color || '#999'}22`,
                            }}
                          >
                            {commentMember?.avatar || '👤'}
                          </div>
                          <div className="comment-bubble">
                            <div className="comment-author">
                              {commentMember?.name || '匿名'}
                            </div>
                            <div className="comment-content">{comment.content}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="comment-input-row">
                    <input
                      type="text"
                      className="input"
                      style={{ flex: 1, paddingTop: 8, paddingBottom: 8, fontSize: 14 }}
                      placeholder="发表短评..."
                      value={commentInputs[milestone.id] || ''}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [milestone.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSubmitComment(milestone.id);
                      }}
                    />
                    <button
                      className="btn btn-secondary"
                      style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, fontSize: 14 }}
                      onClick={() => handleSubmitComment(milestone.id)}
                    >
                      发送
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value}
        <span className="stat-sub">{sub}</span>
      </div>
    </div>
  );
}

function getRemainingDays(endDate: string): string {
  const end = new Date(endDate);
  const today = new Date();
  const diff = Math.ceil(
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return String(Math.max(0, diff));
}
