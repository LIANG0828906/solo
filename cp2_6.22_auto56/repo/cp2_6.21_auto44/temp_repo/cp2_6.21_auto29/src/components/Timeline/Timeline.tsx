import { useMemo, useRef, useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Layer,
} from 'recharts';
import { useBoardStore } from '../../store/boardStore';
import type { TaskData } from '../../types';
import { PRIORITY_COLORS } from '../../types';

const HOURS_PER_DAY = 8;

interface ChartDatum {
  name: string;
  fullName: string;
  taskId: string;
  priority: string;
  start: number;
  duration: number;
  assignee: string | null;
  hours: number;
  blocked: boolean;
}

function Timeline() {
  const tasks = useBoardStore((s) => s.tasks);
  const isTaskBlocked = useBoardStore((s) => s.isTaskBlocked);

  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(800);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setChartWidth(containerRef.current.clientWidth || 800);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { chartData, dateRange, taskPositions } = useMemo(() => {
    if (tasks.length === 0) {
      return {
        chartData: [] as ChartDatum[],
        dateRange: [] as string[],
        taskPositions: new Map<string, number>(),
      };
    }

    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    const datedTasks = tasks
      .filter((t) => t.start_date)
      .map((t) => {
        const start = new Date(t.start_date!);
        start.setHours(0, 0, 0, 0);
        const durationDays = Math.max(1, Math.ceil(t.estimated_hours / HOURS_PER_DAY));
        const end = new Date(start);
        end.setDate(end.getDate() + durationDays);
        return { task: t, start, end, durationDays };
      });

    if (datedTasks.length === 0) {
      return {
        chartData: [] as ChartDatum[],
        dateRange: [] as string[],
        taskPositions: new Map<string, number>(),
      };
    }

    datedTasks.forEach(({ start, end }) => {
      if (!minDate || start < minDate) minDate = start;
      if (!maxDate || end > maxDate) maxDate = end;
    });

    const todayD = new Date();
    todayD.setHours(0, 0, 0, 0);
    if (!minDate || todayD < (minDate as Date)) minDate = todayD;
    if (!maxDate || todayD > (maxDate as Date)) maxDate = todayD;

    const endPlus3 = new Date(maxDate);
    endPlus3.setDate(endPlus3.getDate() + 3);
    maxDate = endPlus3;

    const dates: string[] = [];
    const cur = new Date(minDate);
    while (cur <= maxDate) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }

    const startDayOffset = (date: Date) => {
      const diff = date.getTime() - minDate!.getTime();
      return Math.round(diff / (1000 * 60 * 60 * 24));
    };

    const sortedTasks = [...datedTasks].sort(
      (a, b) => a.start.getTime() - b.start.getTime()
    );

    const positions = new Map<string, number>();
    sortedTasks.forEach((dt, idx) => {
      positions.set(dt.task.id, idx);
    });

    const data: ChartDatum[] = sortedTasks.map(({ task, start, durationDays }) => ({
      name: task.title.length > 14 ? task.title.slice(0, 14) + '…' : task.title,
      fullName: task.title,
      taskId: task.id,
      priority: task.priority,
      start: startDayOffset(start),
      duration: durationDays,
      assignee: task.assignee,
      hours: task.estimated_hours,
      blocked: false,
    }));

    data.forEach((d) => {
      d.blocked = isTaskBlocked(d.taskId);
    });

    return { chartData: data, dateRange: dates, taskPositions: positions };
  }, [tasks, isTaskBlocked]);

  const formatXAxis = (_value: any, index: number) => {
    if (dateRange.length === 0) return '';
    if (index < 0 || index >= dateRange.length) return '';
    const dateStr = dateRange[index];
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const todayIndex = useMemo(() => {
    if (dateRange.length === 0) return -1;
    const todayStr = today.toISOString().split('T')[0];
    return dateRange.indexOf(todayStr);
  }, [dateRange, today]);

  if (chartData.length === 0) {
    return (
      <div className="empty-state">
        暂无带日期的任务，请添加任务并设置开始日期以查看时间线
      </div>
    );
  }

  const totalDays = Math.max(1, dateRange.length - 1);

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <ResponsiveContainer width="100%" height={Math.max(280, chartData.length * 48 + 80)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 40, left: 120, bottom: 20 }}
        >
          <CartesianGrid
            strokeDasharray="4 4"
            stroke="#e0e0e0"
            horizontal={true}
            vertical={true}
          />
          <XAxis
            type="number"
            domain={[0, totalDays]}
            tickFormatter={formatXAxis}
            ticks={Array.from({ length: dateRange.length }, (_, i) => i)}
            interval={Math.max(0, Math.floor(dateRange.length / 10) - 1)}
            tick={{ fontSize: 12, fill: '#636e72' }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fontSize: 13, fill: '#2d3436' }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(102, 126, 234, 0.06)' }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length < 2) return null;
              const d = payload[1].payload as ChartDatum;
              return (
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #dfe6e9',
                    borderRadius: 8,
                    padding: '10px 14px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    fontSize: 13,
                    color: '#2d3436',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>{d.fullName}</div>
                  <div style={{ color: '#636e72', marginBottom: 4 }}>
                    负责人：{d.assignee || '未分配'}
                  </div>
                  <div style={{ color: '#636e72', marginBottom: 4 }}>
                    预估工时：{d.hours} 小时
                  </div>
                  <div style={{ color: '#636e72', marginBottom: 4 }}>
                    工期：{d.duration} 天
                  </div>
                  {d.blocked && (
                    <div style={{ color: '#b2bec3', fontWeight: 500 }}>状态：阻塞</div>
                  )}
                </div>
              );
            }}
          />
          {todayIndex >= 0 && (
            <ReferenceLine
              x={todayIndex}
              stroke="#667eea"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: '今天',
                position: 'top',
                fill: '#667eea',
                fontSize: 11,
                fontWeight: 600,
              }}
            />
          )}

          <Bar dataKey="start" stackId="gantt" fill="transparent" barSize={26} />
          <Bar
            dataKey="duration"
            stackId="gantt"
            barSize={26}
            radius={[4, 4, 4, 4]}
            isAnimationActive={true}
            animationDuration={600}
          >
            {chartData.map((entry, index) => {
              if (entry.blocked) {
                return (
                  <PatternedCell
                    key={`cell-${index}`}
                    fill="#b2bec3"
                    opacity={0.7}
                  />
                );
              }
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={PRIORITY_COLORS[entry.priority as keyof typeof PRIORITY_COLORS]}
                />
              );
            })}
          </Bar>

          <Layer>
            <DependencyArrows
              tasks={tasks}
              taskPositions={taskPositions}
              dateRange={dateRange}
              chartWidth={chartWidth}
              leftMargin={120}
              rightMargin={40}
            />
          </Layer>
        </BarChart>
      </ResponsiveContainer>

      <div
        style={{
          display: 'flex',
          gap: 20,
          marginTop: 12,
          fontSize: 12,
          color: '#636e72',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#ff4757', display: 'inline-block' }} />
          高优先级
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#ffa502', display: 'inline-block' }} />
          中优先级
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#2ed573', display: 'inline-block' }} />
          低优先级
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              background:
                'repeating-linear-gradient(45deg, #b2bec3, #b2bec3 3px, #dfe6e9 3px, #dfe6e9 6px)',
              display: 'inline-block',
            }}
          />
          阻塞
        </div>
      </div>
    </div>
  );
}

function PatternedCell(props: any) {
  const { x, y, width, height, fill, opacity } = props;
  const patternId = `diag-pattern-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <g>
      <defs>
        <pattern id={patternId} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
          <rect width="8" height="8" fill={fill} fillOpacity={opacity} />
          <line x1="0" y1="0" x2="0" y2="8" stroke="#888" strokeWidth="2" strokeOpacity={opacity} />
        </pattern>
      </defs>
      <rect x={x} y={y} width={width} height={height} rx={4} ry={4} fill={`url(#${patternId})`} />
    </g>
  );
}

interface DependencyArrowsProps {
  tasks: TaskData[];
  taskPositions: Map<string, number>;
  dateRange: string[];
  chartWidth: number;
  leftMargin: number;
  rightMargin: number;
}

function DependencyArrows({
  tasks,
  taskPositions,
  dateRange,
  chartWidth,
  leftMargin,
  rightMargin,
}: DependencyArrowsProps) {
  if (dateRange.length === 0) return null;

  const totalDays = Math.max(1, dateRange.length - 1);
  const innerWidth = Math.max(1, chartWidth - leftMargin - rightMargin);
  const dayWidth = innerWidth / totalDays;

  const arrows: { fromIdx: number; toIdx: number; fromEndDay: number; toStartDay: number }[] = [];

  tasks.forEach((task) => {
    if (!task.dependencies || task.dependencies.length === 0) return;
    if (!task.start_date) return;
    const toIdx = taskPositions.get(task.id);
    if (toIdx === undefined) return;

    const toStart = new Date(task.start_date);
    toStart.setHours(0, 0, 0, 0);
    const minDate = new Date(dateRange[0]);
    const toStartDay = Math.round((toStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

    task.dependencies.forEach((depId) => {
      const dep = tasks.find((t) => t.id === depId);
      if (!dep || !dep.start_date) return;
      const fromIdx = taskPositions.get(depId);
      if (fromIdx === undefined) return;

      const depStart = new Date(dep.start_date);
      depStart.setHours(0, 0, 0, 0);
      const durationDays = Math.max(1, Math.ceil(dep.estimated_hours / HOURS_PER_DAY));
      const fromEndDay =
        Math.round((depStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) +
        durationDays;

      if (fromIdx !== toIdx) {
        arrows.push({ fromIdx, toIdx, fromEndDay, toStartDay });
      }
    });
  });

  return (
    <g>
      {arrows.map((a, i) => {
        const rowHeight = 48;
        const topOffset = 20;
        const barHeight = 26;

        const fromY = topOffset + a.fromIdx * rowHeight + barHeight / 2;
        const toY = topOffset + a.toIdx * rowHeight + barHeight / 2;

        const fromX = leftMargin + a.fromEndDay * dayWidth;
        const toX = leftMargin + a.toStartDay * dayWidth;

        let pathD: string;
        if (Math.abs(a.toIdx - a.fromIdx) <= 1) {
          const midX = (fromX + toX) / 2;
          pathD = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX - 6} ${toY}`;
        } else {
          const bendX = fromX + 20;
          const midY = (fromY + toY) / 2;
          pathD = `M ${fromX} ${fromY} C ${bendX} ${fromY}, ${bendX} ${midY}, ${bendX + 10} ${midY} C ${bendX + 10} ${midY}, ${bendX + 10} ${toY}, ${toX - 6} ${toY}`;
        }

        return (
          <g key={i}>
            <path
              d={pathD}
              stroke="#636e72"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              fill="none"
              opacity={0.7}
            />
            <polygon
              points={`${toX},${toY} ${toX - 8},${toY - 4} ${toX - 8},${toY + 4}`}
              fill="#636e72"
              opacity={0.7}
            />
          </g>
        );
      })}
    </g>
  );
}

export default Timeline;
