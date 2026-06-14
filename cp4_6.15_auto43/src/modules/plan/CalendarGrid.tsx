import { useState, useMemo } from 'react';
import type { DailyAssignment } from '../../types';
import { getIntensityColor } from '../../utils/calculateProgress';

interface CalendarGridProps {
  assignments: DailyAssignment[];
  onToggleComplete: (date: string) => void;
}

interface HoveredCell {
  date: string;
  startPage: number;
  endPage: number;
  pageCount: number;
  x: number;
  y: number;
}

export default function CalendarGrid({
  assignments,
  onToggleComplete,
}: CalendarGridProps) {
  const [hoveredCell, setHoveredCell] = useState<HoveredCell | null>(null);

  const { weeks, monthLabels } = useMemo(() => {
    const result: (DailyAssignment | null)[][] = [];
    const labels: { index: number; label: string }[] = [];

    if (assignments.length === 0) {
      return { weeks: result, monthLabels: labels };
    }

    const firstDate = new Date(assignments[0].date);
    const startPadding = firstDate.getDay();
    const padded: (DailyAssignment | null)[] = [];

    for (let i = 0; i < startPadding; i++) {
      padded.push(null);
    }

    assignments.forEach((a, idx) => {
      const d = new Date(a.date);
      if (d.getDate() === 1 || idx === 0) {
        labels.push({
          index: Math.floor(padded.length / 7),
          label: `${d.getFullYear()}年${d.getMonth() + 1}月`,
        });
      }
      padded.push(a);
    });

    while (padded.length % 7 !== 0) {
      padded.push(null);
    }

    for (let i = 0; i < padded.length; i += 7) {
      result.push(padded.slice(i, i + 7));
    }

    return { weeks: result, monthLabels: labels };
  }, [assignments]);

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    assignment: DailyAssignment
  ) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHoveredCell({
      date: assignment.date,
      startPage: assignment.startPage,
      endPage: assignment.endPage,
      pageCount: assignment.pageCount,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  return (
    <div
      className="glass-card calendar-card"
      style={{ animation: 'fadeInUp 0.5s ease 0.1s both' }}
    >
      <div className="calendar-header">
        <h3 className="calendar-title">
          <span className="calendar-title-icon">📅</span>
          阅读日历
        </h3>
        <div className="legend-row">
          <div className="legend-item">
            <div
              className="legend-box"
              style={{ background: getIntensityColor(0) }}
            />
            <span className="legend-label">未开始</span>
          </div>
          <div className="legend-item">
            <div
              className="legend-box"
              style={{ background: getIntensityColor(0.5) }}
            />
            <span className="legend-label">进行中</span>
          </div>
          <div className="legend-item">
            <div
              className="legend-box"
              style={{ background: getIntensityColor(1) }}
            />
            <span className="legend-label">已完成</span>
          </div>
        </div>
      </div>

      {monthLabels.map((m) => (
        <div key={m.label} className="month-label">
          {m.label}
        </div>
      ))}

      <div className="weekdays-grid">
        {weekDays.map((day) => (
          <div key={day} className="weekday-cell">
            {day}
          </div>
        ))}
      </div>

      <div className="dates-grid">
        {weeks.flat().map((assignment, idx) => {
          if (!assignment) {
            return <div key={`empty-${idx}`} className="date-cell-empty" />;
          }

          const progress = assignment.isCompleted
            ? 1
            : assignment.completedBy.length > 0
            ? assignment.completedBy.length / 4
            : 0;

          const d = new Date(assignment.date);
          const today = new Date();
          const isToday =
            assignment.date ===
            `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
              today.getDate()
            ).padStart(2, '0')}`;

          const numberClass =
            progress > 0.5 ? 'date-number-light' : 'date-number-dark';
          const pagesClass =
            progress > 0.5 ? 'date-pages-light' : 'date-pages-dark';

          return (
            <div
              key={assignment.date}
              className="date-cell"
              onClick={() => onToggleComplete(assignment.date)}
              onMouseEnter={(e) => handleMouseEnter(e, assignment)}
              onMouseLeave={() => setHoveredCell(null)}
            >
              <div
                className="date-cell-inner"
                style={{
                  background: getIntensityColor(progress),
                  border: isToday
                    ? '2px solid #667eea'
                    : assignment.isCompleted
                    ? '2px solid #48bb78'
                    : '1px solid rgba(255,255,255,0.5)',
                }}
              />
              <div className="date-cell-content">
                <span className={`date-number ${numberClass}`}>{d.getDate()}</span>
                <span className={`date-pages ${pagesClass}`}>
                  {assignment.pageCount}页
                </span>
                {assignment.isCompleted && (
                  <span className="date-check">✓</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hoveredCell && (
        <div
          className="glass-card tooltip-popup"
          style={{
            left: hoveredCell.x,
            top: hoveredCell.y - 10,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="tooltip-date">{hoveredCell.date}</div>
          <div className="tooltip-range">
            计划：第 {hoveredCell.startPage} - {hoveredCell.endPage} 页
          </div>
          <div className="tooltip-pages">共 {hoveredCell.pageCount} 页</div>
        </div>
      )}
    </div>
  );
}
