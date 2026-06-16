import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import type { TimeRange } from '@/types';
import { MOOD_COLORS } from '@/types';

interface ChartData {
  name: string;
  value: number;
}

interface AnimatedChartProps {
  data: ChartData[];
  timeRange: TimeRange;
  chartKey: string;
}

export function BarChartComponent({ data, timeRange, chartKey }: AnimatedChartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => {
      setAnimationKey((prev) => prev + 1);
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [timeRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-[#DCD6D0] rounded-lg px-3 py-2 shadow-md">
          <p className="text-sm font-medium text-gray-800">{label}</p>
          <p className="text-sm" style={{ color: '#8B4513' }}>
            {payload[0].value} 页
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="transition-all duration-700 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      }}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} key={`bar-${chartKey}-${animationKey}`} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#DCD6D0' }} />
          <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#DCD6D0' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="value"
            fill="#8B4513"
            radius={[4, 4, 0, 0]}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((_, index) => (
              <defs key={`grad-${index}`}>
                <linearGradient id={`barGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A0522D" />
                  <stop offset="100%" stopColor="#8B4513" />
                </linearGradient>
              </defs>
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface PieChartProps {
  data: Array<{ name: string; value: number }>;
  timeRange: TimeRange;
}

export function PieChartComponent({ data, timeRange }: PieChartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => {
      setAnimationKey((prev) => prev + 1);
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [timeRange]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const total = data.reduce((sum, item) => sum + item.value, 0);
      const percentage = total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white border border-[#DCD6D0] rounded-lg px-3 py-2 shadow-md">
          <p className="text-sm font-medium text-gray-800">{payload[0].name}</p>
          <p className="text-sm" style={{ color: '#8B4513' }}>
            {payload[0].value} 次 ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="transition-all duration-700 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transitionDelay: '100ms',
      }}
    >
      <ResponsiveContainer width="100%" height={280}>
        <PieChart key={`pie-${animationKey}`}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={MOOD_COLORS[entry.name] || '#9E9E9E'}
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface LineChartProps {
  data: ChartData[];
  timeRange: TimeRange;
}

export function LineChartComponent({ data, timeRange }: LineChartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => {
      setAnimationKey((prev) => prev + 1);
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [timeRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-[#DCD6D0] rounded-lg px-3 py-2 shadow-md">
          <p className="text-sm font-medium text-gray-800">{label}</p>
          <p className="text-sm" style={{ color: '#8B4513' }}>
            连续阅读 {payload[0].value} 天
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="transition-all duration-700 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transitionDelay: '200ms',
      }}
    >
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} key={`line-${animationKey}`} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#DCD6D0' }} />
          <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#DCD6D0' }} />
          <Tooltip content={<CustomTooltip />} />
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8B4513" />
              <stop offset="100%" stopColor="#A0522D" />
            </linearGradient>
          </defs>
          <Line
            type="monotone"
            dataKey="value"
            stroke="url(#lineGradient)"
            strokeWidth={3}
            dot={{ fill: '#8B4513', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#A0522D' }}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
