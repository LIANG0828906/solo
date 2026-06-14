import React, { useState, useCallback } from 'react';
import { MoodEntry, MOOD_CONFIG } from '../types';
import { format, subDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface MoodTimelineProps {
  moodEntries: MoodEntry[];
}

const MoodTimeline: React.FC<MoodTimelineProps> = React.memo(({ moodEntries }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const entry = moodEntries.find((e) => e.date === date);
    const dayLabel = format(subDays(new Date(), 6 - i), 'EEE', { locale: zhCN });
    const dateLabel = format(subDays(new Date(), 6 - i), 'M/d');
    const isToday = date === format(new Date(), 'yyyy-MM-dd');
    return { date, entry, dayLabel, dateLabel, isToday };
  });

  const handleDotClick = useCallback((index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  }, [expandedIndex]);

  return (
    <div className="timeline-card">
      <div className="mood-timeline">
        <div className="timeline-line" />
        <div className="timeline-dots">
          {days.map((day, index) => {
            const moodConfig = day.entry ? MOOD_CONFIG[day.entry.mood] : null;
            return (
              <div
                key={day.date}
                className="timeline-dot-wrapper"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => handleDotClick(index)}
              >
                {hoveredIndex === index && day.entry && (
                  <div className="timeline-tooltip">
                    <div className="timeline-tooltip-mood">
                      {moodConfig?.emoji} {moodConfig?.label}
                    </div>
                    {day.entry.diary && (
                      <div className="timeline-tooltip-diary">{day.entry.diary}</div>
                    )}
                  </div>
                )}
                <div
                  className={`timeline-dot ${day.isToday ? 'today' : ''}`}
                  style={{
                    background: moodConfig ? moodConfig.gradient : '#E0D8D0',
                  }}
                />
                <div className="timeline-date-label">{day.dateLabel}</div>
                <div className="timeline-mood-label">
                  {moodConfig ? moodConfig.label : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {expandedIndex !== null && days[expandedIndex]?.entry && (
        <div className="timeline-expanded-diary">
          <div className="timeline-expanded-date">{days[expandedIndex].date}</div>
          <div className="timeline-expanded-mood">
            {MOOD_CONFIG[days[expandedIndex].entry!.mood].emoji}{' '}
            {MOOD_CONFIG[days[expandedIndex].entry!.mood].label}
          </div>
          {days[expandedIndex].entry!.diary ? (
            <div className="timeline-expanded-text">{days[expandedIndex].entry!.diary}</div>
          ) : (
            <div className="timeline-expanded-text" style={{ color: '#B0B0A0' }}>
              这一天还没有写日记哦～
            </div>
          )}
        </div>
      )}
    </div>
  );
});

MoodTimeline.displayName = 'MoodTimeline';

export default MoodTimeline;
