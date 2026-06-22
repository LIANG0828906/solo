import { useMemo, useState, useCallback } from 'react';
import { useCoffeeStore } from '../store';
import { FLAVOR_TAGS } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';

interface DashboardProps {
  onTagClick: (tag: string) => void;
}

const ROTATION_SEED: Record<string, number> = {};
FLAVOR_TAGS.forEach((t, i) => {
  ROTATION_SEED[t] = ((i * 7.3) % 30) - 15;
});

function seededRotation(tag: string): number {
  if (ROTATION_SEED[tag] != null) return ROTATION_SEED[tag];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) | 0;
  return ((Math.abs(hash) % 30) - 15);
}

function tagColor(count: number, max: number): { bg: string; color: string; size: number } {
  if (max === 0) max = 1;
  const ratio = Math.min(count / max, 1);
  const size = 13 + ratio * 22;
  const alpha = 0.55 + ratio * 0.45;
  const intensity = Math.round(255 - ratio * 140);
  const greenBlue = Math.round(intensity * 0.7);
  return {
    bg: `rgba(${111 + Math.round(ratio * 40)}, ${78 - Math.round(ratio * 20)}, ${55 + Math.round(ratio * 20)}, ${alpha})`,
    color: ratio > 0.5 ? '#FFF8F0' : `rgb(${111 - Math.round(ratio * 30)}, ${greenBlue + Math.round(ratio * 40)}, ${greenBlue})`,
    size
  };
}

const BAR_GRADIENT = ['#D4B896', '#C6A277', '#B88C5C', '#A87642', '#8B6344', '#6F4E37'];

export default function Dashboard({ onTagClick }: DashboardProps) {
  const records = useCoffeeStore((s) => s.records);
  const tagFrequency = useCoffeeStore((s) => s.tagFrequency);
  const monthlyStats = useCoffeeStore((s) => s.monthlyStats);

  const [flashingTag, setFlashingTag] = useState<string | null>(null);

  const sortedTags = useMemo(() => {
    const entries = Object.entries(tagFrequency);
    entries.sort((a, b) => b[1] - a[1]);
    return entries;
  }, [tagFrequency]);

  const maxCount = useMemo(() => {
    let m = 0;
    for (const [, c] of sortedTags) if (c > m) m = c;
    return m;
  }, [sortedTags]);

  const summary = useMemo(() => {
    const total = records.length;
    const uniqueTags = sortedTags.length;
    const avgRating = total
      ? Math.round(records.reduce((s, r) => s + r.rating, 0) / total)
      : 0;
    const topTag = sortedTags[0]?.[0] ?? '—';
    return { total, uniqueTags, avgRating, topTag };
  }, [records, sortedTags]);

  const handleTagClick = useCallback(
    (tag: string) => {
      setFlashingTag(tag);
      window.setTimeout(() => setFlashingTag(null), 650);
      window.setTimeout(() => onTagClick(tag), 300);
    },
    [onTagClick]
  );

  const barFill = (index: number) => BAR_GRADIENT[index % BAR_GRADIENT.length];

  return (
    <section>
      <h2 className="section-title">📊 风味地图</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 14,
          marginBottom: 28
        }}
      >
        <div className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
          <div style={{ fontFamily: 'var(--font-script)', fontSize: 32, color: 'var(--coffee)', fontWeight: 700 }}>
            {summary.total}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, marginTop: 2 }}>
            总品鉴次数
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
          <div style={{ fontFamily: 'var(--font-script)', fontSize: 32, color: 'var(--accent)', fontWeight: 700 }}>
            {summary.avgRating || '—'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, marginTop: 2 }}>
            平均评分
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
          <div style={{ fontFamily: 'var(--font-script)', fontSize: 32, color: 'var(--success)', fontWeight: 700 }}>
            {summary.uniqueTags}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, marginTop: 2 }}>
            风味种类
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
          <div style={{
            fontFamily: 'var(--font-script)',
            fontSize: 32,
            color: 'var(--coffee-dark)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {summary.topTag}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, marginTop: 2 }}>
            最爱的风味
          </div>
        </div>
      </div>

      <div className="stats-section">
        <h3 className="section-title" style={{ fontSize: 22 }}>☁️ 风味标签云</h3>
        <div className="chart-container">
          {sortedTags.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <div className="empty-state-icon" style={{ fontSize: 48 }}>🏷️</div>
              <div className="empty-state-text" style={{ fontSize: 22 }}>还没有风味标签</div>
              <p style={{ fontSize: 13 }}>添加品鉴记录时选择风味标签，这里就会生动起来～</p>
            </div>
          ) : (
            <div className="tagcloud">
              {sortedTags.map(([tag, count]) => {
                const style = tagColor(count, maxCount);
                const rot = seededRotation(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={'tagcloud-tag' + (flashingTag === tag ? ' flash' : '')}
                    onClick={() => handleTagClick(tag)}
                    style={{
                      transform: `rotate(${rot}deg)`,
                      background: style.bg,
                      color: style.color,
                      fontSize: `${style.size}px`,
                      border: `2px solid ${style.color}`
                    }}
                    title={`${tag} · ${count}次`}
                  >
                    <span className="tooltip">{tag} · {count} 次</span>
                    {tag}
                    <span style={{
                      marginLeft: 4,
                      opacity: 0.85,
                      fontSize: `${Math.max(10, style.size - 6)}px`
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="stats-section">
        <h3 className="section-title" style={{ fontSize: 22 }}>📈 月度品鉴统计</h3>
        <div className="chart-container">
          {monthlyStats.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <div className="empty-state-icon" style={{ fontSize: 48 }}>📊</div>
              <div className="empty-state-text" style={{ fontSize: 22 }}>还没有统计数据</div>
              <p style={{ fontSize: 13 }}>多记录几杯咖啡，这里就会出现你的品鉴节奏～</p>
            </div>
          ) : (
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer>
                <BarChart data={monthlyStats} margin={{ top: 28, right: 20, left: 0, bottom: 8 }}>
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#6F4E37', fontSize: 12, fontWeight: 700 }}
                    axisLine={{ stroke: '#D4BFA8' }}
                    tickLine={{ stroke: '#D4BFA8' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#8B7355', fontSize: 12 }}
                    axisLine={{ stroke: '#D4BFA8' }}
                    tickLine={{ stroke: '#D4BFA8' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#FFF8F0',
                      border: '2px solid #6F4E37',
                      borderRadius: 12,
                      color: '#4A3424',
                      fontWeight: 700,
                      boxShadow: '0 6px 20px rgba(111,78,55,0.25)'
                    }}
                    cursor={{ fill: 'rgba(198,139,89,0.1)' }}
                    formatter={(v: number) => [`${v} 杯`, '品鉴数']}
                    labelFormatter={(l) => `📅 ${l}`}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    <LabelList dataKey="count" position="top" fill="#4A3424" fontWeight={800} fontSize={13} />
                    {monthlyStats.map((_, i) => (
                      <Cell key={i} fill={barFill(i)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
