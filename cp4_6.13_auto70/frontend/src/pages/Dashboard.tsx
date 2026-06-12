import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext';

interface Session {
  id: string;
  user_id: string;
  seat_id?: string;
  start_time: string;
  end_time?: string;
  duration?: number;
}

interface WeeklyData {
  day: string;
  date: string;
  duration: number;
}

interface MonthlyData {
  date: string;
  day: number;
  duration: number;
}

const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const [activeSession, setActiveSession] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [summaryClosing, setSummaryClosing] = useState(false);

  const fetchActiveSession = useCallback(async () => {
    try {
      const response = await fetch('/api/sessions/active', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.active) {
        setActiveSession(data.session);
      }
    } catch (error) {
      console.error('Failed to fetch active session:', error);
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/sessions/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchActiveSession();
    fetchStats();
  }, [fetchActiveSession, fetchStats]);

  useEffect(() => {
    if (activeSession) {
      const interval = setInterval(() => {
        const start = new Date(activeSession.start_time).getTime();
        const now = Date.now();
        setElapsedTime(Math.floor((now - start) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedTime(0);
    }
  }, [activeSession]);

  const handleStart = async () => {
    try {
      const response = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (response.ok) {
        setActiveSession(data.session);
        setElapsedTime(0);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleStop = async () => {
    try {
      const response = await fetch('/api/sessions/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setSummaryData(data);
        setShowSummary(true);
        setActiveSession(null);
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to stop session:', error);
    }
  };

  const closeSummary = () => {
    setSummaryClosing(true);
    setTimeout(() => {
      setShowSummary(false);
      setSummaryClosing(false);
    }, 400);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  const getHeatmapColor = (minutes: number) => {
    if (minutes === 0) return '#EBEDF0';
    if (minutes <= 15) return '#ADD8E6';
    if (minutes <= 30) return '#3498DB';
    if (minutes <= 60) return '#2980B9';
    return '#2C3E50';
  };

  const renderCalendarHeatmap = () => {
    if (!stats?.monthlyData) return null;

    const monthlyData = stats.monthlyData as MonthlyData[];
    const firstDay = new Date(monthlyData[0]?.date || new Date()).getDay();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

    const weeks: (MonthlyData | null)[][] = [];
    let currentWeek: (MonthlyData | null)[] = [];

    for (let i = 0; i < adjustedFirstDay; i++) {
      currentWeek.push(null);
    }

    for (const day of monthlyData) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    const dayLabels = ['一', '二', '三', '四', '五', '六', '日'];

    return (
      <div style={styles.heatmapContainer}>
        <div style={styles.heatmapHeader}>
          <span style={styles.heatmapTitle}>本月学习热力图</span>
          <div style={styles.heatmapLegend}>
            <span style={styles.legendLabel}>少</span>
            {['#EBEDF0', '#ADD8E6', '#3498DB', '#2980B9', '#2C3E50'].map((color, i) => (
              <div key={i} style={{ ...styles.heatmapCell, backgroundColor: color, width: 16, height: 16 }} />
            ))}
            <span style={styles.legendLabel}>多</span>
          </div>
        </div>
        <div style={styles.heatmapWrapper}>
          <div style={styles.weekLabels}>
            {dayLabels.map((d) => (
              <div key={d} style={styles.weekLabel}>{d}</div>
            ))}
          </div>
          <div style={styles.heatmapGrid}>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} style={styles.heatmapWeek}>
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    style={{
                      ...styles.heatmapCell,
                      backgroundColor: day ? getHeatmapColor(day.duration) : 'transparent',
                      visibility: day ? 'visible' : 'hidden',
                    }}
                    title={day ? `${day.date}: ${formatDuration(day.duration)}` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const GradientBar = (props: any) => {
    const { x, y, width, height } = props;
    const gradientId = `barGradient-${Math.random().toString(36).substr(2, 9)}`;
    return (
      <g>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#87CEEB" />
            <stop offset="100%" stopColor="#2C3E50" />
          </linearGradient>
        </defs>
        <rect x={x} y={y} width={width} height={height} fill={`url(#${gradientId})`} rx={4} />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontSize: '13px',
        }}>
          {`${payload[0].payload.day}: ${formatDuration(payload[0].value)}`}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-transition" style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.pageTitle}>学习统计</h1>

        <div className="card" style={styles.studyControl}>
          <div style={styles.studyInfo}>
            <h3 style={styles.studyTitle}>
              {activeSession ? '学习进行中' : '开始今天的学习'}
            </h3>
            {activeSession && (
              <div style={styles.timer}>{formatTime(elapsedTime)}</div>
            )}
            {!activeSession && (
              <p style={styles.studySubtitle}>
                点击按钮开始记录你的学习时长
              </p>
            )}
          </div>
          {activeSession ? (
            <button className="btn btn-danger" onClick={handleStop} style={styles.studyBtn}>
              结束学习
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleStart} style={styles.studyBtn}>
              开始学习
            </button>
          )}
        </div>

        <div className="card" style={styles.statsCard}>
          <h3 style={styles.statsTitle}>学习概览</h3>
          <div style={styles.statsGrid}>
            <div style={styles.statItem}>
              <div style={styles.statValue}>
                {stats ? formatDuration(stats.totalDuration || 0) : '--'}
              </div>
              <div style={styles.statLabel}>累计学习</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>
                {stats ? formatDuration(stats.todayDuration || 0) : '--'}
              </div>
              <div style={styles.statLabel}>今日学习</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>
                {stats ? `${stats.streak || 0}天` : '--'}
              </div>
              <div style={styles.statLabel}>连续学习</div>
            </div>
          </div>
        </div>

        <div className="card" style={styles.chartCard}>
          {renderCalendarHeatmap()}
        </div>

        <div className="card" style={styles.chartCard}>
          <h3 style={styles.chartTitle}>本周学习时长</h3>
          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats?.weeklyData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#7F8C8D', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#7F8C8D', fontSize: 11 }}
                  unit="分"
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="duration" radius={[4, 4, 0, 0]}>
                  {stats?.weeklyData?.map((entry: WeeklyData, index: number) => (
                    <Cell key={index} fill="url(#barGradient)" />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#87CEEB" />
                    <stop offset="100%" stopColor="#2C3E50" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={styles.recentSection}>
          <h3 style={styles.sectionTitle}>最近学习记录</h3>
          <div style={styles.sessionList}>
            {stats?.recentSessions?.length > 0 ? (
              stats.recentSessions.map((session: Session, index: number) => {
                const start = new Date(session.start_time);
                const end = session.end_time ? new Date(session.end_time) : null;
                const dateStr = start.toLocaleDateString('zh-CN', {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                });
                const startTimeStr = start.toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const endTimeStr = end
                  ? end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                  : '--:--';

                return (
                  <div
                    key={session.id}
                    className="card"
                    style={{
                      ...styles.sessionItem,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F8F9FA',
                    }}
                  >
                    <div style={styles.sessionDate}>
                      <span style={styles.sessionDateText}>{dateStr}</span>
                    </div>
                    <div style={styles.sessionDetails}>
                      <span style={styles.sessionTime}>
                        {startTimeStr} - {endTimeStr}
                      </span>
                    </div>
                    <div style={styles.sessionDuration}>
                      {session.duration ? formatDuration(session.duration) : '--'}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={styles.emptyState}>暂无学习记录</div>
            )}
          </div>
        </div>
      </div>

      {showSummary && summaryData && (
        <div className="modal-overlay" onClick={closeSummary}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              ...styles.summaryCard,
              animation: summaryClosing ? 'spinFadeOut 0.4s ease forwards' : 'slideUp 0.4s ease',
            }}
          >
            <div style={styles.summaryHeader}>
              <h2 style={styles.summaryTitle}>🎉 学习完成！</h2>
            </div>
            <div style={styles.summaryBody}>
              <div style={styles.summaryMainTime}>
                {formatDuration(summaryData.session?.duration || 0)}
              </div>
              <div style={styles.summarySubtitle}>本次学习时长</div>

              <div style={styles.summaryStats}>
                <div style={styles.summaryStat}>
                  <div style={styles.summaryStatValue}>
                    {summaryData.stats?.streak || 0}天
                  </div>
                  <div style={styles.summaryStatLabel}>连续学习</div>
                </div>
                <div style={styles.summaryStat}>
                  <div style={styles.summaryStatValue}>
                    {formatDuration(summaryData.stats?.totalDuration || 0)}
                  </div>
                  <div style={styles.summaryStatLabel}>累计学习</div>
                </div>
              </div>

              <div style={styles.summaryQuote}>
                "{summaryData.stats?.quote || '继续加油！'}"
              </div>
            </div>
            <button className="btn" onClick={closeSummary} style={styles.summaryCloseBtn}>
              知道了
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spinFadeOut {
          from {
            opacity: 1;
            transform: rotate(0deg) scale(1);
          }
          to {
            opacity: 0;
            transform: rotate(15deg) scale(0.9);
          }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#FAFBFC',
  },
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'var(--primary-color)',
    marginBottom: '20px',
  },
  studyControl: {
    padding: '24px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studyInfo: {
    flex: 1,
  },
  studyTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--primary-color)',
    marginBottom: '8px',
  },
  studySubtitle: {
    fontSize: '14px',
    color: '#7F8C8D',
  },
  timer: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: 'var(--accent-color)',
    fontFamily: 'monospace',
  },
  studyBtn: {
    padding: '12px 32px',
    fontSize: '15px',
    fontWeight: 600,
  },
  statsCard: {
    padding: '20px 24px',
    marginBottom: '20px',
  },
  statsTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--primary-color)',
    marginBottom: '16px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
  },
  statItem: {
    textAlign: 'center',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: 'var(--accent-color)',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#7F8C8D',
  },
  chartCard: {
    padding: '20px 24px',
    marginBottom: '20px',
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--primary-color)',
    marginBottom: '16px',
  },
  chartContainer: {
    width: '100%',
  },
  heatmapContainer: {
    width: '100%',
  },
  heatmapHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  heatmapTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--primary-color)',
  },
  heatmapLegend: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  legendLabel: {
    fontSize: '11px',
    color: '#7F8C8D',
    margin: '0 4px',
  },
  heatmapWrapper: {
    display: 'flex',
    gap: '8px',
  },
  weekLabels: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  weekLabel: {
    fontSize: '11px',
    color: '#7F8C8D',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
  },
  heatmapGrid: {
    display: 'flex',
    gap: '6px',
    flex: 1,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  heatmapWeek: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  heatmapCell: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
  },
  recentSection: {
    marginTop: '8px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--primary-color)',
    marginBottom: '12px',
  },
  sessionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sessionItem: {
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: '12px',
  },
  sessionDate: {
    flex: 1,
  },
  sessionDateText: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--primary-color)',
  },
  sessionDetails: {
    flex: 1,
    textAlign: 'center',
  },
  sessionTime: {
    fontSize: '13px',
    color: '#7F8C8D',
  },
  sessionDuration: {
    flex: 1,
    textAlign: 'right',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--accent-color)',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#BDC3C7',
    fontSize: '14px',
  },
  summaryCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '20px',
    padding: '40px 30px',
    maxWidth: '380px',
    width: '90%',
    color: 'white',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(102, 126, 234, 0.4)',
  },
  summaryHeader: {
    marginBottom: '20px',
  },
  summaryTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
  },
  summaryBody: {
    marginBottom: '24px',
  },
  summaryMainTime: {
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  summarySubtitle: {
    fontSize: '14px',
    opacity: 0.85,
    marginBottom: '24px',
  },
  summaryStats: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '20px',
    padding: '16px 0',
    borderTop: '1px solid rgba(255,255,255,0.2)',
    borderBottom: '1px solid rgba(255,255,255,0.2)',
  },
  summaryStat: {
    textAlign: 'center',
  },
  summaryStatValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  summaryStatLabel: {
    fontSize: '12px',
    opacity: 0.85,
  },
  summaryQuote: {
    fontSize: '14px',
    fontStyle: 'italic',
    opacity: 0.9,
    lineHeight: 1.6,
  },
  summaryCloseBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
  },
};

export default Dashboard;
