import { memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  BarChart,
  Bar,
  Cell,
  LabelList
} from 'recharts';
import { LineChartPoint, BarChartItem } from '../../data/types';

const lineTooltipStyle: React.CSSProperties = {
  background: '#1F2937',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '6px 10px',
  fontSize: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
};

const areLineDataEqual = (prev: { data: LineChartPoint[] }, next: { data: LineChartPoint[] }) => {
  if (prev.data.length !== next.data.length) return false;
  for (let i = 0; i < prev.data.length; i++) {
    const a = prev.data[i], b = next.data[i];
    if (a.date !== b.date || a.systolic !== b.systolic ||
        a.diastolic !== b.diastolic || a.bloodSugar !== b.bloodSugar) {
      return false;
    }
  }
  return true;
};

export const HealthLineChart = memo(({ data }: { data: LineChartPoint[] }) => {
  return (
    <div style={{ width: '65%', height: 300, background: '#F3F4F6', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>
        健康指标趋势
      </div>
      <ResponsiveContainer width="100%" height="88%">
        <ComposedChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="sysFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="diaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
            angle={-45}
            textAnchor="end"
            height={50}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
            domain={['auto', 'auto']}
            width={45}
          />
          <Tooltip
            contentStyle={lineTooltipStyle}
            labelStyle={{ color: '#D1D5DB', fontSize: 11, marginBottom: 4 }}
            itemStyle={{ fontSize: 12, color: '#fff' }}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Area type="monotone" dataKey="systolic" stroke="none" fill="url(#sysFill)" connectNulls />
          <Area type="monotone" dataKey="diastolic" stroke="none" fill="url(#diaFill)" connectNulls />
          <Line
            type="monotone"
            dataKey="systolic"
            name="收缩压"
            stroke="#6366F1"
            strokeWidth={2.2}
            dot={{ r: 3.5, fill: '#6366F1', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="diastolic"
            name="舒张压"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={{ r: 3, fill: '#8B5CF6', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="bloodSugar"
            name="血糖"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={{ r: 3, fill: '#F59E0B', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}, areLineDataEqual);

const areBarDataEqual = (prev: { data: BarChartItem[] }, next: { data: BarChartItem[] }) => {
  if (prev.data.length !== next.data.length) return false;
  for (let i = 0; i < prev.data.length; i++) {
    const a = prev.data[i], b = next.data[i];
    if (a.name !== b.name || a.count !== b.count) return false;
  }
  return true;
};

export const MedicationBarChart = memo(({ data }: { data: BarChartItem[] }) => {
  const renderBar = (props: any) => {
    const { x, y, width, height } = props;
    const gradId = `bar-grad-${Math.round(x)}-${Math.round(y)}`;
    return (
      <g>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={4}
          fill={`url(#${gradId})`}
          style={{
            transition: 'transform 0.2s ease, filter 0.2s ease',
            transformOrigin: `${x + width / 2}px ${y + height}px`
          }}
          className="med-bar"
        />
      </g>
    );
  };

  return (
    <div style={{ width: 'calc(35% - 16px)', height: 300, background: '#F3F4F6', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>
        用药频率分布
      </div>
      <ResponsiveContainer width="100%" height="88%">
        <BarChart data={data} barGap={4} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
            width={35}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={lineTooltipStyle}
            cursor={{ fill: 'rgba(99,102,241,0.06)' }}
            itemStyle={{ fontSize: 12, color: '#fff' }}
            formatter={(v: number) => [`${v} 次`, '次数']}
          />
          <Bar
            dataKey="count"
            shape={renderBar}
            name="次数"
            onMouseEnter={(e: any) => {
              if (e && e.activeTooltipIndex !== undefined) {
                const bars = document.querySelectorAll('.med-bar') as NodeListOf<SVGRectElement>;
                bars.forEach((b, i) => {
                  if (i === e.activeTooltipIndex) {
                    b.style.transform = 'scaleY(1.05)';
                    b.style.filter = 'brightness(1.1)';
                  }
                });
              }
            }}
            onMouseLeave={() => {
              const bars = document.querySelectorAll('.med-bar') as NodeListOf<SVGRectElement>;
              bars.forEach((b) => {
                b.style.transform = 'scaleY(1)';
                b.style.filter = 'none';
              });
            }}
          >
            <LabelList
              dataKey="count"
              position="top"
              style={{ fontSize: 11, fill: '#6B7280', fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}, areBarDataEqual);
