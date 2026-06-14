import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Users, TrendingUp, DollarSign, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { useCRM } from '@/context/CRMContext';

interface MetricCardProps {
  title: string;
  value: number;
  icon: typeof Users;
  color: string;
  suffix?: string;
  prefix?: string;
}

function MetricCard({ title, value, icon: Icon, color, suffix = '', prefix = '' }: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(stepValue * step, value);
      setDisplayValue(Math.round(current));

      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(value);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const formatValue = (num: number): string => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-300 ease-out hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">
            {prefix}
            {formatValue(displayValue)}
            {suffix}
          </p>
        </div>
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color + '20' }}
        >
          <Icon className="w-7 h-7" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function CustomLineTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-sm text-indigo-600 font-semibold">
          新增线索: {payload[0].value} 条
        </p>
      </div>
    );
  }
  return null;
}

function CustomPieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { percentage: number } }> }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-900">{payload[0].name}</p>
        <p className="text-sm text-gray-600">
          数量: <span className="font-semibold">{payload[0].value} 条</span>
        </p>
        <p className="text-sm text-indigo-600 font-semibold">
          占比: {payload[0].payload.percentage}%
        </p>
      </div>
    );
  }
  return null;
}

export default function Dashboard() {
  const {
    getTotalLeads,
    getOverallConversionRate,
    getTotalWonAmount,
    getDailyLeadsLast30Days,
    getLeadSourceDistribution,
  } = useCRM();

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const totalLeads = getTotalLeads();
  const conversionRate = getOverallConversionRate();
  const totalWonAmount = getTotalWonAmount();

  const dailyLeads = getDailyLeadsLast30Days();
  const sourceDistribution = getLeadSourceDistribution();

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const chartData = dailyLeads.map((item) => ({
    date: formatDate(item.date),
    leads: item.leads,
    isToday: item.isToday,
    fullDate: item.date,
  }));

  const pieData = sourceDistribution.map((item, index) => ({
    name: item.source,
    value: item.count,
    percentage: item.percentage,
    index,
  }));

  const COLORS = [
    '#4F46E5',
    '#7C3AED',
    '#EC4899',
    '#F59E0B',
    '#10B981',
    '#06B6D4',
    '#EF4444',
    '#8B5CF6',
  ];

  const getSaturatedColor = (baseColor: string, index: number, total: number): string => {
    const saturation = 100 - (index / total) * 40;
    const lightness = 45 + (index / total) * 15;
    return baseColor.replace(
      /^#([A-Fa-f0-9]{6})$/,
      (_, hex) => {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const max = Math.max(r, g, b) / 255;
        const min = Math.min(r, g, b) / 255;
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r / 255: h = ((g / 255 - b / 255) / d + (g / 255 < b / 255 ? 6 : 0)) / 6; break;
            case g / 255: h = ((b / 255 - r / 255) / d + 2) / 6; break;
            case b / 255: h = ((r / 255 - g / 255) / d + 4) / 6; break;
          }
        }

        return `hsl(${Math.round(h * 360)}, ${saturation}%, ${lightness}%)`;
      }
    );
  };

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percentage, active }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    name: string;
    percentage: number;
    active: boolean;
  }) => {
    if (!active) return null;

    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#4F46E5"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-bold"
      >
        {`${name}: ${percentage}%`}
      </text>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">数据仪表盘</h1>
        <p className="text-gray-500 mt-1">实时监控销售数据和业务趋势</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="总线索数"
          value={totalLeads}
          icon={Users}
          color="#4F46E5"
          suffix=" 条"
        />
        <MetricCard
          title="转化率"
          value={conversionRate}
          icon={TrendingUp}
          color="#10B981"
          suffix="%"
        />
        <MetricCard
          title="赢单金额总和"
          value={totalWonAmount}
          icon={DollarSign}
          color="#F59E0B"
          prefix="¥ "
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-6">
            <BarChart3 className="w-5 h-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">近30天新增线索</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                  interval={Math.floor(chartData.length / 6)}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomLineTooltip />} />
                {chartData.map((entry, index) => {
                  if (index === 0) return null;
                  const isLastTwo = index >= chartData.length - 2;
                  const isYesterday = index === chartData.length - 2;
                  const isToday = index === chartData.length - 1;

                  return (
                    <Line
                      key={`segment-${index}`}
                      type="monotone"
                      dataKey="leads"
                      data={[chartData[index - 1], entry]}
                      stroke={isToday ? '#4F46E5' : '#818CF8'}
                      strokeWidth={isToday ? 3 : 2}
                      strokeDasharray={isYesterday ? '5 5' : '0'}
                      dot={isToday ? { fill: '#4F46E5', strokeWidth: 2, r: 5 } : false}
                      activeDot={{ fill: '#4F46E5', strokeWidth: 0, r: 6 }}
                      connectNulls
                    />
                  );
                })}
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-0.5 bg-gray-400 mr-2" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #9CA3AF 0px, #9CA3AF 4px, transparent 4px, transparent 8px)' }}></div>
              <span className="text-gray-500">前一天</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-0.5 bg-indigo-600 mr-2"></div>
              <span className="text-gray-500">当天</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-6">
            <PieChartIcon className="w-5 h-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">线索来源分布</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  labelLine={false}
                  label={renderCustomLabel as never}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getSaturatedColor(COLORS[index % COLORS.length], index, pieData.length)}
                      style={{
                        transform: activeIndex === index ? 'scale(1.08)' : 'scale(1)',
                        transformOrigin: 'center',
                        transition: 'transform 300ms ease-out',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {pieData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center text-sm"
              >
                <div
                  className="w-3 h-3 rounded-full mr-1.5"
                  style={{ backgroundColor: getSaturatedColor(COLORS[index % COLORS.length], index, pieData.length) }}
                />
                <span className="text-gray-600">{item.name}</span>
                <span className="text-gray-400 ml-1">({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
