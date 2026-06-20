import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  Area,
  AreaChart
} from 'recharts';
import type { Objective, CheckInRecord, KeyResult } from '../../types';

interface ProgressChartProps {
  objective: Objective;
  selectedKR?: string;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ objective, selectedKR }) => {
  const [activeKR, setActiveKR] = useState<string | null>(selectedKR || objective.keyResults[0]?.id || null);

  const chartData = useMemo(() => {
    const kr = objective.keyResults.find(k => k.id === activeKR);
    if (!kr) return [];

    const krCheckIns = objective.checkIns
      .filter(c => c.keyResultId === activeKR)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const data = krCheckIns.map(checkin => ({
      date: checkin.date,
      progress: checkin.percentComplete,
      note: checkin.note
    }));

    if (data.length === 0) {
      const initialProgress = Math.min((kr.currentValue / kr.targetValue) * 100, 100);
      data.push({
        date: objective.createdAt.split('T')[0],
        progress: initialProgress,
        note: '初始值'
      });
    }

    return data;
  }, [objective, activeKR]);

  const selectedKRData = objective.keyResults.find(k => k.id === activeKR);

  return (
    <div className="bg-white rounded-xl shadow-md p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">进度趋势</h3>
        <div className="flex gap-2">
          {objective.keyResults.map((kr, idx) => (
            <button
              key={kr.id}
              onClick={() => setActiveKR(kr.id)}
              className={`px-3 py-1 text-sm rounded-lg transition-all ${
                activeKR === kr.id
                  ? 'bg-[#1a237e] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              KR{idx + 1}
            </button>
          ))}
        </div>
      </div>

      {selectedKRData && (
        <p className="text-sm text-gray-600 mb-4">
          {selectedKRData.title} - {selectedKRData.currentValue}/{selectedKRData.targetValue}{selectedKRData.unit}
        </p>
      )}

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1a237e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#1a237e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              formatter={(value: number) => [`${value}%`, '完成度']}
              labelFormatter={(label) => `日期: ${label}`}
            />
            <Brush dataKey="date" height={30} stroke="#1a237e" />
            <Area
              type="monotone"
              dataKey="progress"
              stroke="#1a237e"
              strokeWidth={2}
              fill="url(#colorProgress)"
              activeDot={{ r: 6, fill: '#1a237e' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProgressChart;
