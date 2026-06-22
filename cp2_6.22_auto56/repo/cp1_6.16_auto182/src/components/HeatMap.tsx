import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  ReferenceArea
} from 'recharts';
import type { HeatMapData, Area } from '../types';

interface HeatMapProps {
  data: HeatMapData[];
}

function getHeatColor(count: number, maxCount: number): string {
  if (maxCount === 0) return '#C8E6C9';
  const ratio = Math.min(count / maxCount, 1);
  const startR = 200, startG = 230, startB = 201;
  const endR = 183, endG = 28, endB = 28;
  const r = Math.round(startR + (endR - startR) * ratio);
  const g = Math.round(startG + (endG - startG) * ratio);
  const b = Math.round(startB + (endB - startB) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

interface TooltipData {
  day: string;
  area: Area;
  count: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: Record<string, unknown>; dataKey: string; name: string }>;
  label?: string;
}

const areaOrder: Area[] = ['东区', '西区', '南区', '北区'];

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const areaKey = payload[0].dataKey as string;
    const data = payload[0].payload as Record<string, unknown>;
    const countData = data[`${areaKey}_count`] as TooltipData;
    if (countData) {
      return (
        <div
          style={{
            background: '#FFFFFF',
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #D7CCC8',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            fontSize: 13,
            color: '#3E2723'
          }}
        >
          {countData.area} - {label}: {countData.count}笔交易
        </div>
      );
    }
  }
  return null;
};

export default function HeatMap({ data }: HeatMapProps) {
  const maxCount = data.length > 0 ? Math.max(...data.map(d => d.count)) : 0;

  const days = [...new Set(data.map(d => d.day))];

  const chartData = days.map(day => {
    const row: Record<string, unknown> = { day };
    for (const area of areaOrder) {
      const found = data.find(d => d.day === day && d.area === area);
      const count = found?.count ?? 0;
      row[area] = 1;
      row[`${area}_count`] = { day, area, count } as TooltipData;
      row[`${area}_color`] = getHeatColor(count, maxCount);
    }
    return row;
  });

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#EFEBE9" />
          <XAxis
            dataKey="day"
            tick={{ fill: '#5D4037', fontSize: 12 }}
            axisLine={{ stroke: '#D7CCC8' }}
            tickLine={false}
          />
          <YAxis
            type="number"
            tick={false}
            axisLine={false}
            tickLine={false}
            domain={[0, areaOrder.length]}
            ticks={[0.5, 1.5, 2.5, 3.5]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(141, 110, 99, 0.05)' }} />
          {areaOrder.map((area, idx) => (
            <Bar
              key={area}
              dataKey={area}
              stackId="heatmap"
              barSize={48}
              isAnimationActive={false}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${area}-${index}`}
                  fill={entry[`${area}_color`] as string}
                  className="heatmap-cell"
                />
              ))}
            </Bar>
          ))}
          {areaOrder.map((area, idx) => (
            <ReferenceArea
              key={`y-label-${area}`}
              y1={idx}
              y2={idx + 1}
              stroke="none"
              label={{
                value: area,
                position: 'insideLeft',
                fill: '#5D4037',
                fontSize: 12,
                offset: -5
              }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
