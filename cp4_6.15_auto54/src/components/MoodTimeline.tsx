import React, { useState, useCallback, useMemo } from 'react';
import { MoodEntry, MOOD_CONFIG } from '../types';
import { format, subDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface MoodTimelineProps {
  moodEntries: MoodEntry[];
}

const MoodTimeline: React.FC<MoodTimelineProps> = React.memo(({ moodEntries }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const days = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return Array.from({ length: 7 }, (_, i) => {
      const dateObj = subDays(new Date(), 6 - i);
      const date = format(dateObj, 'yyyy-MM-dd');
      const entry = moodEntries.find((e) => e.date === date);
      const dateLabel = format(dateObj, 'M/d');
      const dayLabel = format(dateObj, 'EEE', { locale: zhCN });
      const isToday = date === todayStr;
      return { date, entry, dateLabel, dayLabel, isToday };
    });
  }, [moodEntries]);

  const handleDotClick = useCallback((index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  }, []);

  const handleMouseEnter = useCallback((index: number) => {
    setHoveredIndex(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  return (
    <div className="timeline-card">
      <div className="mood-timeline" style={{ position: 'relative' }}>
        <div className="timeline-line" />
        <div className="timeline-dots">
          {days.map((day, index) => {
            const hasEntry = !!day.entry;
            const moodConfig = hasEntry ? MOOD_CONFIG[day.entry!.mood] : null;
            const isHovered = hoveredIndex === index;
            return (
              <div
                key={day.date}
                className="timeline-dot-wrapper"
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleDotClick(index)}
              >
                {isHovered && (
                  <div className="timeline-tooltip">
                    <div className="timeline-tooltip-mood">
                      {hasEntry ? (
                        <>
                          <span style={{ fontSize: '1.1rem', marginRight: '4px' }}>
                            {moodConfig?.emoji}
                          </span>
                          {moodConfig?.label}
                        </>
                      ) : (
                        <span style={{ color: '#B0B0A0' }}>未记录心情</span>
                      )}
                    </div>
                    {hasEntry && day.entry!.diary ? (
                      <div className="timeline-tooltip-diary">
                        {day.entry!.diary.length > 40
                          ? `${day.entry!.diary.slice(0, 40)}...`
                          : day.entry!.diary}
                      </div>
                    ) : (
                      <div className="timeline-tooltip-diary" style={{ color: '#C0C0B0' }}>
                        {hasEntry ? '这一天还没有写日记哦' : '点击记录心情和日记'}
                      </div>
                    )}
                  </div>
                )}
                <div
                  className={`timeline-dot ${day.isToday ? 'today' : ''}`}
                  style={{
                    background: hasEntry
                      ? moodConfig!.gradient
                      : 'linear-gradient(135deg, #E8E0D0, #D8D0C0)',
                    transform: isHovered ? 'scale(1.35)' : undefined,
                    transition: 'transform 0.2s ease',
                  }}
                />
                <div className="timeline-date-label">{day.dateLabel}</div>
                <div className="timeline-mood-label">
                  {hasEntry ? moodConfig!.label : day.dayLabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {expandedIndex !== null && (
        <div className="timeline-expanded-diary" key={`expanded-${expandedIndex}`}>
          <div className="timeline-expanded-date">
            {days[expandedIndex].date} {days[expandedIndex].dayLabel}
          </div>
          {days[expandedIndex].entry ? (
            <>
              <div className="timeline-expanded-mood">
                <span style={{ fontSize: '1.4rem', marginRight: '6px' }}>
                  {MOOD_CONFIG[days[expandedIndex].entry!.mood].emoji}
                </span>
                <span style={{ fontWeight: 500 }}>
                  {MOOD_CONFIG[days[expandedIndex].entry!.mood].label}
                </span>
              </div>
              {days[expandedIndex].entry!.diary ? (
                <div className="timeline-expanded-text">
                  {days[expandedIndex].entry!.diary}
                </div>
              ) : (
                <div className="timeline-expanded-text" style={{ color: '#B0B0A0' }}>
                  这一天还没有写日记哦～可以在上方的日记编辑器中记录今天的心情。
                </div>
              )}
            </>
          ) : (
            <>
              <div className="timeline-expanded-mood">
                <span style={{ fontSize: '1.4rem', marginRight: '6px' }}>🤔</span>
                <span style={{ color: '#A0A0A0' }}>未记录</span>
              </div>
              <div className="timeline-expanded-text" style={{ color: '#B0B0A0' }}>
                这一天还没有记录心情，快在「今日日记」中添加一条记录吧～
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
});

MoodTimeline.displayName = 'MoodTimeline';

export default MoodTimeline;
