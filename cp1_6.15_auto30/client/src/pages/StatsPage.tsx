import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ArrowLeft, TrendingUp, BarChart3, Calendar } from 'lucide-react';
import type { Goal, StudyRecord } from '../types';
import { formatMinutes, formatDate } from '../utils';

interface Props {
  goals: Goal[];
  records: StudyRecord[];
}

type TimeRange = 'week' | 'month' | 'year';

const StatsPage: React.FC<Props> = ({ goals, records }) => {
  const navigate = useNavigate();
  const [range, setRange] = useState<TimeRange>('week');

  const getDaysInRange = (): number => {
    switch (range) {
      case 'week': return 7;
      case 'month': return 30;
      default: return 365;
    }
  };

  const trendData = useMemo(() => {
    const days = getDaysInRange();
    const map = new Map<string, number>();
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      map.set(key, 0);
    }
    records.forEach((r) => {
      const d = new Date(r.startTime);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      if (map.has(key)) {
        map.set(key, (map.get(key) || 0) + r.durationMinutes);
      }
    });
    const result: { date: string; minutes: number }[] = [];
    map.forEach((minutes, key) => {
      const [y, m, d] = key.split('-').map(Number);
      result.push({
        date: `${m}/${d}`,
        minutes,
      });
    });
    return result;
  }, [records, range]);

  const categoryData = useMemo(() => {
    const goalMap = new Map(goals.map((g) => [g.id, g.name]));
    const agg = new Map<string, number>();
    const days = getDaysInRange();
    const now = Date.now();
    records.forEach((r) => {
      const recDate = new Date(r.startTime);
      if (now - recDate.getTime() > days * 24 * 60 * 60 * 1000) return;
      const name = goalMap.get(r.goalId) || '未知';
      agg.set(name, (agg.get(name) || 0) + r.durationMinutes);
    });
    const result: { name: string; minutes: number }[] = [];
    agg.forEach((minutes, name) => {
      result.push({ name, minutes });
    });
    return result.sort((a, b) => b.minutes - a.minutes);
  }, [goals, records, range]);

  const totalMinutes = useMemo(
    () => trendData.reduce((s, d) => s + d.minutes, 0),
    [trendData]
  );

  const avgMinutes = trendData.length > 0 ? Math.round(totalMinutes / trendData.length) : 0;

  const bestDay = useMemo(() => {
    return trendData.reduce(
      (best, d) => (d.minutes > best.minutes ? d : best),
      { date: '-', minutes: 0 }
    );
  }, [trendData]);

  const topGoal = useMemo(() => {
    return categoryData[0] || { name: '-', minutes: 0 };
  }, [categoryData]);

  return (
    <div className="stats-page fade-in">
      <div className="page-header">
      <div className="header-left">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">学习统计报告</h1>
          <p className="page-sub">追踪你的学习数据洞察</p>
        </div>
      </div>
      <div className="range-selector">
        {['week', 'month', 'year'].map((r) => (
          <button
            key={r}
            className={`range-btn ${range === r ? 'active' : ''}`}
            onClick={() => setRange(r as TimeRange)}
          >
            <Calendar size={14} />
            {r === 'week' ? '本周' : r === 'month' ? '本月' : '本年'}
          </button>
        ))}
      </div>
    </div>

    <div className="stats-cards">
      <div className="stat-card glass">
        <div className="stat-icon purple"><TrendingUp size={22} /></div>
        <div className="stat-value">{formatMinutes(totalMinutes)}</div>
        <div className="stat-label">总学习时长</div>
      </div>
      <div className="stat-card glass">
        <div className="stat-icon blue"><BarChart3 size={22} /></div>
        <div className="stat-value">{avgMinutes}</div>
        <div className="stat-label">日均学习 (分钟)</div>
      </div>
      <div className="stat-card glass">
        <div className="stat-icon green"><Calendar size={22} /></div>
        <div className="stat-value">{bestDay.date}</div>
        <div className="stat-label">学习最多的一天</div>
      </div>
      <div className="stat-card glass">
        <div className="stat-icon orange"><TrendingUp size={22} /></div>
        <div className="stat-value">{topGoal.name}</div>
        <div className="stat-label">投入最多方向</div>
      </div>
    </div>

    <div className="chart-section glass">
      <h2 className="section-title">
        <TrendingUp size={20} />
        学习时长趋势
      </h2>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#667eea" />
              <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(102, 126, 234, 0.1)" vertical={false} />
          <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)',
              padding: '10px 14px',
            }}
            labelStyle={{
              color: '#667eea',
              fontWeight: 600,
            }}
            formatter={(value: number) => [`${value} 分钟`]}
          />
          <Line
            type="monotone"
            dataKey="minutes"
            stroke="url(#lineGrad)"
            strokeWidth={3}
            dot={{ fill: '#667eea', r: 4, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, stroke: '#667eea', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
    </div>

    <div className="chart-section glass">
      <h2 className="section-title">
        <BarChart3 size={20} />
        各目标时长分布
      </h2>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={categoryData}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#667eea" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(102, 126, 234, 0.1)" vertical={false} />
          <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)',
              padding: '10px 14px',
            }}
            formatter={(value: number) => [`${formatMinutes(value)}`]}
          />
          <Legend />
          <Bar
            dataKey="minutes" name="学习时长 (分钟)" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
    </div>

    <div className="analysis-section glass">
      <h2 className="section-title">
        <TrendingUp size={20} />
        学习分析摘要
      </h2>
      <div className="analysis-content">
        <p>
          在过去的{range === 'week' ? '7' : range === 'month' ? '30' : '365'}天里，
          你总共学习了<strong>{formatMinutes(totalMinutes)}</strong>，
          平均每天学习<strong>{avgMinutes} 分钟</strong>。
        </p>
        {bestDay.minutes > 0 && (
          <p>
            你在<strong>{bestDay.date}</strong>学习了
            <strong>{formatMinutes(bestDay.minutes)}</strong>，
            是表现最好的一天，继续保持！
          </p>
        )}
        {topGoal.minutes > 0 && (
          <p>
            你在<strong>{topGoal.name}</strong>上投入最多，
            共<strong>{formatMinutes(topGoal.minutes)}</strong>。
          </p>
        )}
        {avgMinutes >= 60 ? (
          <p className="analysis-tip good">
          🌟 太棒了！你保持着非常棒的学习节奏，坚持就是胜利！
          </p>
        ) : avgMinutes >= 30 ? (
          <p className="analysis-tip normal">
            💪 不错的开始，再接再厉，每一天都在进步！尝试每天多学一点点！
          </p>
        ) : (
          <p className="analysis-tip encourage">
            🚀 开始行动起来吧！每天进步一点点，积少成多！
          </p>
        )}
      </div>
    </div>

    <style>{`
      .header-left {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .page-sub {
        color: #6b7280;
        font-size: 14px;
        margin-top: 4px;
      }
      .back-btn {
        background: rgba(255, 255, 255, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 10px;
        padding: 8px 12px;
        color: #374151;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
      }
      .back-btn:hover {
        background: white;
        transform: translateX(-2px);
      }
      .range-selector {
        display: flex;
        gap: 8px;
        background: rgba(255, 255, 255, 0.5);
        padding: 4px;
        border-radius: 12px;
      }
      .range-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border: none;
        background: transparent;
        color: #6b7280;
        font-weight: 500;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.3s ease;
        font-family: inherit;
      }
      .range-btn.active {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }
      .stats-cards {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }
      .stat-card {
        border-radius: 16px;
        padding: 20px;
        transition: transform 0.3s ease;
      }
      .stat-card:hover {
        transform: translateY(-4px);
      }
      .stat-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
        color: white;
      }
      .stat-icon.purple { background: linear-gradient(135deg, #a78bfa, #764ba2); }
      .stat-icon.blue { background: linear-gradient(135deg, #667eea, #3b82f6); }
      .stat-icon.green { background: linear-gradient(135deg, #10b981, #059669); }
      .stat-icon.orange { background: linear-gradient(135deg, #f59e0b, #d97706); }
      .stat-value {
        font-size: 24px;
        font-weight: 700;
        font-family: 'JetBrains Mono', monospace;
        background: linear-gradient(135deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 4px;
      }
      .stat-label {
        font-size: 13px;
        color: #6b7280;
      }
      .chart-section {
        border-radius: 20px;
        padding: 24px;
        margin-bottom: 24px;
      }
      .section-title {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 17px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 20px;
      }
      .section-title svg { color: #667eea; }
      .chart-container {
        width: 100%;
      }
      .analysis-section {
        border-radius: 20px;
        padding: 24px;
      }
      .analysis-content {
        color: #4b5563;
        line-height: 1.8;
        font-size: 14px;
      }
      .analysis-content p {
        margin-bottom: 8px;
      }
      .analysis-content strong {
        color: #667eea;
        font-weight: 600;
      }
      .analysis-tip {
        margin-top: 16px;
        padding: 12px 16px;
        border-radius: 10px;
        font-weight: 500;
      }
      .analysis-tip.good {
        background: rgba(16, 185, 129, 0.1);
        color: #059669;
      }
      .analysis-tip.normal {
        background: rgba(102, 126, 234, 0.1);
        color: #667eea;
      }
      .analysis-tip.encourage {
        background: rgba(245, 158, 11, 0.1);
        color: #d97706;
      }
      @media (max-width: 900px) {
        .stats-cards {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (max-width: 640px) {
        .stats-cards {
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .stat-card {
          padding: 16px;
        }
        .stat-value {
          font-size: 18px;
        }
        .range-selector {
          gap: 4px;
        }
        .range-btn {
          padding: 6px 10px;
          font-size: 12px;
        }
      }
    `}</style>
    </div>
  );
};

export default StatsPage;
