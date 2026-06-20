import React from 'react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'

interface ChartData {
  date: string
  value: number
}

interface LineChartProps {
  data: ChartData[]
  lineColor: string
  gradientId: string
}

const LineChart: React.FC<LineChartProps> = ({ data, lineColor, gradientId }) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={lineColor} stopOpacity={0.4} />
            <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="date" stroke="#aaaaaa" />
        <YAxis stroke="#aaaaaa" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(20, 10, 40, 0.95)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            color: '#fff'
          }}
          labelStyle={{ color: '#fff' }}
          formatter={(value: number) => [value, '数值']}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={lineColor}
          strokeWidth={3}
          fill={`url(#${gradientId})`}
          dot={{ fill: lineColor, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: lineColor, strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default LineChart
