import { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { useReadingStore } from '../../stores/readingStore';
import { ChartData } from '../../types';

const SkeletonCard = () => (
  <div className="bg-primary-card rounded-lg p-4 h-64">
    <div className="h-6 w-32 bg-gray-700 rounded animate-pulse-slow mb-4" />
    <div className="h-40 bg-gray-700/50 rounded animate-pulse-slow" />
  </div>
);

export const StatsDashboard = () => {
  const { getStats } = useReadingStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const stats: ChartData = useMemo(() => getStats(), [getStats]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-primary-dark/95 backdrop-blur-sm border border-accent/30 rounded-lg px-3 py-2 text-sm">
          <p className="text-text-secondary text-xs mb-1">{label}</p>
          <p className="text-white font-medium">
            {payload[0].name}: <span className="text-accent">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
      <div className="bg-primary-card rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-teal" />
          每日阅读页数趋势
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.dailyPages} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A2E" opacity={0.5} />
              <XAxis
                dataKey="date"
                stroke="#A0A0B0"
                fontSize={10}
                tickFormatter={(value) => value.slice(5)}
                axisLine={{ stroke: '#1A1A2E' }}
                tickLine={false}
              />
              <YAxis stroke="#A0A0B0" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="pages"
                stroke="#4ECDC4"
                strokeWidth={2}
                dot={{ r: 3, fill: '#4ECDC4', strokeWidth: 2, stroke: '#16213E' }}
                activeDot={{ r: 6, fill: '#4ECDC4', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-primary-card rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent" />
          阅读偏好分析
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={stats.radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#1A1A2E" strokeOpacity={0.6} />
              <PolarAngleAxis dataKey="dimension" stroke="#A0A0B0" fontSize={11} />
              <PolarRadiusAxis angle={90} domain={[0, 10]} stroke="#A0A0B0" fontSize={9} tick={false} axisLine={false} />
              <Radar
                dataKey="value"
                stroke="#E94560"
                fill="#E94560"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-primary-card rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent" />
          各时段阅读时长
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.timeSlots} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A2E" opacity={0.5} vertical={false} />
              <XAxis
                dataKey="slot"
                stroke="#A0A0B0"
                fontSize={9}
                axisLine={{ stroke: '#1A1A2E' }}
                tickLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis stroke="#A0A0B0" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="duration" radius={[4, 4, 0, 0]} name="时长(分钟)">
                {stats.timeSlots.map((_, index) => (
                  <Cell key={`cell-${index}`} fill="#E94560" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-primary-card rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-teal" />
          阅读热力分布
        </h3>
        <div className="h-48 overflow-x-auto">
          <div className="min-w-[400px] h-full flex flex-col gap-1">
            <div className="flex gap-1 flex-wrap">
              {stats.heatmapData.map((item) => {
                const intensity = Math.min(item.pages / 100, 1);
                const r = Math.round(15 + intensity * (233 - 15));
                const g = Math.round(52 + intensity * (69 - 52));
                const b = Math.round(96 + intensity * (96 - 96));
                const color = intensity > 0.3
                  ? `rgba(${233}, ${69}, ${96}, ${0.3 + intensity * 0.7})`
                  : `rgba(${15}, ${52}, ${96}, ${0.3 + intensity * 0.7})`;

                return (
                  <div
                    key={item.date}
                    className="w-6 h-6 rounded cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={`${item.date}: ${item.pages}页`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-text-secondary">
              <span>少</span>
              <div className="flex gap-1">
                {[0.2, 0.4, 0.6, 0.8, 1].map((v) => (
                  <div
                    key={v}
                    className="w-4 h-4 rounded"
                    style={{
                      backgroundColor: v > 0.3
                        ? `rgba(233, 69, 96, ${0.3 + v * 0.7})`
                        : `rgba(15, 52, 96, ${0.3 + v * 0.7})`
                    }}
                  />
                ))}
              </div>
              <span>多</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
