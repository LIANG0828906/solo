import React from 'react';
import { useFeedbackStore } from '../../feedback/store/feedbackStore';
import { getScoreGradient, getScoreColor, formatDate } from '../../analytics/utils/wordCloud';
import { renderStars } from '../../../shared/utils/StarRating';

const MeetingList: React.FC = () => {
  const { getMeetingsByMonth, getMeetingFeedbacks, getMeetingAvgScore, setCurrentMeeting, setCurrentView } =
    useFeedbackStore();

  const meetingsByMonth = getMeetingsByMonth();
  const months = Object.keys(meetingsByMonth);

  const handleMeetingClick = (meetingId: string) => {
    setCurrentMeeting(meetingId);
    setCurrentView('detail');
  };

  if (months.length === 0) {
    return (
      <div style={styles.container} className="fade-in">
        <div style={styles.header}>
          <h1 style={styles.title}>历史会议</h1>
          <p style={styles.subtitle}>查看和管理所有会议反馈</p>
        </div>
        <div style={styles.emptyState}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📋</div>
          <h3 style={styles.emptyTitle}>还没有会议记录</h3>
          <p style={styles.emptyDesc}>创建你的第一个会议，开始收集反馈吧！</p>
          <button
            onClick={() => setCurrentView('create')}
            style={styles.createBtn}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            + 创建新会议
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>历史会议</h1>
          <p style={styles.subtitle}>查看和管理所有会议反馈</p>
        </div>
        <button
          onClick={() => setCurrentView('create')}
          style={styles.createBtn}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          + 新建会议
        </button>
      </div>

      {months.map((month, monthIndex) => (
        <div key={month} style={styles.monthSection}>
          <h2 style={styles.monthTitle}>
            <span style={styles.monthIcon}>📅</span>
            {month}
            <span style={styles.monthCount}>
              {meetingsByMonth[month].length} 场会议
            </span>
          </h2>
          <div style={styles.meetingsGrid}>
            {meetingsByMonth[month].map((meeting, index) => {
              const feedbacks = getMeetingFeedbacks(meeting.id);
              const avgScore = getMeetingAvgScore(meeting.id);
              const scoreGradient = getScoreGradient(avgScore);
              const scoreColor = getScoreColor(avgScore);

              return (
                <div
                  key={meeting.id}
                  onClick={() => handleMeetingClick(meeting.id)}
                  style={{
                    ...styles.meetingCard,
                    background: scoreGradient,
                    animationDelay: `${(monthIndex * meetingsByMonth[month].length + index) * 40}ms`,
                  }}
                  className="fade-in"
                >
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>{meeting.title}</h3>
                    {avgScore > 0 && (
                      <div style={{ ...styles.scoreBadge, background: scoreColor }}>
                        {avgScore.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div style={styles.cardMeta}>
                    <div style={styles.metaItem}>
                      <span>📅</span>
                      {formatDate(meeting.createdAt)}
                    </div>
                    <div style={styles.metaItem}>
                      <span>👤</span>
                      {meeting.createdBy}
                    </div>
                  </div>
                  <div style={styles.cardFooter}>
                    <div style={styles.footerItem}>
                      <span style={styles.footerIcon}>👥</span>
                      <span style={styles.footerLabel}>参与</span>
                      <span style={styles.footerValue}>{meeting.participantCount}</span>
                    </div>
                    <div style={styles.footerItem}>
                      <span style={styles.footerIcon}>💬</span>
                      <span style={styles.footerLabel}>反馈</span>
                      <span style={styles.footerValue}>{feedbacks.length}</span>
                    </div>
                    <div style={styles.footerItem}>
                      <span style={styles.footerIcon}>⭐</span>
                      <span style={styles.footerLabel}>评分</span>
                      <span style={{ ...styles.footerValue, color: scoreColor }}>
                        {avgScore > 0 ? renderStars(Math.round(avgScore), 14) : '-'}
                      </span>
                    </div>
                  </div>
                  <div style={styles.cardArrow}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '40px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '36px',
    color: '#1e293b',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#64748b',
  },
  createBtn: {
    padding: '12px 28px',
    background: 'linear-gradient(135deg, #f97316, #ea580c)',
    color: '#ffffff',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '15px',
    boxShadow: '0 4px 16px rgba(249, 115, 22, 0.35)',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    background: '#ffffff',
    borderRadius: '20px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
  },
  emptyTitle: {
    fontSize: '22px',
    color: '#1e293b',
    marginBottom: '8px',
  },
  emptyDesc: {
    fontSize: '15px',
    color: '#64748b',
    marginBottom: '28px',
  },
  monthSection: {
    marginBottom: '36px',
  },
  monthTitle: {
    fontSize: '18px',
    color: '#334155',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingBottom: '12px',
    borderBottom: '2px solid #e2e8f0',
  },
  monthIcon: {
    fontSize: '20px',
  },
  monthCount: {
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: 500,
    marginLeft: 'auto',
    background: '#f1f5f9',
    padding: '4px 12px',
    borderRadius: '20px',
  },
  meetingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  meetingCard: {
    position: 'relative',
    background: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    opacity: 0,
    animation: 'fadeIn 0.4s ease forwards',
    willChange: 'transform, box-shadow',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    gap: '12px',
  },
  cardTitle: {
    fontSize: '17px',
    fontWeight: 600,
    color: '#1e293b',
    lineHeight: 1.4,
    flex: 1,
    margin: 0,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  scoreBadge: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '15px',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  cardMeta: {
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
  },
  metaItem: {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px',
    paddingRight: '30px',
  },
  footerItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    flex: 1,
  },
  footerIcon: {
    fontSize: '16px',
  },
  footerLabel: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  footerValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#334155',
  },
  cardArrow: {
    position: 'absolute',
    right: '16px',
    bottom: '20px',
    opacity: 0,
    transition: 'all 0.2s ease',
    transform: 'translateX(-4px)',
  },
};

const hoverStyles = `
  div[style*="meetingCard"]:hover {
    transform: translateY(-6px) scale(1.02) !important;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12) !important;
  }
  div[style*="meetingCard"]:hover div[style*="cardArrow"] {
    opacity: 1 !important;
    transform: translateX(0) !important;
  }
  button[style*="createBtn"]:hover {
    transform: scale(1.05) !important;
    box-shadow: 0 6px 24px rgba(249, 115, 22, 0.45) !important;
  }
  @media (max-width: 640px) {
    div[style*="meetingsGrid"] {
      grid-template-columns: 1fr !important;
    }
    div[style*="header"] {
      flex-direction: column !important;
      align-items: flex-start !important;
    }
  }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = hoverStyles;
document.head.appendChild(styleSheet);

export default MeetingList;
