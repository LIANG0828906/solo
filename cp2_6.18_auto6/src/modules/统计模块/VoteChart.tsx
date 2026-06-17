import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
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
import { useAppStore } from '../../store';
import './VoteChart.css';

type ChartType = 'bar' | 'pie';

const COLORS = ['#6C63FF', '#FF6584', '#4ECDC4', '#FFD93D', '#6BCB77'];

function VoteChart() {
  const votes = useAppStore((state) => state.votes);
  const getVoteStats = useAppStore((state) => state.getVoteStats);
  const getTotalVotesCount = useAppStore((state) => state.getTotalVotesCount);
  const [chartType, setChartType] = useState<ChartType>('bar');

  const voteStats = useMemo(() => getVoteStats(), [votes, getVoteStats]);
  const totalVotesCount = useMemo(() => getTotalVotesCount(), [votes, getTotalVotesCount]);

  const barChartData = useMemo(() => {
    return voteStats.map((stat) => ({
      name: stat.title.length > 15 ? stat.title.slice(0, 15) + '...' : stat.title,
      fullName: stat.title,
      票数: stat.totalVotes,
    }));
  }, [voteStats]);

  const pieChartData = useMemo(() => {
    return voteStats.map((stat, index) => ({
      name: stat.title,
      value: stat.totalVotes,
      color: COLORS[index % COLORS.length],
    }));
  }, [voteStats]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-title">{payload[0].payload.fullName || payload[0].name}</p>
          <p className="tooltip-value">
            票数：<span>{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const PieCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-title">{payload[0].name}</p>
          <p className="tooltip-value">
            票数：<span>{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={500}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="stats-page">
      <div className="page-header">
        <h1 className="page-title">投票统计</h1>
        <p className="stats-summary">
          共 <span className="highlight">{voteStats.length}</span> 个投票，
          <span className="highlight">{totalVotesCount}</span> 张总票数
        </p>
      </div>

      <div className="chart-tabs">
        <button
          className={`tab-btn ${chartType === 'bar' ? 'active' : ''}`}
          onClick={() => setChartType('bar')}
        >
          柱状图
        </button>
        <button
          className={`tab-btn ${chartType === 'pie' ? 'active' : ''}`}
          onClick={() => setChartType('pie')}
        >
          饼图
        </button>
      </div>

      <div className="chart-container">
        {chartType === 'bar' ? (
          <div className="chart-wrapper">
            <h3 className="chart-title">投票总票数排名</h3>
            <div className="chart-area">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3D" />
                  <XAxis
                    dataKey="name"
                    stroke="#787878"
                    tick={{ fill: '#B0B0B0', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    stroke="#787878"
                    tick={{ fill: '#B0B0B0', fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(108, 99, 255, 0.1)' }} />
                  <Bar
                    dataKey="票数"
                    fill="#6C63FF"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                    isAnimationActive={true}
                    animationDuration={600}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="chart-wrapper">
            <h3 className="chart-title">投票分布占比</h3>
            <div className="chart-area">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={150}
                    innerRadius={60}
                    dataKey="value"
                    paddingAngle={2}
                    isAnimationActive={true}
                    animationDuration={600}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieCustomTooltip />} />
                  <Legend
                    formatter={(value: string) => (
                      <span style={{ color: '#B0B0B0', fontSize: 12 }}>
                        {value.length > 20 ? value.slice(0, 20) + '...' : value}
                      </span>
                    )}
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {voteStats.length === 0 && (
        <div className="empty-state">
          <p>暂无投票数据</p>
        </div>
      )}
    </div>
  );
}

export default VoteChart;
