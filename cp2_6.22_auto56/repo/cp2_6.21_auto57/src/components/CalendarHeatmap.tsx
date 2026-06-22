import React, { useMemo } from 'react';
import { DaySummary } from '../api/emotionAPI';

interface Props {
  monthData: DaySummary[];
  year: number;
  month: number;
  onDayClick: (date: string) => void;
  selectedDate: string | null;
  slideDir: 'left' | 'right' | null;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function emotionToColor(avg: number): string {
  const t = (avg - 1) / 9;
  const r = Math.round(255 * (1 - t) + 68 * t);
  const g = Math.round(68 * (1 - t) + 204 * t);
  const b = Math.round(68 * (1 - t) + 68 * t);
  return `rgb(${r},${g},${b})`;
}

const CalendarHeatmap: React.FC<Props> = ({
  monthData,
  year,
  month,
  onDayClick,
  selectedDate,
  slideDir,
}) => {
  const dataMap = useMemo(() => {
    const map = new Map<string, DaySummary>();
    monthData.forEach(d => map.set(d.date, d));
    return map;
  }, [monthData]);

  const cells = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const result: Array<{
      day: number | null;
      date: string | null;
      summary: DaySummary | undefined;
    }> = [];

    for (let i = 0; i < firstDay; i++) {
      result.push({ day: null, date: null, summary: undefined });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      result.push({ day: d, date: dateStr, summary: dataMap.get(dateStr) });
    }
    return result;
  }, [year, month, dataMap]);

  const slideClass = slideDir === 'left'
    ? 'slide-left'
    : slideDir === 'right'
    ? 'slide-right'
    : '';

  return (
    <div>
      <div className="calendar-weekdays">
        {WEEKDAYS.map(w => (
          <div key={w} className="calendar-weekday">{w}</div>
        ))}
      </div>
      <div className="calendar-grid-wrapper">
        <div className={`calendar-grid ${slideClass}`}>
          {cells.map((cell, i) => {
            if (!cell.day || !cell.date) {
              return <div key={`e${i}`} className="calendar-cell empty" />;
            }
            const isSelected = selectedDate === cell.date;
            const bgColor = cell.summary
              ? emotionToColor(cell.summary.avg_intensity)
              : 'transparent';
            return (
              <div
                key={cell.date}
                className={`calendar-cell ${isSelected ? 'selected' : ''}`}
                style={{
                  background: bgColor,
                  border: isSelected ? '2px solid #8e24aa' : '1px solid #f0ecf4',
                }}
                onClick={() => onDayClick(cell.date!)}
              >
                <span className="calendar-day" style={{
                  color: cell.summary ? '#fff' : '#666',
                  fontWeight: cell.summary ? 700 : 500
                }}>
                  {cell.day}
                </span>
                {cell.summary ? (
                  <span className="calendar-dot" style={{ background: '#ffffff80' }} />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
