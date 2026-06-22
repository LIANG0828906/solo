import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { Mood } from '../types';
import { MOOD_CONFIG } from '../types';
import { useEntryStore } from '../store';
import { getWeekDates, formatDate } from '../utils/dateUtils';

type DailyCounts = Record<Mood, number>;
type WeeklyData = { date: Date; label: string; counts: DailyCounts }[];

const MOODS: Mood[] = ['excited', 'thoughtful', 'bored', 'anxious'];

export default function Stats() {
  const entries = useEntryStore(useShallow((state) => state.entries));

  const weekData = useMemo((): WeeklyData => {
    const weekDates = getWeekDates();
    const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

    const emptyCounts: DailyCounts = {
      excited: 0,
      thoughtful: 0,
      bored: 0,
      anxious: 0,
    };

    return weekDates.map((date, index) => {
      const dateStr = formatDate(date);
      const dayEntries = entries.filter((e) => formatDate(e.createdAt) === dateStr);

      const counts: DailyCounts = { ...emptyCounts };
      dayEntries.forEach((e) => {
        counts[e.mood]++;
      });

      return {
        date,
        label: dayNames[index],
        counts,
      };
    });
  }, [entries]);

  const maxValue = useMemo(() => {
    let max = 0;
    weekData.forEach((day) => {
      MOODS.forEach((mood) => {
        max = Math.max(max, day.counts[mood]);
      });
    });
    return max || 1;
  }, [weekData]);

  const totalCounts = useMemo(() => {
    const totals: DailyCounts = {
      excited: 0,
      thoughtful: 0,
      bored: 0,
      anxious: 0,
    };
    weekData.forEach((day) => {
      MOODS.forEach((mood) => {
        totals[mood] += day.counts[mood];
      });
    });
    return totals;
  }, [weekData]);

  const weekStart = formatDate(weekData[0]?.date || new Date());
  const weekEnd = formatDate(weekData[6]?.date || new Date());

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h2 className="stats-title">本周心情统计</h2>
        <p className="stats-subtitle">{weekStart} ~ {weekEnd}</p>
      </div>

      <div className="stats-summary">
        {MOODS.map((mood) => (
          <div key={mood} className="summary-item">
            <span
              className="summary-dot"
              style={{ backgroundColor: MOOD_CONFIG[mood].color }}
            />
            <span className="summary-label">{MOOD_CONFIG[mood].label}</span>
            <span className="summary-count">{totalCounts[mood]}次</span>
          </div>
        ))}
      </div>

      <div className="chart-container">
        <div className="chart-y-axis">
          {Array.from({ length: maxValue + 1 }, (_, i) => maxValue - i).map((val) => (
            <div key={val} className="y-axis-label">{val}</div>
          ))}
        </div>

        <div className="chart-content">
          <div className="chart-grid">
            {Array.from({ length: maxValue + 1 }, (_, i) => (
              <div key={i} className="grid-line" />
            ))}
          </div>

          <div className="chart-bars">
            {weekData.map((day, dayIndex) => (
              <div key={dayIndex} className="bar-group">
                <div className="bars-wrapper">
                  {MOODS.map((mood) => {
                    const count = day.counts[mood];
                    const heightPercent = maxValue > 0 ? (count / maxValue) * 100 : 0;

                    return (
                      <div
                        key={mood}
                        className="bar-column"
                        style={{
                          background: `linear-gradient(to top, ${MOOD_CONFIG[mood].color}, ${MOOD_CONFIG[mood].color}cc)`,
                          height: `${heightPercent}%`,
                        }}
                      >
                        {count > 0 && (
                          <div className="bar-tooltip">
                            {MOOD_CONFIG[mood].label}: {count}次
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="bar-label">{day.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-legend">
        {MOODS.map((mood) => (
          <div key={mood} className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: MOOD_CONFIG[mood].color }}
            />
            <span className="legend-label">{MOOD_CONFIG[mood].label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
