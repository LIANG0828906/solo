import { useState, useEffect, useMemo } from 'react';
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
import type { LeadSource } from '@/types';
import { useCRM } from '@/context/CRMContext';
import { cn } from '@/lib/utils';

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
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
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
        setIsAnimating(false);
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-300 ease-out hover:shadow-md animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className={cn(
            'text-3xl font-bold text-gray-900',
            isAnimating && 'animate-number-roll'
          )}>
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
  const { getDashboardMetrics } = useCRM();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const metrics = useMemo(() => getDashboardMetrics(), [getDashboardMetrics]);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const chartData = useMemo(() => {
    return metrics.dailyLeadsLast30Days.map((item) => ({
      date: formatDate(item.date),
      leads: item.leads,
      isToday: item.isToday,
      fullDate: item.date,
      previousDayLeads: item.previousDayLeads,
    }));
  }, [metrics]);

  const pieData = useMemo(() => {
    return metrics.sourceDistribution.map((item, index) => ({
      name: item.source,
      value: item.count,
      percentage: item.percentage,
      index,
    }));
  }, [metrics]);

  const sourceColors: Record<LeadSource, string> = {
    '线上广告': '#5A67D8',
    '线下展会': '#48BB78',
    '朋友推荐': '#ED8936',
    '主动搜索': '#9F7AEA',
  };

  const getSaturatedColor = (source: LeadSource, index: number, total: number): string => {
    const baseColor = sourceColors[source];
    const saturation = 100 - (index / total) * 20;
    const lightness = 45 + (index / total) * 10;

    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);

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
        fill="#5A67D8"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-bold"
      >
        {`${name}: ${percentage}%`}
      </text>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-6 animate-fade-in-up">
          <h1 className="text-2xl font-bold text-gray-900">数据仪表盘</h1>
          <p className="text-gray-500 mt-1">实时监控销售数据和业务趋势</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="总线索数"
            value={metrics.totalLeads}
            icon={Users}
            color="#5A67D8"
            suffix=" 条"
          />
          <MetricCard
            title="转化率"
            value={metrics.conversionRate}
            icon={TrendingUp}
            color="#48BB78"
            suffix="%"
          />
          <MetricCard
            title="赢单金额总和"
            value={metrics.totalWonAmount}
            icon={DollarSign}
            color="#ED8936"
            prefix="¥ "
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
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
                    const isYesterday = index === chartData.length - 2;
                    const isToday = index === chartData.length - 1;

                    return (
                      <Line
                        key={`segment-${index}`}
                        type="monotone"
                        dataKey="leads"
                        data={[chartData[index - 1], entry]}
                        stroke={isToday ? '#5A67D8' : '#A5A3E8'}
                        strokeWidth={isToday ? 3 : 2}
                        strokeDasharray={isYesterday ? '5 5' : '0'}
                        dot={isToday ? { fill: '#5A67D8', strokeWidth: 2, r: 5 } : false}
                        activeDot={{ fill: '#5A67D8', strokeWidth: 0, r: 6 }}
                        connectNulls
                      />
                    );
                  })}
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
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
                        fill={getSaturatedColor(entry.name as LeadSource, index, pieData.length)}
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
                    style={{ backgroundColor: getSaturatedColor(item.name as LeadSource, index, pieData.length) }}
                  />
                  <span className="text-gray-600">{item.name}</span>
                  <span className="text-gray-400 ml-1">({item.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
