import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  VoteResult,
  PIE_COLORS,
  generateBarColor,
  ROLE_WEIGHTS,
} from '../utils/voteEngine';

interface ResultChartsProps {
  voteData: VoteResult;
}

function ResultCharts({ voteData }: ResultChartsProps) {
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    setAnimationKey((prev) => prev + 1);
  }, [voteData.weightedScores]);

  const maxScore = Math.max(...voteData.weightedScores.map((s) => s.weightedScore), 1);

  const barData = voteData.weightedScores.map((s) => ({
    name: s.optionName,
    score: s.weightedScore,
    fullMark: maxScore,
  }));

  const pieData = voteData.weightedScores.map((s) => ({
    name: s.optionName,
    value: s.weightedScore,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="font-semibold text-white">{payload[0].payload.name}</p>
          <p className="text-accent">加权分: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx: any, cy: any, midAngle: any, innerRadius: any, outerRadius: any, percent: any, name: any, value: any }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.05) return null;
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const totalWeighted = voteData.weightedScores.reduce((sum, s) => sum + s.weightedScore, 0);

  return (
    <div className="lg:col-span-2 grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="bg-card-dark rounded-xl p-6 animate-pulse-glow">
        <h2 className="text-xl font-bold mb-4">加权总分柱状图</h2>
        <div className="w-full" style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              key={`bar-${animationKey}`} data={barData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis type="number" stroke="#ffffff" />
              <YAxis type="category" dataKey="name" stroke="#ffffff" width={80} />
              <Tooltip content={<CustomTooltip />}
              <Bar
                dataKey="score"
                animationDuration={400}
                animationEasing="ease-out"
                radius={[0, 4, 4, 0]}
                label={{ position: 'right', fill: '#ffffff', fontSize: 12, fontWeight: 'bold' }}
              >
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={generateBarColor(entry.score, maxScore)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-center text-sm text-gray-400">
          <span className="inline-block w-3 h-3 rounded mr-2" style={{ backgroundColor: '#4caf50' }}></span>低分
          <span className="mx-4">→</span>
          <span className="inline-block w-3 h-3 rounded mr-2" style={{ backgroundColor: '#ff9800' }}></span>高分
        </div>
      </div>

      <div className="bg-card-dark rounded-xl p-6 animate-pulse-glow">
        <h2 className="text-xl font-bold mb-4">得分占比环形图</h2>
        <div className="w-full" style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart key={`pie-${animationKey}`}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
                animationDuration={400}
                animationEasing="ease-out"
                label={renderCustomLabel}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />}
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {voteData.options.map((opt, idx) => (
            <div key={opt.id} className="flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
              ></span>
              <span className="text-gray-300">{opt.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="xl:col-span-2 bg-card-dark rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">角色权重说明</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(ROLE_WEIGHTS).map(([role, weight]) => (
            <div key={role} className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">
                {role === 'manager' ? '经理' : role === 'leader' ? '组长' : '成员'}
              </div>
              <div className="text-2xl font-bold text-accent mt-1">
                x{weight}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default ResultCharts;
