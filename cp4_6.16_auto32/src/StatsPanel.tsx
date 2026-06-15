import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, getHours, differenceInCalendarDays, startOfDay, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Photo, Trip } from './types';

const cardStyle: React.CSSProperties = {
  backgroundColor: '#2d2d44',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
  transition: 'all 0.3s ease'
};

const timePeriodLabels: Record<string, string> = {
  morning: '🌅 上午 (6-12)',
  afternoon: '☀️ 下午 (12-17)',
  evening: '🌆 傍晚 (17-20)',
  night: '🌙 夜晚 (20-6)'
};

export default function StatsPanel({ trip, photos }: { trip: Trip | undefined; photos: Photo[] }) {
  const stats = useMemo(() => {
    const totalPhotos = photos.length;

    const uniqueCities = new Set(photos.map((p) => p.cityName)).size;

    let tripDays = 0;
    if (trip) {
      tripDays = differenceInCalendarDays(
        startOfDay(parseISO(trip.endDate)),
        startOfDay(parseISO(trip.startDate))
      ) + 1;
    }

    const timePeriods = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    photos.forEach((p) => {
      const hour = getHours(new Date(p.captureTime));
      if (hour >= 6 && hour < 12) timePeriods.morning++;
      else if (hour >= 12 && hour < 17) timePeriods.afternoon++;
      else if (hour >= 17 && hour < 20) timePeriods.evening++;
      else timePeriods.night++;
    });

    let mostActivePeriod: keyof typeof timePeriods = 'morning';
    let maxCount = -1;
    (Object.keys(timePeriods) as (keyof typeof timePeriods)[]).forEach((k) => {
      if (timePeriods[k] > maxCount) {
        maxCount = timePeriods[k];
        mostActivePeriod = k;
      }
    });

    const dailyData: { date: string; count: number; displayDate: string }[] = [];
    const dayCount = new Map<string, number>();
    photos.forEach((p) => {
      const d = format(new Date(p.captureTime), 'yyyy-MM-dd');
      dayCount.set(d, (dayCount.get(d) || 0) + 1);
    });
    const sortedDates = Array.from(dayCount.entries()).sort((a, b) =>
      new Date(a[0]).getTime() - new Date(b[0]).getTime()
    );
    sortedDates.forEach(([date, count]) => {
      dailyData.push({
        date,
        count,
        displayDate: format(new Date(date), 'M/d', { locale: zhCN })
      });
    });

    return {
      totalPhotos,
      uniqueCities,
      tripDays,
      timePeriods,
      mostActivePeriod,
      dailyData
    };
  }, [trip, photos]);

  const StatItem = ({
    icon,
    label,
    value,
    sub
  }: {
    icon: string;
    label: string;
    value: string;
    sub?: string;
  }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 0' }}>
      <div
        style={{
          fontSize: '28px',
          lineHeight: 1,
          marginTop: '2px'
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#e0e0ff', lineHeight: 1.2 }}>
          {value}
        </div>
        <div style={{ fontSize: '12px', color: '#8080a0', marginTop: '4px' }}>{label}</div>
        {sub && (
          <div style={{ fontSize: '11px', color: '#a29bfe', marginTop: '2px' }}>{sub}</div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={cardStyle}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#e0e0ff', marginBottom: '8px' }}>
          📊 行程统计
        </h3>
        <div style={{ borderTop: '1px solid #3d3d5c', marginTop: '12px' }}>
          <StatItem icon="📷" label="总照片数" value={stats.totalPhotos.toString()} />
        </div>
        <div style={{ borderTop: '1px solid #3d3d5c' }}>
          <StatItem icon="🏙️" label="覆盖城市数" value={stats.uniqueCities.toString()} />
        </div>
        <div style={{ borderTop: '1px solid #3d3d5c' }}>
          <StatItem
            icon="📅"
            label="总旅行天数"
            value={stats.tripDays > 0 ? `${stats.tripDays} 天` : '-'}
          />
        </div>
        <div style={{ borderTop: '1px solid #3d3d5c' }}>
          <StatItem
            icon="⏰"
            label="最常拍照时段"
            value={timePeriodLabels[stats.mostActivePeriod]}
            sub={`${stats.timePeriods[stats.mostActivePeriod]} 张`}
          />
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#e0e0ff', marginBottom: '16px' }}>
          📈 每日照片分布
        </h3>
        {stats.dailyData.length === 0 ? (
          <div
            style={{
              padding: '40px 0',
              textAlign: 'center',
              color: '#606080',
              fontSize: '13px'
            }}
          >
            暂无数据
          </div>
        ) : (
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.dailyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#3d3d5c" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fill: '#8080a0', fontSize: 11 }}
                  axisLine={{ stroke: '#3d3d5c' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#8080a0', fontSize: 11 }}
                  axisLine={{ stroke: '#3d3d5c' }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#2d2d44',
                    border: '1px solid #3d3d5c',
                    borderRadius: '8px',
                    color: '#e0e0ff',
                    fontSize: '13px'
                  }}
                  labelStyle={{ color: '#a29bfe', marginBottom: '4px', fontWeight: 600 }}
                  formatter={(value: number) => [`${value} 张`, '照片数量']}
                  labelFormatter={(label: string) => label}
                  cursor={{ fill: 'rgba(108, 92, 231, 0.1)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {stats.dailyData.map((entry, index) => {
                    const t =
                      stats.dailyData.length > 1
                        ? index / (stats.dailyData.length - 1)
                        : 0;
                    const r = Math.round(108 + (255 - 108) * t);
                    const g = Math.round(92 + (107 - 92) * t);
                    const b = Math.round(231 + (129 - 231) * t);
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={`rgb(${r}, ${g}, ${b})`}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#e0e0ff', marginBottom: '12px' }}>
          🕐 时段分布
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(Object.keys(stats.timePeriods) as (keyof typeof stats.timePeriods)[]).map(
            (period) => {
              const count = stats.timePeriods[period];
              const total = Object.values(stats.timePeriods).reduce((a, b) => a + b, 0);
              const percent = total > 0 ? (count / total) * 100 : 0;
              const labels: Record<string, string> = {
                morning: '#6c5ce7',
                afternoon: '#fdcb6e',
                evening: '#e17055',
                night: '#0984e3'
              };
              const periodOnly = timePeriodLabels[period].split(' ').slice(1).join(' ');
              return (
                <div key={period}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                      fontSize: '12px',
                      color: '#a0a0c0'
                    }}
                  >
                    <span>{periodOnly}</span>
                    <span style={{ color: '#e0e0ff', fontWeight: 600 }}>
                      {count} 张 ({percent.toFixed(0)}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      backgroundColor: '#1e1e2e',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${percent}%`,
                        backgroundColor: labels[period],
                        borderRadius: '3px',
                        transition: 'width 0.5s ease-out'
                      }}
                    />
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
