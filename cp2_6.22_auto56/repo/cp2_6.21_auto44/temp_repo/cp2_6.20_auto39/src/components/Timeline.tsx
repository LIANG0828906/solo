import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import EventCard from './EventCard';
import { useTimelineStore } from '@/store/useTimelineStore';
import type { TimelineEvent } from '@/types';

interface TimelineProps {
  events: TimelineEvent[];
}

const Timeline: React.FC<TimelineProps> = function Timeline({ events }) {
  const { expandedIds, toggleExpand } = useTimelineStore();
  const prevEventsLength = useRef(events.length);
  const newEventId = useRef<string | null>(null);

  const sortedEvents = useMemo(() => {
    const start = performance.now();
    const sorted = [...events].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const duration = performance.now() - start;
    if (duration > 10) {
      console.warn(`排序耗时: ${duration.toFixed(2)}ms`);
    }
    return sorted;
  }, [events]);

  useEffect(() => {
    if (events.length > prevEventsLength.current) {
      const sorted = [...events].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      newEventId.current = sorted[0]?.id || null;

      const timer = setTimeout(() => {
        newEventId.current = null;
      }, 1000);

      prevEventsLength.current = events.length;
      return () => clearTimeout(timer);
    }
    prevEventsLength.current = events.length;
  }, [events]);

  const handleToggle = useCallback(
    (id: string) => {
      const start = performance.now();
      toggleExpand(id);
      const duration = performance.now() - start;
      if (duration > 50) {
        console.warn(`展开/收起耗时: ${duration.toFixed(2)}ms`);
      }
    },
    [toggleExpand]
  );

  const years = useMemo(() => {
    const yearSet = new Set<string>();
    sortedEvents.forEach((event) => {
      yearSet.add(dayjs(event.date).format('YYYY'));
    });
    return Array.from(yearSet).sort();
  }, [sortedEvents]);

  return (
    <div className="timeline-container relative max-w-5xl mx-auto px-4 py-12">
      <div className="timeline-line absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gray-300" style={{ width: '2px' }} />

      {years.map((year, yearIndex) => (
        <div
          key={year}
          className="year-marker absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
          style={{
            top: `${(yearIndex / (years.length || 1)) * 100}%`,
          }}
        >
          <div className="w-3 h-3 bg-gray-400 rounded-full" />
        </div>
      ))}

      <div className="timeline-content relative z-10">
        {sortedEvents.map((event, index) => {
          const shouldShowYear =
            index === 0 ||
            dayjs(event.date).format('YYYY') !==
              dayjs(sortedEvents[index - 1].date).format('YYYY');

          return (
            <React.Fragment key={event.id}>
              {shouldShowYear && (
                <div className="year-badge flex justify-center mb-8">
                  <span className="bg-gray-200 text-gray-600 px-4 py-1 rounded-full text-sm font-medium">
                    {dayjs(event.date).format('YYYY')}
                  </span>
                </div>
              )}
              <EventCard
                event={event}
                index={index}
                isExpanded={expandedIds.has(event.id)}
                onToggle={handleToggle}
                isNew={newEventId.current === event.id}
              />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(Timeline);
