import React, { useMemo, useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useFeedbackStore } from '../../feedback/store/feedbackStore';
import { generateWordCloud, formatDate, getScoreColor } from '../utils/wordCloud';
import { renderStars } from '../../../shared/utils/StarRating';
import FeedbackCard from '../../feedback/components/FeedbackCard';

interface MeetingDashboardProps {
  meetingId: string;
}

const MeetingDashboard: React.FC<MeetingDashboardProps> = ({ meetingId }) => {
  const { getMeetingById, getMeetingStats, getSortedFeedbacks, setCurrentView, setCurrentMeeting } =
    useFeedbackStore();
  const [renderTime, setRenderTime] = useState<number | null>(null);
  const startTime = useMemo(() => performance.now(), []);

  const meeting = getMeetingById(meetingId);
  const stats = getMeetingStats(meetingId);
  const feedbacks = getSortedFeedbacks(meetingId);
  const unprocessedCount = feedbacks.filter((f) => !f.isProcessed).length;

  useEffect(() => {
    const elapsed = performance.now() - startTime;
    setRenderTime(elapsed);
  }, [startTime]);

  const lineChartData = useMemo(() => {
    return stats.scoreTrend.map((item, index) => ({
      ...item,
      avg: stats.scoreTrend.slice(0, index + 1).reduce((s, i) => s + i.score, 0) / (index + 1),
    }));
  }, [stats.scoreTrend]);

  const pieChartData = useMemo(() => {
    return [
      { name: '1星', value: stats.ratingDistribution[1], color: '#ef4444' },
      { name: '2星', value: stats.ratingDistribution[2], color: '#f97316' },
      { name: '3星', value: stats.ratingDistribution[3], color: '#eab308' },
      { name: '4星', value: stats.ratingDistribution[4], color: '#84cc16' },
      { name: '5星', value: stats.ratingDistribution[5], color: '#10b981' },
    ].filter((d) => d.value > 0);
  }, [stats.ratingDistribution]);

  const wordCloudData = useMemo(() => {
    const texts = feedbacks.map((f) => f.keyTakeaways);
    return generateWordCloud(texts, 25);
  }, [feedbacks]);

  const avgScoreColor = getScoreColor(stats.avgScore);

  if (!meeting) {
    return (
      <div style={styles.emptyState}>
        <p style={{ color: '#64748b', marginBottom: '16px' }}>未找到该会议</p>
        <button
          onClick={() => {
            setCurrentMeeting(null);
            setCurrentView('list');
          }}
          style={styles.backBtn}
        >
          返回会议列表
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <div style={styles.breadcrumb}>
            <button
              onClick={() => {
                setCurrentMeeting(null);
                setCurrentView('list');
              }}
              style={styles.linkBtn}
            >
              ← 返回列表
            </button>
            <span style={{ margin: '0 8px', color: '#94a3b8' }}>/</span>
            <span style={{ color: '#64748b' }}>会议详情</span>
          </div>
          <h1 style={styles.title}>{meeting.title}</h1>
          <div style={styles.metaRow}>
            <span style={styles.metaItem}>📅 {formatDate(meeting.createdAt)}</span>
            <span style={styles.metaItem}>👤 创建者：{meeting.createdBy}</span>
            <span style={styles.metaItem}>👥 预估参与：{meeting.participantCount}人</span>
          </div>
        </div>
        <div style={styles.addFeedbackBtn}>
          <button
            onClick={() => setCurrentView('create')}
            style={styles.primaryBtn}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            + 新增反馈
          </button>
        </div>
      </div>

      <div style={styles.statsCards}>
        <div style={{ ...styles.statCard, borderLeftColor: '#2563eb' }} className="stagger-1">
          <div style={styles.statIcon}>📝</div>
          <div>
            <div style={styles.statValue}>{stats.totalFeedbacks}</div>
            <div style={styles.statLabel}>反馈总数</div>
          </div>
        </div>
        <div style={{ ...styles.statCard, borderLeftColor: avgScoreColor }} className="stagger-2">
          <div style={styles.starIcon}>{renderStars(Math.round(stats.avgScore), 18)}</div>
          <div>
            <div style={{ ...styles.statValue, color: avgScoreColor }}>
              {stats.avgScore.toFixed(1)}
            </div>
            <div style={styles.statLabel}>平均分</div>
          </div>
        </div>
        <div style={{ ...styles.statCard, borderLeftColor: '#10b981' }} className="stagger-3">
          <div style={styles.statIcon}>✅</div>
          <div>
            <div style={styles.statValue}>
              {stats.processedCount}/{stats.totalFeedbacks}
            </div>
            <div style={styles.statLabel}>已处理</div>
          </div>
        </div>
        <div style={{ ...styles.statCard, borderLeftColor: '#f97316' }} className="stagger-4">
          <div style={styles.statIcon}>⏳</div>
          <div>
            <div style={{ ...styles.statValue, color: '#f97316' }}>{unprocessedCount}</div>
            <div style={styles.statLabel}>待处理</div>
          </div>
        </div>
      </div>

      {renderTime !== null && (
        <div style={styles.perfBadge}>
          ⚡ 仪表盘渲染耗时：{renderTime.toFixed(0)}ms
          {renderTime > 500 && <span style={{ color: '#ef4444' }}>（超出500ms要求）</span>}
        </div>
      )}

      <div style={styles.chartsGrid}>
        <div style={styles.chartCard} className="stagger-1">
          <h3 style={styles.chartTitle}>📈 评分趋势</h3>
          {lineChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={lineChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="index"
                  stroke="#94a3b8"
                  fontSize={12}
                  label={{ value: '反馈序号', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 5]}
                  stroke="#94a3b8"
                  fontSize={12}
                  ticks={[1, 2, 3, 4, 5]}
                />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                    fontSize: '13px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)} 分`,
                    name === 'score' ? '单次评分' : '累计平均',
                  ]}
                  labelFormatter={(label) => `第 ${label} 条反馈`}
                />
                <Legend
                  formatter={(value) => (value === 'score' ? '单次评分' : '累计平均')}
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={600}
                />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#f97316"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#f97316', strokeWidth: 2, r: 3 }}
                  animationDuration={600}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={styles.emptyChart}>暂无数据</div>
          )}
        </div>

        <div style={styles.chartCard} className="stagger-2">
          <h3 style={styles.chartTitle}>🥧 满意度分布</h3>
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  animationDuration={600}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                    fontSize: '13px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} 条 (${((value / stats.totalFeedbacks) * 100).toFixed(0)}%)`,
                    name,
                  ]}
                />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  formatter={(value) => <span style={{ fontSize: '12px' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={styles.emptyChart}>暂无数据</div>
          )}
        </div>

        <div style={{ ...styles.chartCard, gridColumn: '1 / -1' }} className="stagger-3">
          <h3 style={styles.chartTitle}>☁️ 关键词云</h3>
          {wordCloudData.length > 0 ? (
            <div style={styles.wordCloud}>
              {wordCloudData.map((item, index) => (
                <span
                  key={item.word}
                  style={{
                    fontSize: `${item.fontSize}px`,
                    color: item.color,
                    fontWeight: 500 + Math.floor(item.fontSize / 12),
                    padding: '4px 8px',
                    display: 'inline-block',
                    opacity: 0,
                    animation: `fadeIn 0.5s ease ${index * 30}ms forwards`,
                  }}
                >
                  {item.word}
                </span>
              ))}
            </div>
          ) : (
            <div style={styles.emptyChart}>暂无关键词数据</div>
          )}
        </div>
      </div>

      <div style={styles.feedbackSection}>
        <h2 style={styles.sectionTitle}>
          <span>💬</span> 反馈列表
          <span style={styles.countBadge}>{feedbacks.length}条</span>
        </h2>
        {feedbacks.length === 0 ? (
          <div style={styles.emptyFeedbacks}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <p style={{ color: '#64748b', marginBottom: '16px' }}>暂无反馈，成为第一个提交反馈的人吧！</p>
            <button
              onClick={() => setCurrentView('create')}
              style={styles.primaryBtn}
            >
              提交反馈
            </button>
          </div>
        ) : (
          <div style={styles.feedbackList}>
            {feedbacks.map((feedback, index) => (
              <React.Fragment key={feedback.id}>
                {index === feedbacks.length - unprocessedCount && unprocessedCount > 0 && (
                  <div style={styles.divider}>
                    <span style={styles.dividerText}>—— 已处理 ——</span>
                  </div>
                )}
                <FeedbackCard
                  feedback={feedback}
                  index={index}
                  isLastUnprocessed={index === feedbacks.length - unprocessedCount - 1}
                />
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
  },
  backBtn: {
    padding: '12px 24px',
    background: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    fontWeight: 500,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  breadcrumb: {
    fontSize: '13px',
    marginBottom: '8px',
  },
  linkBtn: {
    color: '#2563eb',
    fontSize: '13px',
    fontWeight: 500,
  },
  title: {
    fontSize: '32px',
    color: '#1e293b',
    marginBottom: '12px',
  },
  metaRow: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  metaItem: {
    fontSize: '14px',
    color: '#64748b',
  },
  addFeedbackBtn: {
    flexShrink: 0,
  },
  primaryBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #f97316, #ea580c)',
    color: '#ffffff',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '14px',
    boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)',
    transition: 'all 0.2s ease',
  },
  statsCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
    borderLeft: '4px solid',
    opacity: 0,
    animation: 'fadeIn 0.4s ease forwards',
  },
  statIcon: {
    fontSize: '32px',
  },
  starIcon: {
    display: 'flex',
    alignItems: 'center',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1e293b',
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '2px',
  },
  perfBadge: {
    fontSize: '12px',
    color: '#64748b',
    textAlign: 'right',
    marginBottom: '16px',
    fontStyle: 'italic',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  chartCard: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
    opacity: 0,
    animation: 'fadeIn 0.4s ease forwards',
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '20px',
  },
  wordCloud: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    minHeight: '180px',
  },
  emptyChart: {
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a3b8',
    fontSize: '14px',
  },
  feedbackSection: {
    marginTop: '40px',
  },
  sectionTitle: {
    fontSize: '22px',
    color: '#1e293b',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  countBadge: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#2563eb',
    background: 'rgba(37, 99, 235, 0.1)',
    padding: '4px 10px',
    borderRadius: '20px',
    marginLeft: '8px',
  },
  emptyFeedbacks: {
    textAlign: 'center',
    padding: '60px 20px',
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
  },
  feedbackList: {
    display: 'flex',
    flexDirection: 'column',
  },
  divider: {
    textAlign: 'center',
    padding: '16px 0',
    margin: '8px 0',
  },
  dividerText: {
    fontSize: '12px',
    color: '#94a3b8',
    background: '#f8fafc',
    padding: '4px 16px',
    borderRadius: '12px',
  },
};

const responsiveStyles = `
  @media (max-width: 768px) {
    div[style*="chartsGrid"] {
      grid-template-columns: 1fr !important;
    }
    div[style*="chartCard"][style*="gridColumn"] {
      grid-column: auto !important;
    }
    div[style*="header"] {
      flex-direction: column;
    }
    div[style*="metaRow"] {
      flex-direction: column;
      gap: 8px !important;
    }
  }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = responsiveStyles;
document.head.appendChild(styleSheet);

export default MeetingDashboard;
