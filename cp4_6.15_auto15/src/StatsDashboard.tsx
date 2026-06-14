import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useAppContext } from './App';
import {
  getDeckMastery,
  getLast7DaysDays,
  getCalendarDays,
  formatDate,
  DailyLog,
} from './utils/spacedRepetition';

export default function StatsDashboard() {
  const { state } = useAppContext();

  const totalCards = state.decks.reduce((sum, d) => sum + d.cards.length, 0);
  const totalReviews = state.decks.reduce((sum, d) => sum + d.reviewCount, 0);
  const todayReviewed = state.dailyLogs[formatDate(new Date())]?.reviewed || 0;

  const deckMasteryData = useMemo(() => {
    return state.decks.map((d) => ({
      id: d.id,
      name: d.name,
      mastery: getDeckMastery(d.cards),
      total: d.cards.length,
    }));
  }, [state.decks]);

  const last7DaysData = useMemo(() => {
    const days = getLast7DaysDays();
    return days.map((date) => {
      const log: DailyLog | undefined = state.dailyLogs[date];
      const rate = log && log.reviewed > 0 ? Math.round((log.correct / log.reviewed) * 100) : 0;
      return {
        date: date.slice(5),
        正确率: rate,
        复习数: log?.reviewed || 0,
      };
    });
  }, [state.dailyLogs]);

  const calendarData = useMemo(() => {
    const now = new Date();
    const days = getCalendarDays(now.getFullYear(), now.getMonth());
    return days;
  }, []);

  const getCalendarLevel = (dateStr: string): number => {
    const log = state.dailyLogs[dateStr];
    if (!log || log.reviewed === 0) return 0;
    if (log.reviewed < 5) return 1;
    if (log.reviewed < 15) return 2;
    if (log.reviewed < 30) return 3;
    return 4;
  };

  const COLORS = ['#8BA883', '#A8B5C3', '#D4CFC8', '#B8CCE0', '#A8C3A0'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">学习统计</h1>
          <p className="page-subtitle">追踪你的学习进度与记忆效果</p>
        </div>
      </div>

      <div className="stats-summary">
        <div className="summary-item">
          <div className="summary-value">{totalCards}</div>
          <div className="summary-label">总卡片数</div>
        </div>
        <div className="summary-item">
          <div className="summary-value">{totalReviews}</div>
          <div className="summary-label">累计复习</div>
        </div>
        <div className="summary-item">
          <div className="summary-value">{todayReviewed}</div>
          <div className="summary-label">今日复习</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stats-card">
          <h3 className="stats-card-title">📈 各卡片集掌握度</h3>
          {state.decks.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon" style={{ fontSize: 40 }}>📊</div>
              <div className="empty-state-title" style={{ fontSize: 16 }}>暂无数据</div>
            </div>
          ) : (
            <div className="mastery-list">
              {deckMasteryData.map((d, i) => (
                <div key={d.id} className="mastery-item">
                  <div className="mastery-ring-container">
                    <ResponsiveContainer width={60} height={60}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'mastery', value: d.mastery },
                            { name: 'rest', value: 100 - d.mastery },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={18}
                          outerRadius={26}
                          startAngle={90}
                          endAngle={-270}
                          dataKey="value"
                          isAnimationActive={false}
                        >
                          <Cell fill={COLORS[i % COLORS.length]} />
                          <Cell fill="#F0EDE8" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div
                      style={{
                        position: 'relative',
                        marginTop: -44,
                        textAlign: 'center',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#3D3D3D',
                        pointerEvents: 'none',
                      }}
                    >
                      {d.mastery}%
                    </div>
                    <div style={{ height: 60 }} />
                  </div>
                  <div className="mastery-info">
                    <div className="mastery-name">{d.name}</div>
                    <div className="mastery-detail">共 {d.total} 张卡片</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="stats-card">
          <h3 className="stats-card-title">📅 本月复习打卡</h3>
          <div className="calendar-container">
            <div className="calendar-grid">
              {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
                <div key={d} className="calendar-day-header">
                  {d}
                </div>
              ))}
              {calendarData.map((dateStr, i) => (
                <div
                  key={i}
                  className={`calendar-day ${
                    dateStr ? `level-${getCalendarLevel(dateStr)}` : ''
                  }`}
                  title={dateStr ? `${dateStr}: ${state.dailyLogs[dateStr]?.reviewed || 0}次复习` : ''}
                  style={!dateStr ? { visibility: 'hidden' } : {}}
                />
              ))}
            </div>
            <div className="calendar-legend">
              <span>少</span>
              <div className="legend-box level-0" style={{ background: 'var(--color-bg)' }} />
              <div className="legend-box level-1" />
              <div className="legend-box level-2" />
              <div className="legend-box level-3" />
              <div className="legend-box level-4" />
              <span>多</span>
            </div>
          </div>
        </div>

        <div className="stats-card" style={{ gridColumn: '1 / -1' }}>
          <h3 className="stats-card-title">📉 最近 7 天正确率趋势</h3>
          <div className="line-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last7DaysData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDEBE6" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#888', fontSize: 12 }}
                  axisLine={{ stroke: '#EDEBE6' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#888', fontSize: 12 }}
                  axisLine={{ stroke: '#EDEBE6' }}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255,255,255,0.95)',
                    border: '1px solid #EDEBE6',
                    borderRadius: 12,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }}
                  formatter={(value: number) => [`${value}%`, '正确率']}
                />
                <Line
                  type="monotone"
                  dataKey="正确率"
                  stroke="#8BA883"
                  strokeWidth={3}
                  dot={{ fill: '#8BA883', strokeWidth: 2, r: 5, stroke: '#fff' }}
                  activeDot={{ r: 7, fill: '#8BA883', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
