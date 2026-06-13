import { useEffect, useRef, useState, useCallback } from 'react';
import type { Task, Tag, TaskStatus } from '../types';
import { STATUS_META, TAG_COLORS } from '../types';

interface StatsPanelProps {
  tasks: Task[];
}

const STATUS_ORDER: TaskStatus[] = ['todo', 'in-progress', 'done'];
const PRESET_TAGS: Tag[] = ['前端', '后端', '设计', '测试', '运维'];
const THROTTLE_MS = 1000;

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  if (hours < 24) return `${hours}小时`;
  const days = Math.floor(hours / 24);
  return `${days}天${hours % 24}小时`;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface AnimatedValues {
  statusCounts: Record<TaskStatus, number>;
  avgDurations: Record<TaskStatus, number>;
  tagCounts: Record<Tag, number>;
}

function computeStatsFromTasks(tasks: Task[]): AnimatedValues {
  const statusCounts: Record<TaskStatus, number> = { todo: 0, 'in-progress': 0, done: 0 };
  const statusDurationSum: Record<TaskStatus, number> = { todo: 0, 'in-progress': 0, done: 0 };
  const tagCounts: Record<Tag, number> = { '前端': 0, '后端': 0, '设计': 0, '测试': 0, '运维': 0 };

  const now = Date.now();
  for (const t of tasks) {
    statusCounts[t.status]++;
    statusDurationSum[t.status] += Math.max(0, now - t.statusChangedAt);
    for (const tag of t.tags) {
      tagCounts[tag]++;
    }
  }

  const avgDurations: Record<TaskStatus, number> = {
    todo: statusCounts.todo > 0 ? statusDurationSum.todo / statusCounts.todo : 0,
    'in-progress':
      statusCounts['in-progress'] > 0
        ? statusDurationSum['in-progress'] / statusCounts['in-progress']
        : 0,
    done: statusCounts.done > 0 ? statusDurationSum.done / statusCounts.done : 0,
  };

  return { statusCounts, avgDurations, tagCounts };
}

function interpolateObj<K extends string>(
  a: Record<K, number>,
  b: Record<K, number>,
  p: number
): Record<K, number> {
  const result: Record<string, number> = {};
  for (const key of Object.keys(a)) {
    result[key] = a[key as K] + (b[key as K] - a[key as K]) * p;
  }
  return result as Record<K, number>;
}

const EMPTY_VALUES: AnimatedValues = {
  statusCounts: { todo: 0, 'in-progress': 0, done: 0 },
  avgDurations: { todo: 0, 'in-progress': 0, done: 0 },
  tagCounts: { '前端': 0, '后端': 0, '设计': 0, '测试': 0, '运维': 0 },
};

function drawRingChart(
  canvas: HTMLCanvasElement | null,
  values: AnimatedValues
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 220 * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rect.width, 220);

  const cx = rect.width / 2;
  const cy = 110;
  const outerRadius = 75;
  const innerRadius = 50;

  const total = Object.values(values.statusCounts).reduce((a, b) => a + b, 0);
  if (total === 0) {
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    ctx.fillStyle = '#999';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('暂无数据', cx, cy);
    return;
  }

  let startAngle = -Math.PI / 2;
  for (const status of STATUS_ORDER) {
    const count = values.statusCounts[status];
    const angle = (count / total) * Math.PI * 2;
    if (count > 0) {
      ctx.fillStyle = STATUS_META[status].color;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerRadius, startAngle, startAngle + angle);
      ctx.closePath();
      ctx.fill();
    }
    startAngle += angle;
  }

  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#333';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(Math.round(total)), cx, cy - 8);
  ctx.fillStyle = '#999';
  ctx.font = '12px sans-serif';
  ctx.fillText('卡片总数', cx, cy + 14);
}

function drawBarChart(
  canvas: HTMLCanvasElement | null,
  values: AnimatedValues
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 180 * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rect.width, 180);

  const totalTagCount = Object.values(values.tagCounts).reduce((a, b) => a + b, 0);
  if (totalTagCount === 0) {
    ctx.fillStyle = '#999';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无标签数据', rect.width / 2, 90);
    return;
  }

  const maxCount = Math.max(...Object.values(values.tagCounts), 1);
  const chartTop = 20;
  const chartBottom = 140;
  const chartHeight = chartBottom - chartTop;
  const barWidth = (rect.width - 40) / PRESET_TAGS.length - 8;
  const startX = 28;

  PRESET_TAGS.forEach((tag, i) => {
    const count = values.tagCounts[tag];
    const barHeight = (count / maxCount) * chartHeight;
    const x = startX + i * (barWidth + 8);
    const y = chartBottom - barHeight;

    ctx.fillStyle = TAG_COLORS[tag];
    ctx.beginPath();
    const radius = 3;
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + barWidth - radius, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
    ctx.lineTo(x + barWidth, chartBottom);
    ctx.lineTo(x, chartBottom);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(Math.round(count)), x + barWidth / 2, y - 6);

    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.fillText(tag, x + barWidth / 2, chartBottom + 14);
  });
}

export default function StatsPanel({ tasks }: StatsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ringCanvasRef = useRef<HTMLCanvasElement>(null);
  const barCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastRenderRef = useRef(0);
  const pendingTasksRef = useRef<Task[]>(tasks);
  const animStateRef = useRef<{
    start: AnimatedValues;
    end: AnimatedValues;
    startTime: number;
  } | null>(null);
  const [displayStats, setDisplayStats] = useState<AnimatedValues>(EMPTY_VALUES);

  pendingTasksRef.current = tasks;

  const throttledUpdate = useCallback(() => {
    const now = Date.now();
    if (now - lastRenderRef.current < THROTTLE_MS) return;
    lastRenderRef.current = now;

    const endValues = computeStatsFromTasks(pendingTasksRef.current);
    const prevStart = animStateRef.current?.end ?? EMPTY_VALUES;
    animStateRef.current = {
      start: prevStart,
      end: endValues,
      startTime: performance.now(),
    };

    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    const animate = () => {
      const state = animStateRef.current;
      if (!state) return;
      const elapsed = performance.now() - state.startTime;
      const t = Math.min(elapsed / 500, 1);
      const eased = easeOutCubic(t);

      const current: AnimatedValues = {
        statusCounts: interpolateObj(state.start.statusCounts, state.end.statusCounts, eased),
        avgDurations: interpolateObj(state.start.avgDurations, state.end.avgDurations, eased),
        tagCounts: interpolateObj(state.start.tagCounts, state.end.tagCounts, eased),
      };

      drawRingChart(ringCanvasRef.current, current);
      drawBarChart(barCanvasRef.current, current);

      if (t < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayStats(state.end);
      }
    };
    animate();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    throttledUpdate();

    const interval = setInterval(() => {
      throttledUpdate();
    }, THROTTLE_MS);

    return () => {
      clearInterval(interval);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [tasks, isOpen, throttledUpdate]);

  if (!isOpen) {
    return (
      <button className="stats-toggle-btn" onClick={() => setIsOpen(true)} title="查看统计">
        📊
      </button>
    );
  }

  const stats = computeStatsFromTasks(tasks);
  const total = tasks.length;

  return (
    <div className="stats-panel">
      <div className="stats-panel-header">
        <div className="stats-panel-title">📊 看板统计</div>
        <button
          className="modal-close"
          onClick={() => setIsOpen(false)}
          style={{ padding: '4px' }}
        >
          ✕
        </button>
      </div>

      <div className="stats-section">
        <div className="stats-section-title">卡片分布（共 {total} 张）</div>
        <canvas ref={ringCanvasRef} className="stats-chart" style={{ height: '220px' }} />
        <div className="stats-list" style={{ marginTop: '12px' }}>
          {STATUS_ORDER.map((status) => (
            <div key={status} className="stats-item">
              <div
                className="stats-item-color"
                style={{ backgroundColor: STATUS_META[status].color }}
              />
              <span className="stats-item-label">{STATUS_META[status].label}</span>
              <span className="stats-item-value">{stats.statusCounts[status]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-section">
        <div className="stats-section-title">平均停留时长</div>
        <div className="stats-list">
          {STATUS_ORDER.map((status) => (
            <div key={status} className="stats-item">
              <div
                className="stats-item-color"
                style={{ backgroundColor: STATUS_META[status].color }}
              />
              <span className="stats-item-label">{STATUS_META[status].label}</span>
              <span className="stats-item-value">
                {displayStats.avgDurations[status] > 0
                  ? formatDuration(displayStats.avgDurations[status])
                  : '-'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-section">
        <div className="stats-section-title">标签分布</div>
        <canvas ref={barCanvasRef} className="stats-chart" style={{ height: '180px' }} />
      </div>
    </div>
  );
}
