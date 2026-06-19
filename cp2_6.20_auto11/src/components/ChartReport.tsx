import type { Question } from '@/utils/api';
import { useQuizStore } from '@/hooks/useQuizStore';
import { QUESTION_TYPE_LABELS } from '@/utils/api';
import { ArrowLeft } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface AnswerState {
  selected: string | string[];
  answered: boolean;
  correct: boolean;
}

interface ChartReportProps {
  answers: AnswerState[];
  questions: Question[];
  duration: number;
  onBack: () => void;
}

interface PieDataItem {
  name: string;
  value: number;
  correct: number;
  accuracy: number;
}

const PIE_COLORS = ['#4A90D9', '#357ABD', '#6BB5FF', '#2E6BA6'];

export default function ChartReport({ answers, questions, duration, onBack }: ChartReportProps) {
  const totalCorrect = answers.filter((a) => a.correct).length;
  const accuracy = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0;

  const byType: Record<string, { total: number; correct: number }> = {};
  questions.forEach((q, i) => {
    const t = q.type;
    if (!byType[t]) byType[t] = { total: 0, correct: 0 };
    byType[t].total++;
    if (answers[i].correct) byType[t].correct++;
  });

  const pieData: PieDataItem[] = Object.entries(byType).map(([type, data]) => ({
    name: QUESTION_TYPE_LABELS[type] || type,
    value: data.total,
    correct: data.correct,
    accuracy: Math.round((data.correct / data.total) * 100),
  }));

  const barData = getDailyData();

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}分${sec}秒`;
  };

  const renderPieLabel = (entry: { name: string; payload?: PieDataItem }) => {
    const { name, payload } = entry;
    const acc = payload?.accuracy || 0;
    return `${name}\n${acc}%`;
  };

  return (
    <div className="chart-report">
      <div className="report-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          返回题库
        </button>
        <h2 className="report-title">练习成绩报告</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{questions.length}</div>
          <div className="stat-label">总题数</div>
        </div>
        <div className="stat-card stat-correct">
          <div className="stat-value">{totalCorrect}</div>
          <div className="stat-label">正确数</div>
        </div>
        <div className="stat-card stat-accuracy">
          <div className="stat-value">{accuracy}%</div>
          <div className="stat-label">正确率</div>
        </div>
        <div className="stat-card stat-time">
          <div className="stat-value">{formatDuration(duration)}</div>
          <div className="stat-label">用时</div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3 className="chart-title">各题型正确率</h3>
          {pieData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={renderPieLabel as any}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, props) => {
                      const payload = props.payload as PieDataItem | undefined;
                      const val = typeof value === 'number' ? value : 0;
                      const correct = payload?.correct || 0;
                      const acc = payload?.accuracy || 0;
                      return [`${val}题，正确 ${correct}题（${acc}%）`, '数量'];
                    }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E8ECF0' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-chart">暂无数据</div>
          )}
        </div>

        <div className="chart-card">
          <h3 className="chart-title">每日练习数量</h3>
          {barData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#666' }} axisLine={{ stroke: '#E8ECF0' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#666' }} axisLine={{ stroke: '#E8ECF0' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E8ECF0' }}
                    formatter={(value) => {
                      const val = typeof value === 'number' ? value : 0;
                      return [`${val}题`, '练习数量'];
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#barGradient)"
                    radius={[4, 4, 0, 0]}
                    animationDuration={800}
                  >
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4A90D9" />
                        <stop offset="100%" stopColor="#357ABD" />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-chart">暂无历史练习数据</div>
          )}
        </div>
      </div>
    </div>
  );
}

function getDailyData(): Array<{ label: string; count: number }> {
  const store = useQuizStore.getState();
  const history = store.practiceHistory;
  const map = new Map<string, number>();

  history.forEach((r) => {
    const date = new Date(Date.now()).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    map.set(date, (map.get(date) || 0) + r.total);
  });

  if (map.size === 0) {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const label = d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
      map.set(label, i === 0 ? useQuizStore.getState().practiceHistory.reduce((s, r) => s + r.total, 0) : 0);
    }
  }

  return Array.from(map.entries())
    .slice(-7)
    .map(([label, count]) => ({ label, count }));
}
