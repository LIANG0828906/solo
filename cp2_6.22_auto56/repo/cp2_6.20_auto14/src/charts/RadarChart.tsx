import React, { useMemo } from 'react';
import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useLearningStore } from '@/store/useLearningStore';
import { ABILITY_LABELS } from '@/types';

const RadarChartComponent: React.FC = () => {
  const abilities = useLearningStore((state) => state.abilities);

  const data = useMemo(() => {
    return Object.entries(abilities).map(([key, value]) => ({
      subject: ABILITY_LABELS[key as keyof typeof ABILITY_LABELS],
      value,
      fullMark: 10,
    }));
  }, [abilities]);

  const avgScore = useMemo(() => {
    const values = Object.values(abilities);
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  }, [abilities]);

  return (
    <div
      className="bg-white rounded-2xl shadow-lg p-5"
      style={{
        animation: 'fadeIn 0.5s ease',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold" style={{ color: '#1a365d' }}>
          能力雷达图
        </h3>
        <div
          className="px-3 py-1 rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: '#ed8936' }}
        >
          综合: {avgScore}
        </div>
      </div>

      <div className="h-64 md:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadarChart
            data={data}
            outerRadius="70%"
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{
                fill: '#4a5568',
                fontSize: 12,
                fontWeight: 500,
              }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 10]}
              tick={{ fill: '#a0aec0', fontSize: 10 }}
              axisLine={false}
              tickCount={5}
            />
            <Radar
              name="能力值"
              dataKey="value"
              stroke="#ed8936"
              fill="#ed8936"
              fillOpacity={0.3}
              strokeWidth={2}
              animationDuration={500}
              animationBegin={0}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(26, 54, 93, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value}/10`, '能力值']}
            />
          </RechartsRadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        {Object.entries(abilities).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {ABILITY_LABELS[key as keyof typeof ABILITY_LABELS]}
            </span>
            <span className="font-bold" style={{ color: '#1a365d' }}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(RadarChartComponent);
