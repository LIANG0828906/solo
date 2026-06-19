import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useLearningStore } from '@/store/useLearningStore';

const SpeedChart: React.FC = () => {
  const { learningRecords, units } = useLearningStore();

  const chartData = useMemo(() => {
    if (learningRecords.length === 0) {
      return units.slice(0, 4).map((unit, index) => ({
        name: `单元${index + 1}`,
        unitId: unit.id,
        time: 10 + index * 5,
        score: 70 + index * 5,
        isMock: true,
      }));
    }

    return learningRecords
      .sort((a, b) => a.order - b.order)
      .map((record) => ({
        name: `单元${record.order}`,
        unitId: record.unitId,
        time: record.timeSpent,
        score: record.score,
        isMock: false,
      }));
  }, [learningRecords, units]);

  const dotProps = (score: number) => {
    let fill = '#38a169';
    if (score < 60) fill = '#e53e3e';
    else if (score < 80) fill = '#d69e2e';

    return { fill, stroke: 'white', strokeWidth: 2 };
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="p-3 rounded-lg shadow-lg"
          style={{
            backgroundColor: 'rgba(26, 54, 93, 0.95)',
            color: 'white',
            minWidth: '120px',
          }}
        >
          <p className="font-bold mb-1">{data.name}</p>
          <p className="text-sm text-gray-300">
            学习时间: <span className="text-white font-medium">{data.time}分钟</span>
          </p>
          <p className="text-sm text-gray-300">
            得分率:{' '}
            <span
              className="font-medium"
              style={{
                color:
                  data.score >= 80
                    ? '#68d391'
                    : data.score >= 60
                    ? '#f6e05e'
                    : '#fc8181',
              }}
            >
              {data.score}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const avgTime = useMemo(() => {
    if (chartData.length === 0) return 0;
    const total = chartData.reduce((sum, d) => sum + d.time, 0);
    return Math.round(total / chartData.length);
  }, [chartData]);

  return (
    <div
      className="bg-white rounded-2xl shadow-lg p-5"
      style={{
        animation: 'fadeIn 0.5s ease',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#1a365d' }}
          >
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-bold" style={{ color: '#1a365d' }}>
            学习速度追踪
          </h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">平均用时</p>
          <p className="text-lg font-bold" style={{ color: '#ed8936' }}>
            {avgTime}分钟
          </p>
        </div>
      </div>

      <div className="h-56 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1a365d" />
                <stop offset="100%" stopColor="#ed8936" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#718096', fontSize: 11 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#718096', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}m`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ed8936', strokeDasharray: '5 5' }} />
            <ReferenceLine
              y={avgTime}
              stroke="#ed8936"
              strokeDasharray="5 5"
              strokeWidth={1}
              label={{
                value: '平均',
                fill: '#ed8936',
                fontSize: 10,
                position: 'right',
              }}
            />
            <Line
              type="monotone"
              dataKey="time"
              stroke="url(#lineGradient)"
              strokeWidth={3}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const dotStyle = dotProps(payload.score);
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill={dotStyle.fill}
                    stroke={dotStyle.stroke}
                    strokeWidth={dotStyle.strokeWidth}
                    className="transition-all duration-300 hover:r-8"
                  />
                );
              }}
              activeDot={{ r: 10, stroke: 'white', strokeWidth: 3 }}
              animationDuration={800}
              animationBegin={200}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs text-gray-500">优秀 (≥80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-xs text-gray-500">良好 (60-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs text-gray-500">待提升 ({'<60%'})</span>
        </div>
      </div>

      {learningRecords.length === 0 && (
        <p className="text-center text-xs text-gray-400 mt-3">
          💡 完成测验后将显示真实学习数据
        </p>
      )}
    </div>
  );
};

export default React.memo(SpeedChart);
