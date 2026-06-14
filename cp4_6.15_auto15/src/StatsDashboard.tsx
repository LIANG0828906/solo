import { useMemo, useState } from 'react';
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
  formatDate,
  DailyLog,
} from './utils/spacedRepetition';

interface HeatmapWeek {
  days: (HeatmapDay | null)[];
}

interface HeatmapDay {
  date: string;
  count: number;
  level: number;
  isFuture: boolean;
}

function generateHeatmapData(dailyLogs: Record<string, DailyLog>): { weeks: HeatmapWeek[]; months: { label: string; weekIndex: number }[] } {
  const today = new Date();
  const todayStr = formatDate(today);

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364);
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);

  const allDays: HeatmapDay[] = [];
  const current = new Date(startDate);

  while (formatDate(current) <= todayStr || current.getDay() !== 0) {
    const dateStr = formatDate(current);
    const isFuture = dateStr > todayStr;
    const log = dailyLogs[dateStr];
    const count = log?.reviewed || 0;
    let level = 0;
    if (!isFuture) {
      if (count >= 1 && count < 5) level = 1;
      else if (count >= 5 && count < 15) level = 2;
      else if (count >= 15 && count < 30) level = 3;
      else if (count >= 30) level = 4;
    }
    allDays.push({ date: dateStr, count, level, isFuture });
    current.setDate(current.getDate() + 1);
    if (isFuture && current.getDay() === 0 && formatDate(current) > todayStr) break;
  }

  const weeks: HeatmapWeek[] = [];
  const months: { label: string; weekIndex: number }[] = [];
  let seenMonths = new Set<string>();

  for (let i = 0; i < allDays.length; i += 7) {
    const weekDays: (HeatmapDay | null)[] = [];
    for (let j = 0; j < 7; j++) {
      weekDays.push(allDays[i + j] || null);
    }
    weeks.push({ days: weekDays });

    const firstDay = weekDays.find(d => d !== null);
    if (firstDay) {
      const d = new Date(firstDay.date + 'T00:00:00');
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      const monthLabel = `${d.getMonth() + 1}月`;
      if (!seenMonths.has(monthKey) && d.getDate() <= 7) {
        seenMonths.add(monthKey);
        months.push({ label: monthLabel, weekIndex: weeks.length - 1 });
      }
    }
  }

  return { weeks, months };
}

export default function StatsDashboard() {
  const { state } = useAppContext();
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

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

  const heatmapData = useMemo(() => {
    return generateHeatmapData(state.dailyLogs);
  }, [state.dailyLogs]);

  const COLORS = ['#8BA883', '#A8B5C3', '#D4CFC8', '#B8CCE0', '#A8C3A0'];

  const dayLabels = ['', '一', '', '三', '', '五', ''];

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
          <h3 className="stats-card-title">📅 复习打卡热力图</h3>
          <div className="heatmap-scroll-container">
            <div style={{ display: 'inline-block' }}>
              <div className="heatmap-month-labels">
                {heatmapData.months.map((m, i) => (
                  <div
                    key={i}
                    className="heatmap-month-label"
                    style={{
                      position: 'relative',
                      left: i === 0 ? `${m.weekIndex * 17}px` : undefined,
                      marginLeft: i > 0 ? `${(m.weekIndex - heatmapData.months[i - 1].weekIndex) * 17 - (i > 0 ? 56 : 0)}px` : undefined,
                    }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex' }}>
                <div className="heatmap-day-labels">
                  {dayLabels.map((label, i) => (
                    <div key={i} className="heatmap-day-label">{label}</div>
                  ))}
                </div>
                <div className="heatmap-grid">
                  {heatmapData.weeks.map((week, wi) => (
                    <div key={wi} className="heatmap-row">
                      {week.days.map((day, di) => (
                        <div
                          key={di}
                          className={`heatmap-cell ${day ? (day.isFuture ? 'future' : `level-${day.level}`) : ''}`}
                          onMouseEnter={() => day && setHoveredCell(day.date)}
                          onMouseLeave={() => setHoveredCell(null)}
                          style={{ position: 'relative' }}
                        >
                          {hoveredCell === day?.date && day && !day.isFuture && (
                            <div className="heatmap-tooltip">
                              {day.date}：{day.count} 次复习
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="calendar-legend" style={{ justifyContent: 'flex-start', paddingLeft: 30, marginTop: 10 }}>
                <span style={{ fontSize: 11, color: '#888' }}>少</span>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: '#f0ede8' }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, background: '#d4e6d0' }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, background: '#a8c3a0' }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, background: '#7da575' }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, background: '#5a8a50' }} />
                <span style={{ fontSize: 11, color: '#888' }}>多</span>
              </div>
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
