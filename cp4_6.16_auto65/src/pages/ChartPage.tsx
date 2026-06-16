import { useMemo } from 'react';
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
  Area,
  AreaChart,
} from 'recharts';
import { useExerciseStore } from '../modules/exercise/store';
import type { ExerciseCategory } from '../modules/exercise/types';

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  chest: '胸部',
  back: '背部',
  legs: '腿部',
  shoulders: '肩部',
  arms: '手臂',
  core: '核心',
};

const CATEGORY_ORDER: ExerciseCategory[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];

const CATEGORY_COLORS: Record<ExerciseCategory, string> = {
  chest: '#e94560',
  back: '#4ecdc4',
  legs: '#ffe66d',
  shoulders: '#95e1d3',
  arms: '#f38181',
  core: '#aa96da',
};

interface DailyData {
  date: string;
  label: string;
  totalSets: number;
  totalWeight: number;
  records: number;
}

interface CategoryData {
  category: string;
  label: string;
  totalSets: number;
  totalVolume: number;
  color: string;
}

const CustomLineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <div style={{ fontWeight: 600, marginBottom: '8px', color: '#e94560' }}>{label}</div>
        {payload.map((entry: any, index: number) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '4px 0' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: entry.color,
                }}
              />
              {entry.name === 'totalSets' ? '总组数' : entry.name === 'totalWeight' ? '总重量(kg)' : '训练次数'}
            </span>
            <span style={{ fontWeight: 600 }}>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div className="chart-tooltip">
        <div style={{ fontWeight: 600, marginBottom: '8px', color: data?.color || '#e94560' }}>{label}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '4px 0' }}>
          <span>总组数</span>
          <span style={{ fontWeight: 600 }}>{data?.totalSets || 0}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '4px 0' }}>
          <span>总容量(kg)</span>
          <span style={{ fontWeight: 600 }}>{data?.totalVolume || 0}</span>
        </div>
      </div>
    );
  }
  return null;
};

const ChartPage = () => {
  const trainingRecords = useExerciseStore((state) => state.trainingRecords);
  const exercises = useExerciseStore((state) => state.exercises);

  const { dailyData, categoryData, summary } = useMemo(() => {
    const days: DailyData[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      days.push({
        date: dateStr,
        label: `${date.getMonth() + 1}/${date.getDate()} ${weekDays[date.getDay()]}`,
        totalSets: 0,
        totalWeight: 0,
        records: 0,
      });
    }

    const categoryMap = new Map<ExerciseCategory, { totalSets: number; totalVolume: number }>();
    CATEGORY_ORDER.forEach((cat) => categoryMap.set(cat, { totalSets: 0, totalVolume: 0 }));

    let totalAllSets = 0;
    let totalAllVolume = 0;
    let totalRecords = trainingRecords.length;

    trainingRecords.forEach((record) => {
      const dayIndex = days.findIndex((d) => d.date === record.date);
      if (dayIndex !== -1) {
        days[dayIndex].totalSets += record.sets;
        days[dayIndex].totalWeight += record.totalWeight;
        days[dayIndex].records += 1;
      }

      const cat = record.category;
      const existing = categoryMap.get(cat);
      if (existing) {
        existing.totalSets += record.sets;
        existing.totalVolume += record.totalWeight;
      }

      totalAllSets += record.sets;
      totalAllVolume += record.totalWeight;
    });

    const categories: CategoryData[] = CATEGORY_ORDER.map((cat) => {
      const data = categoryMap.get(cat)!;
      return {
        category: cat,
        label: CATEGORY_LABELS[cat],
        totalSets: data.totalSets,
        totalVolume: data.totalVolume,
        color: CATEGORY_COLORS[cat],
      };
    }).filter((c) => c.totalSets > 0 || c.totalVolume > 0);

    const weekSets = days.reduce((sum, d) => sum + d.totalSets, 0);
    const weekVolume = days.reduce((sum, d) => sum + d.totalWeight, 0);

    return {
      dailyData: days,
      categoryData: categories,
      summary: {
        totalAllSets,
        totalAllVolume,
        totalRecords,
        weekSets,
        weekVolume,
        totalExercises: exercises.length,
      },
    };
  }, [trainingRecords, exercises]);

  return (
    <div className="container">
      <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>训练统计</h1>
      <p className="text-secondary mb-4">查看您的周度训练数据和部位分布</p>

      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-card-label">总训练次数</div>
          <div className="stat-card-value" style={{ color: '#e94560' }}>{summary.totalRecords}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">本周组数</div>
          <div className="stat-card-value" style={{ color: '#4ecdc4' }}>{summary.weekSets}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">本周总容量</div>
          <div className="stat-card-value" style={{ color: '#ffe66d' }}>{summary.weekVolume.toLocaleString()} kg</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">动作库数量</div>
          <div className="stat-card-value" style={{ color: '#aa96da' }}>{summary.totalExercises}</div>
        </div>
      </div>

      <div className="card mb-4" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>最近7天训练组数趋势</h2>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="setsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e94560" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#e94560" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ecdc4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4ecdc4" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis
                dataKey="label"
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              />
              <YAxis
                yAxisId="left"
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                label={{ value: '组数', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                label={{ value: '重量(kg)', angle: 90, position: 'insideRight', fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
              />
              <Tooltip content={<CustomLineTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => {
                  if (value === 'totalSets') return '每日总组数';
                  if (value === 'totalWeight') return '每日总重量';
                  return value;
                }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="totalSets"
                stroke="#e94560"
                strokeWidth={3}
                fill="url(#setsGradient)"
                isAnimationActive={true}
                animationDuration={1000}
                animationEasing="ease-out"
                dot={{ r: 5, fill: '#e94560', strokeWidth: 2, stroke: '#16213e' }}
                activeDot={{ r: 7, strokeWidth: 2 }}
                name="totalSets"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="totalWeight"
                stroke="#4ecdc4"
                strokeWidth={3}
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
                dot={{ r: 4, fill: '#4ecdc4', strokeWidth: 2, stroke: '#16213e' }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                name="totalWeight"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>各部位训练统计</h2>
        {categoryData.length === 0 ? (
          <div className="text-secondary" style={{ textAlign: 'center', padding: '60px' }}>
            暂无训练数据，开始记录您的训练吧！
          </div>
        ) : (
          <div style={{ width: '100%', height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  {categoryData.map((c, idx) => (
                    <linearGradient key={idx} id={`barGradient_${c.category}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c.color} stopOpacity={1} />
                      <stop offset="100%" stopColor={c.color} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 13 }}
                  tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                  tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  label={{ value: '总组数', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={() => '训练总组数'}
                />
                <Bar
                  dataKey="totalSets"
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1200}
                  animationEasing="ease-out"
                >
                  {categoryData.map((entry, index) => (
                    <rect key={index} fill={`url(#barGradient_${entry.category})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div style={{ height: '40px' }} />
    </div>
  );
};

export default ChartPage;
