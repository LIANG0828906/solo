import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { useRouteStore } from '../store/useRouteStore';

const CalorieChart: React.FC = () => {
  const calorieData = useRouteStore((state) => state.calorieData);

  const difficultSegments = calorieData.reduce<{ start: number; end: number }[]>(
    (segments, point, index) => {
      if (point.isDifficult) {
        const lastSegment = segments[segments.length - 1];
        if (lastSegment && lastSegment.end === index - 1) {
          lastSegment.end = index;
        } else {
          segments.push({ start: index, end: index });
        }
      }
      return segments;
    },
    []
  );

  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={calorieData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="distance"
            tick={{ fontSize: 11, fill: '#666' }}
            axisLine={{ stroke: '#e0e0e0' }}
            tickLine={false}
            unit="km"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#666' }}
            axisLine={false}
            tickLine={false}
            unit="kcal"
            width={50}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div
                    style={{
                      backgroundColor: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontSize: 12,
                    }}
                  >
                    <div style={{ marginBottom: 4 }}>距离: {label}km</div>
                    <div style={{ marginBottom: 4 }}>卡路里: {data.calories}kcal</div>
                    <div style={{ marginBottom: 4 }}>坡度: {data.slope}%</div>
                    <div style={{ color: data.isDifficult ? '#f44336' : '#4caf50' }}>
                      {data.isDifficult ? '困难路段' : '正常路段'}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          {difficultSegments.map((segment, index) => (
            <ReferenceArea
              key={index}
              x1={calorieData[segment.start].distance}
              x2={calorieData[segment.end].distance}
              fill="#f44336"
              fillOpacity={0.15}
            />
          ))}
          <Line
            type="monotone"
            dataKey="calories"
            stroke="#FF9800"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5, fill: '#FF9800' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CalorieChart;
