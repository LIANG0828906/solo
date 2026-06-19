import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useHabitStore } from '../store';
import type { HeatmapCell } from '../types';

interface HabitDetailProps {
  habitId: string;
  onBack: () => void;
}

function formatTime(iso?: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '—';
  }
}

function formatDateLabel(ds: string): string {
  const [y, m, d] = ds.split('-');
  return `${y}年${Number(m)}月${Number(d)}日`;
}

interface CellProps {
  cell: HeatmapCell;
}

const HeatCell = memo(function HeatCell({ cell }: CellProps) {
  const [tip, setTip] = useState(false);
  const timerRef = useRef<number | null>(null);

  const handleClick = useCallback(() => {
    setTip(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setTip(false), 2200);
  }, []);

  const content = useMemo(() => {
    if (cell.completed) {
      return `✓ ${formatDateLabel(cell.date)} · ${formatTime(cell.completedAt)}`;
    }
    return `${formatDateLabel(cell.date)} · 未完成`;
  }, [cell]);

  return (
    <div
      className="heat-cell"
      data-lvl={String(cell.streakLevel)}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      title={formatDateLabel(cell.date)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className={'heat-tooltip ' + (tip ? 'visible' : '')}>{content}</div>
    </div>
  );
});

export function HabitDetail({ habitId, onBack }: HabitDetailProps) {
  const { habit, streak, total, heatmap } = useHabitStore(
    useShallow((s) => {
      const h = s.getHabitById(habitId);
      return {
        habit: h,
        streak: h ? s.getStreak(habitId) : 0,
        total: h ? s.getTotalCompletions(habitId) : 0,
        heatmap: h ? s.getHeatmapData(habitId) : [],
      };
    })
  );

  if (!habit) {
    return (
      <div>
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <div className="empty-state" style={{ marginTop: 30 }}>
          <div className="empty-emoji">🫥</div>
          <div className="empty-title">习惯不存在</div>
          <div className="empty-text">该习惯可能已被删除</div>
        </div>
      </div>
    );
  }

  const months = useMemo(() => {
    if (heatmap.length === 0) return [];
    const first = heatmap[0].date;
    const last = heatmap[heatmap.length - 1].date;
    const [fy, fm] = first.split('-');
    const [ly, lm] = last.split('-');
    if (fy === ly && fm === lm) return [`${fy}-${fm}`];
    return [`${fy}-${fm}`, `${ly}-${lm}`];
  }, [heatmap]);

  return (
    <div>
      <button className="back-btn" onClick={onBack}>
        <span aria-hidden>←</span> 返回
      </button>

      <div style={{ height: 18 }} />

      <div className="detail-head">
        <div className="habit-icon-wrap" style={{ background: habit.color }}>
          <span className="habit-icon">{habit.icon}</span>
        </div>
        <div className="detail-name">{habit.name}</div>

        <div className="stats-row">
          <div className="stat-card gold">
            <div className="stat-label">连续打卡</div>
            <div className="stat-value">
              <svg
                className="fire-icon"
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M12 2s4 4.5 4 8.5a4 4 0 0 1-8 0c0-1.5.6-2.8 1.5-3.9C9 8 9 10 10 11c0-2.5 2-5 2-9z" />
                <path d="M7 14c0 3.5 2.2 6.5 5 6.5S17 17.5 17 14c0-1.3-.8-2.5-1.8-3.2 0 1.5-.7 3-2 3.6-.6-1-1.5-2-1.2-3.8C10.5 12 8 13 7 14z" opacity="0.7" />
              </svg>
              <span style={{ color: 'var(--accent-gold)' }}>{streak}</span>
              <span className="stat-unit">天</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">累计完成</div>
            <div className="stat-value">
              {total}
              <span className="stat-unit">次</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">每周目标</div>
            <div className="stat-value">
              {habit.weeklyTarget}
              <span className="stat-unit">天</span>
            </div>
          </div>
        </div>
      </div>

      <div className="section-title">
        <span className="dot" /> 最近 30 天
      </div>

      <div className="heatmap-wrap">
        <div className="heatmap-header">
          <span>完成热力图</span>
          <div className="heatmap-legend" aria-label="图例">
            <span style={{ fontSize: 11, marginRight: 2 }}>少</span>
            <span className="legend-cell" style={{ background: 'var(--heat-0)' }} />
            <span className="legend-cell" style={{ background: 'var(--heat-1)' }} />
            <span className="legend-cell" style={{ background: 'var(--heat-2)' }} />
            <span className="legend-cell" style={{ background: 'var(--heat-3)' }} />
            <span style={{ fontSize: 11, marginLeft: 2 }}>多</span>
          </div>
        </div>

        <div className="heatmap-grid" role="grid" aria-label="30天热力图">
          {heatmap.map((c) => (
            <HeatCell key={c.date} cell={c} />
          ))}
        </div>

        <div className="heatmap-months">
          {months.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
