import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { VoteOption } from '../types';
import '../styles/ResultsChart.css';

interface ResultsChartProps {
  options: VoteOption[];
  totalVotes: number;
}

const COLORS = [
  '#00d4aa',
  '#4ecdc4',
  '#45b7d1',
  '#96ceb4',
  '#ffeaa7',
  '#dfe6e9',
  '#fd79a8',
  '#a29bfe',
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const percent = payload[0].payload.percent || 0;
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-value">
          票数：<strong>{payload[0].value}</strong>
        </p>
        <p className="tooltip-value">
          占比：<strong>{percent.toFixed(1)}%</strong>
        </p>
      </div>
    );
  }
  return null;
};

function ResultsChart({ options, totalVotes }: ResultsChartProps) {
  const [animatedData, setAnimatedData] = useState<any[]>([]);

  useEffect(() => {
    const data = options.map((opt, index) => ({
      name: opt.text.length > 10 ? opt.text.slice(0, 10) + '...' : opt.text,
      fullName: opt.text,
      votes: opt.votes,
      percent: totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0,
      fill: COLORS[index % COLORS.length],
    }));
    setAnimatedData(data);
  }, [options, totalVotes]);

  return (
    <div className="results-chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={animatedData}
          margin={{ top: 20, right: 30, left: 0, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#8892a0', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
            angle={-15}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: '#8892a0', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          <Bar
            dataKey="votes"
            radius={[6, 6, 0, 0]}
            animationDuration={400}
            animationEasing="ease-out"
            maxBarSize={50}
          >
            {animatedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ResultsChart;
