import { useEffect, useState, useMemo } from 'react';
import { usePlanStore } from '@/store/usePlanStore';
import type { TimeBlock, ReviewData } from '@/types';
import { TASK_TYPES, TASK_TYPE_COLORS, minutesToTime } from '@/lib/constants';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import styles from './ReviewStats.module.css';

const COLORS = {
  bg: '#1a1a2e',
  card: '#16213e',
  accent: '#0f3460',
  primary: '#e94560',
};

function useAnimatedValue(target: number, duration: number = 1000) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function RingProgress({ rate }: { rate: number }) {
  const animated = useAnimatedValue(rate);
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - animated);

  return (
    <div className={styles.ringContainer}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e94560" />
            <stop offset="100%" stopColor="#0f3460" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={COLORS.accent}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'none' }}
        />
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={20}
          fontWeight={700}
        >
          {Math.round(animated * 100)}%
        </text>
      </svg>
      <span className={styles.ringLabel}>计划完成率</span>
    </div>
  );
}

function ProgressBar({ rate }: { rate: number }) {
  const animated = useAnimatedValue(rate);
  const pct = Math.min(animated * 100, 100);

  return (
    <div className={styles.progressBarContainer}>
      <div className={styles.progressLabelRow}>
        <span>时间利用率</span>
        <span>{Math.round(animated * 100)}%</span>
      </div>
      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TypeBarChart({ blocks }: { blocks: TimeBlock[] }) {
  const distribution = useMemo(() => {
    const map: Record<string, number> = {};
    blocks.forEach((b) => {
      const minutes = b.endTime - b.startTime;
      map[b.type] = (map[b.type] || 0) + minutes;
    });
    return TASK_TYPES.map((t) => ({
      key: t.value,
      label: t.label,
      minutes: map[t.value] || 0,
      color: TASK_TYPE_COLORS[t.value],
    }));
  }, [blocks]);

  const formatYAxis = (minutes: number) => {
    if (minutes === 0) return '0';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const formatLabel = (value: number | string | undefined | null) => {
    const minutes = Number(value);
    if (!minutes || minutes === 0) return '';
    return minutesToTime(minutes);
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { label: string; minutes: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            background: `${COLORS.card}f0`,
            backdropFilter: 'blur(6px)',
            border: `1px solid ${COLORS.accent}`,
            borderRadius: 6,
            padding: '8px 12px',
            color: '#fff',
            fontSize: 13,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{data.label}</div>
          <div style={{ color: '#ccc' }}>时长: {minutesToTime(data.minutes)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.chartContainer}>
      <span className={styles.chartTitle}>任务类型分布</span>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distribution} margin={{ top: 20, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.accent} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#aaa', fontSize: 11 }}
              axisLine={{ stroke: COLORS.accent }}
              tickLine={{ stroke: COLORS.accent }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fill: '#aaa', fontSize: 10 }}
              axisLine={{ stroke: COLORS.accent }}
              tickLine={{ stroke: COLORS.accent }}
              tickCount={6}
              interval={0}
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: `${COLORS.accent}40` }} />
            <Bar dataKey="minutes" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={1000}>
              {distribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList
                dataKey="minutes"
                position="top"
                formatter={formatLabel}
                fill="#ccc"
                fontSize={10}
                offset={4}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function ReviewStats() {
  const blocks = usePlanStore((s) => s.blocks);
  const reviews = usePlanStore((s) => s.reviews);
  const report = usePlanStore((s) => s.report);

  const completionRate = useMemo(() => {
    if (blocks.length === 0) return 0;
    const completed = blocks.filter((b) => reviews[b.id]?.completed).length;
    return completed / blocks.length;
  }, [blocks, reviews]);

  const utilizationRate = useMemo(() => {
    let planned = 0;
    let actual = 0;
    blocks.forEach((b) => {
      planned += b.endTime - b.startTime;
      const r: ReviewData | undefined = reviews[b.id];
      if (r) {
        actual += r.actualEnd - r.actualStart;
      }
    });
    return planned > 0 ? Math.min(actual / planned, 1) : 0;
  }, [blocks, reviews]);

  return (
    <div className={styles.container}>
      <div className={`${styles.glassCard} ${styles.ringCard}`}>
        <RingProgress rate={completionRate} />
      </div>

      <div className={`${styles.glassCard} ${styles.progressCard}`}>
        <ProgressBar rate={utilizationRate} />
      </div>

      <div className={`${styles.glassCard} ${styles.chartCard}`}>
        <TypeBarChart blocks={blocks} />
      </div>

      {report?.encouragement && (
        <div className={`${styles.glassCard} ${styles.encouragementCard}`}>
          {report.encouragement}
        </div>
      )}
    </div>
  );
}
