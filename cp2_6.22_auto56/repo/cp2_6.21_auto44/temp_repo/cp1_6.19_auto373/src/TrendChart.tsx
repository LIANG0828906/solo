import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TrendChartProps {
  data: { date: string; stock: number }[];
}

const getStockColor = (stock: number) => {
  if (stock < 5) return '#EF5350';
  if (stock < 15) return '#FFA726';
  return '#66BB6A';
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const color = getStockColor(data.stock);
    return (
      <div
        style={{
          backgroundColor: '#fff',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: `2px solid ${color}`,
        }}
      >
        <p style={{ margin: 0, fontSize: '13px', color: '#666', marginBottom: '4px' }}>
          {label}
        </p>
        <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color }}>
          库存: {data.stock} 本
        </p>
      </div>
    );
  }
  return null;
};

export const TrendChart = ({ data }: TrendChartProps) => {
  const maxStock = Math.max(...data.map((d) => d.stock), 10);
  const minStock = Math.min(...data.map((d) => d.stock), 0);
  const lastStock = data[data.length - 1]?.stock || 0;
  const lineColor = getStockColor(lastStock);

  return (
    <div style={{ width: '100%', height: '280px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }}>
      <h4
        style={{
          margin: '0 0 16px 0',
          fontSize: '14px',
          fontWeight: 600,
          color: '#1a237e',
        }}
      >
        近7天库存趋势
      </h4>
      <ResponsiveContainer width="100%" height="220px">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="stockGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#66BB6A" />
              <stop offset="50%" stopColor="#FFA726" />
              <stop offset="100%" stopColor="#EF5350" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#888' }}
            tickFormatter={(value) => value.slice(5)}
            axisLine={{ stroke: '#ddd' }}
          />
          <YAxis
            domain={[Math.max(0, minStock - 5), Math.max(maxStock + 5, 10)]}
            tick={{ fontSize: 11, fill: '#888' }}
            axisLine={{ stroke: '#ddd' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="stock"
            stroke={lineColor}
            strokeWidth={3}
            dot={{ fill: lineColor, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: lineColor, stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
