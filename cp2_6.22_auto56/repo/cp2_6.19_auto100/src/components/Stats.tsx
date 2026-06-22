import { useState, useMemo } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Cross,
  ReferenceLine,
} from 'recharts';
import { parseISO, getHours, format } from 'date-fns';
import { BarChart3, Clock } from 'lucide-react';
import { PomodoroRecord, TaskType } from '@/utils/storage';

interface StatsProps {
  records: PomodoroRecord[];
}

interface HourStat {
  hour: string;
  hourNum: number;
  count: number;
  records: PomodoroRecord[];
}

const typeColors: Record<TaskType, string> = {
  work: '#3b82f6',
  study: '#22c55e',
  exercise: '#f97316',
};

const typeLabels: Record<TaskType, string> = {
  work: '工作',
  study: '学习',
  exercise: '运动',
};

export default function Stats({ records }: StatsProps) {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [activeHour, setActiveHour] = useState<number | null>(null);

  const hourlyData = useMemo<HourStat[]>(() => {
    const map = new Map<number, PomodoroRecord[]>();
    for (let h = 0; h < 24; h++) map.set(h, []);

    for (const r of records) {
      const h = getHours(parseISO(r.completedAt));
      if (h >= 0 && h < 24) {
        map.get(h)?.push(r);
      }
    }

    const startHour = 6;
    const endHour = 23;
    const result: HourStat[] = [];
    for (let h = startHour; h <= endHour; h++) {
      result.push({
        hour: `${String(h).padStart(2, '0')}:00`,
        hourNum: h,
        count: map.get(h)?.length ?? 0,
        records: map.get(h) ?? [],
      });
    }
    return result;
  }, [records]);

  const totalToday = records.reduce((sum, r) => sum + r.duration, 0);
  const peakHour = hourlyData.reduce((max, d) => (d.count > max.count ? d : max), hourlyData[0]);

  const typeStats = useMemo(() => {
    const s: Record<TaskType, number> = { work: 0, study: 0, exercise: 0 };
    records.forEach((r) => {
      s[r.taskType] += r.duration;
    });
    return s;
  }, [records]);

  const selectedRecords = selectedHour !== null ? hourlyData.find((d) => d.hourNum === selectedHour)?.records ?? [] : [];

  const crosshair = activeHour !== null
    ? hourlyData.find((d) => d.hourNum === activeHour)
    : null;

  return (
    <div className="glass rounded-2xl p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg flex items-center gap-2">
          <BarChart3 size={18} className="text-indigo-300" />
          今日统计
        </h3>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Clock size={12} />
          {totalToday} 分钟专注
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="glass-card rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-white">{records.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">番茄钟数</div>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-indigo-300">{totalToday}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">专注分钟</div>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-emerald-300">
            {peakHour?.hour ?? '--'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">专注高峰</div>
        </div>
      </div>

      {(typeStats.work > 0 || typeStats.study > 0 || typeStats.exercise > 0) && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {(Object.keys(typeStats) as TaskType[]).map((t) =>
            typeStats[t] > 0 ? (
              <span
                key={t}
                className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                style={{
                  background: `${typeColors[t]}22`,
                  color: typeColors[t],
                  border: `1px solid ${typeColors[t]}55`,
                }}
              >
                {typeLabels[t]} {typeStats[t]}m
              </span>
            ) : null,
          )}
        </div>
      )}

      <div className="flex-1 min-h-[220px] mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={hourlyData}
            margin={{ top: 10, right: 8, bottom: 8, left: -20 }}
            onClick={(state) => {
              if (state?.activePayload && state.activePayload[0]) {
                const h = (state.activePayload[0].payload as HourStat).hourNum;
                setSelectedHour((prev) => (prev === h ? null : h));
              }
            }}
            onMouseMove={(state) => {
              if (state?.activePayload && state.activePayload[0]) {
                const h = (state.activePayload[0].payload as HourStat).hourNum;
                setActiveHour(h);
              } else {
                setActiveHour(null);
              }
            }}
            onMouseLeave={() => setActiveHour(null)}
          >
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />

            <XAxis
              dataKey="hour"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              interval={2}
            />

            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 'auto']}
              allowDecimals={false}
            />

            {crosshair && (
              <ReferenceLine
                x={crosshair.hour}
                stroke="rgba(255,255,255,0.25)"
                strokeDasharray="4 4"
              />
            )}

            <Area
              type="monotone"
              dataKey="count"
              fill="url(#areaFill)"
              stroke="none"
              isAnimationActive={false}
            />

            <Line
              type="monotone"
              dataKey="count"
              stroke="#a5b4fc"
              strokeWidth={2.5}
              dot={(props: { cx: number; cy: number; value: number; payload: HourStat }) => {
                const { cx, cy, value, payload } = props;
                const isActive = activeHour === payload.hourNum || selectedHour === payload.hourNum;
                return (
                  <g>
                    {isActive && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={10}
                        fill="#a5b4fc"
                        opacity={0.2}
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={value > 0 ? 5 : 3}
                      fill={value > 0 ? '#a5b4fc' : 'rgba(255,255,255,0.2)'}
                      stroke={isActive ? '#fff' : value > 0 ? '#818cf8' : 'transparent'}
                      strokeWidth={isActive ? 2 : 1}
                      style={{ transition: 'all 0.2s ease', cursor: value > 0 ? 'pointer' : 'default' }}
                    />
                  </g>
                );
              }}
              activeDot={false}
              isAnimationActive={false}
            />

            {crosshair && (
              <Cross
                x={0}
                y={0}
                stroke="rgba(255,255,255,0.15)"
                strokeDasharray="4 4"
              />
            )}

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload[0]) return null;
                const data = payload[0].payload as HourStat;
                return (
                  <div
                    className="glass-card rounded-lg px-3 py-2.5 text-sm shadow-xl"
                    style={{ backdropFilter: 'blur(8px)' }}
                  >
                    <div className="text-slate-400 text-xs mb-1">{label}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-base">{data.count}</span>
                      <span className="text-slate-300 text-xs">个番茄钟</span>
                    </div>
                    {data.count > 0 && (
                      <div className="text-[10px] text-indigo-300 mt-1">点击查看详情</div>
                    )}
                  </div>
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {selectedHour !== null && selectedRecords.length > 0 && (
        <div className="glass-card rounded-xl p-3 slide-in-right">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-white">
              {String(selectedHour).padStart(2, '0')}:00 - {selectedRecords.length} 个番茄钟
            </span>
            <button
              onClick={() => setSelectedHour(null)}
              className="text-slate-400 hover:text-white text-xs transition-colors"
            >
              关闭
            </button>
          </div>
          <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
            {selectedRecords.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-black/20 text-xs"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: typeColors[r.taskType] }}
                />
                <span className="text-slate-400 flex-shrink-0">
                  {format(parseISO(r.completedAt), 'HH:mm')}
                </span>
                <span className="text-white truncate flex-1">{r.taskName}</span>
                <span className="text-slate-500 flex-shrink-0">{r.duration}m</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedHour !== null && selectedRecords.length === 0 && (
        <div className="glass-card rounded-xl p-3 text-center text-xs text-slate-400 slide-in-right">
          该时段无专注记录
          <button
            onClick={() => setSelectedHour(null)}
            className="block mx-auto mt-1.5 text-indigo-300 hover:text-indigo-200 transition-colors"
          >
            关闭
          </button>
        </div>
      )}
    </div>
  );
}
