import React from 'react';
import type { Task } from '../types';

interface ChartItem {
  task: Task;
  value: number;
  color: string;
}

interface PomodoroChartProps {
  items: ChartItem[];
  total: number;
}

const COLORS = [
  '#27ae60',
  '#3498db',
  '#e67e22',
  '#9b59b6',
  '#e74c3c',
  '#1abc9c',
  '#f39c12',
  '#2980b9',
  '#8e44ad',
  '#c0392b',
];

const RADIUS = 70;
const STROKE_WIDTH = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const PomodoroChart: React.FC<PomodoroChartProps> = ({ items, total }) => {
  if (total === 0) {
    return (
      <div
        style={{
          width: 180,
          height: 180,
          margin: '20px auto',
          borderRadius: '50%',
          border: `${STROKE_WIDTH}px solid var(--bg-tertiary)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: 12,
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 8 }}>🍅</div>
        <div>暂无数据</div>
        <div>完成番茄后显示分布</div>
      </div>
    );
  }

  let cumulative = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 180, height: 180, margin: '10px 0' }}>
        <svg width={180} height={180} viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            {items.map((item, i) => (
              <linearGradient key={`grad-${i}`} id={`chart-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={item.color} stopOpacity="1" />
                <stop offset="100%" stopColor={item.color} stopOpacity="0.7" />
              </linearGradient>
            ))}
          </defs>
          <circle
            cx={90}
            cy={90}
            r={RADIUS}
            fill="none"
            stroke="var(--bg-tertiary)"
            strokeWidth={STROKE_WIDTH}
          />
          {items.map((item, i) => {
            const fraction = item.value / total;
            const dashLength = CIRCUMFERENCE * fraction;
            const dashOffset = -CIRCUMFERENCE * cumulative;
            cumulative += fraction;
            return (
              <circle
                key={item.task.id}
                cx={90}
                cy={90}
                r={RADIUS}
                fill="none"
                stroke={`url(#chart-grad-${i})`}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="butt"
                strokeDasharray={`${dashLength} ${CIRCUMFERENCE - dashLength}`}
                strokeDashoffset={dashOffset}
                style={{ transition: 'all 0.5s var(--ease-bounce)' }}
              />
            );
          })}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)' }}>
            {total}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>今日番茄</div>
        </div>
      </div>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {items.slice(0, 6).map((item, i) => (
          <div
            key={item.task.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 10px',
              borderRadius: 8,
              background: 'var(--bg-tertiary)',
              fontSize: 12,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: item.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                flex: 1,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={item.task.title}
            >
              {item.task.title}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600, flexShrink: 0 }}>
              ×{item.value}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 11, flexShrink: 0, minWidth: 38, textAlign: 'right' }}>
              {Math.round((item.value / total) * 100)}%
            </span>
          </div>
        ))}
        {items.length > 6 && (
          <div
            style={{
              textAlign: 'center',
              fontSize: 11,
              color: 'var(--text-muted)',
              padding: 4,
            }}
          >
            +{items.length - 6} 个任务未显示
          </div>
        )}
      </div>
    </div>
  );
};

export { COLORS };
