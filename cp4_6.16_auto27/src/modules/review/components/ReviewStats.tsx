import { useEffect, useState, useMemo } from 'react';
import { usePlanStore } from '@/store/usePlanStore';
import type { TimeBlock, ReviewData } from '@/types';
import { TASK_TYPES, TASK_TYPE_COLORS, minutesToTime } from '@/lib/constants';

const COLORS = {
  bg: '#1a1a2e',
  card: '#16213e',
  accent: '#0f3460',
  primary: '#e94560',
};

const glassStyle: React.CSSProperties = {
  background: `${COLORS.card}cc`,
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  borderRadius: 2,
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
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
      <span style={{ color: '#aaa', fontSize: 13 }}>计划完成率</span>
    </div>
  );
}

function ProgressBar({ rate }: { rate: number }) {
  const animated = useAnimatedValue(rate);
  const pct = Math.min(animated * 100, 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: 13 }}>
        <span>时间利用率</span>
        <span>{Math.round(animated * 100)}%</span>
      </div>
      <div
        style={{
          width: '100%',
          height: 12,
          background: COLORS.accent,
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${COLORS.primary}, #ff6b81)`,
            borderRadius: 6,
            transition: 'none',
          }}
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

  const maxMinutes = Math.max(...distribution.map((d) => d.minutes), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ color: '#aaa', fontSize: 13 }}>任务类型分布</span>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120, padding: '0 4px' }}>
        {distribution.map((d) => {
          const heightPct = (d.minutes / maxMinutes) * 100;
          return (
            <div
              key={d.key}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span style={{ color: '#ccc', fontSize: 11 }}>
                {d.minutes > 0 ? minutesToTime(d.minutes) : '-'}
              </span>
              <Bar heightPct={heightPct} color={d.color} />
              <span style={{ color: '#aaa', fontSize: 11, whiteSpace: 'nowrap' }}>{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Bar({ heightPct, color }: { heightPct: number; color: string }) {
  const animated = useAnimatedValue(heightPct / 100);
  const h = animated * 80;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 32,
        height: 80,
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      <div
        style={{
          width: '100%',
          height: h,
          background: color,
          borderRadius: 2,
          transition: 'none',
        }}
      />
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          ...glassStyle,
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <RingProgress rate={completionRate} />
      </div>

      <div style={{ ...glassStyle, padding: 16 }}>
        <ProgressBar rate={utilizationRate} />
      </div>

      <div style={{ ...glassStyle, padding: 16 }}>
        <TypeBarChart blocks={blocks} />
      </div>

      {report?.encouragement && (
        <div
          style={{
            ...glassStyle,
            padding: 14,
            textAlign: 'center',
            color: '#ff6b81',
            fontSize: 14,
            fontStyle: 'italic',
          }}
        >
          {report.encouragement}
        </div>
      )}
    </div>
  );
}
