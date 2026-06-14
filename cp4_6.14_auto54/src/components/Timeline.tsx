import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import EventCard from './EventCard';
import type { TripDay, TripEvent } from '../types';
import { formatDate, formatTime } from '../utils/time';

interface TimelineProps {
  days: TripDay[];
  blinkingEvents: Set<string>;
  highlightedEventId: string | null;
  currentMemberId: string;
  onAddEvent: (dayDate: string) => void;
  onEditEvent: (event: TripEvent) => void;
  onDeleteEvent: (dayDate: string, eventId: string) => void;
  onReorderEvents: (dayDate: string, events: TripEvent[]) => void;
}

const Timeline: React.FC<TimelineProps> = ({
  days,
  blinkingEvents,
  highlightedEventId,
  currentMemberId,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  onReorderEvents,
}) => {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(
    new Set(days.map((d) => d.date))
  );
  void currentMemberId;

  const toggleDay = (date: string) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const handleDragStart = (eventId: string, dayDate: string) => {
    void eventId;
    void dayDate;
  };

  const handleDragEnd = () => {
  };

  const handleDropOnCard = (
    draggedEventId: string,
    targetEventId: string,
    dayDate: string,
    position: 'before' | 'after'
  ) => {
    const day = days.find((d) => d.date === dayDate);
    if (!day) return;

    const events = [...day.events];
    const draggedIndex = events.findIndex((e) => e.id === draggedEventId);
    if (draggedIndex === -1) return;

    const [draggedEvent] = events.splice(draggedIndex, 1);

    let targetIndex = events.findIndex((e) => e.id === targetEventId);
    if (position === 'after') {
      targetIndex += 1;
    }

    events.splice(targetIndex, 0, draggedEvent);

    const reorderedEvents = events.map((e, idx) => ({
      ...e,
      order: idx,
    }));

    onReorderEvents(dayDate, reorderedEvents);
  };

  const handleDropOnDay = (e: React.DragEvent<HTMLDivElement>, dayDate: string) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { eventId, dayDate: sourceDayDate } = data;

      if (!eventId) return;
      if (sourceDayDate === dayDate) return;

      const sourceDay = days.find((d) => d.date === sourceDayDate);
      const targetDay = days.find((d) => d.date === dayDate);
      if (!sourceDay || !targetDay) return;

      const eventToMove = sourceDay.events.find((e) => e.id === eventId);
      if (!eventToMove) return;

      const newSourceEvents = sourceDay.events.filter((e) => e.id !== eventId);
      const newOrder = targetDay.events.length;
      const movedEvent = { ...eventToMove, order: newOrder };

      onReorderEvents(
        sourceDayDate,
        newSourceEvents.map((e, idx) => ({ ...e, order: idx }))
      );
      onReorderEvents(dayDate, [...targetDay.events, movedEvent]);
    } catch {
    }
  };

  const handleDragOverDay = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  if (days.length === 0) {
    return (
      <div className="card-base p-12 text-center">
        <p className="text-gray-500 text-sm">暂无行程数据</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {days.map((day, dayIndex) => {
        const isExpanded = expandedDays.has(day.date);
        const dayStart = formatDate(day.date);

        return (
          <div
            key={day.date}
            className="card-base overflow-hidden"
            onDragOver={handleDragOverDay}
            onDrop={(e) => handleDropOnDay(e, day.date)}
          >
            <div
              className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 cursor-pointer select-none"
              style={{
                background:
                  dayIndex % 2 === 0
                    ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
                    : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
              }}
              onClick={() => toggleDay(day.date)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: dayIndex % 2 === 0 ? '#0ea5e9' : '#f97316',
                  }}
                >
                  <span className="text-white font-bold text-sm sm:text-base">
                    {dayIndex + 1}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base sm:text-lg text-slate-800 truncate">
                    {dayStart}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {day.events.length} 个事件 · ¥{day.totalCost.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddEvent(day.date);
                  }}
                  className="flex items-center justify-center rounded-lg text-white transition-all duration-200 hover:scale-105 hover:brightness-110"
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor: '#f97316',
                  }}
                  title="添加事件"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="w-8 h-8 flex items-center justify-center text-slate-400">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="p-3 sm:p-5">
                {day.events.length === 0 ? (
                  <div
                    className="py-8 text-center border-2 border-dashed rounded-xl transition-all duration-200 hover:border-orange-300 hover:bg-orange-50/30 cursor-pointer"
                    style={{ borderColor: '#cbd5e1' }}
                    onClick={() => onAddEvent(day.date)}
                  >
                    <Plus className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-500">点击添加第一个事件</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div
                      className="absolute left-4 sm:left-5 top-2 bottom-2 w-0.5"
                      style={{ backgroundColor: '#e2e8f0' }}
                    />
                    <div className="flex flex-col gap-3">
                      {day.events.map((event) => (
                        <div key={event.id} className="relative pl-10 sm:pl-12">
                          <div
                            className="absolute left-1.5 sm:left-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                            style={{
                              top: 12,
                              backgroundColor: '#ffffff',
                              border: '3px solid #3b82f6',
                            }}
                          >
                            <div
                              className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full"
                              style={{ backgroundColor: '#3b82f6' }}
                            />
                          </div>
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="flex flex-col items-center pt-3 flex-shrink-0">
                              <span className="text-xs font-mono font-semibold text-slate-600 whitespace-nowrap">
                                {formatTime(event.startTime)}
                              </span>
                              <div className="flex-1 w-px my-1 min-h-[20px]" />
                              <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
                                {formatTime(event.endTime)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <EventCard
                                event={event}
                                dayDate={day.date}
                                isHighlighted={highlightedEventId === event.id}
                                isBlinking={blinkingEvents.has(event.id)}
                                onEdit={onEditEvent}
                                onDelete={(eventId) =>
                                  onDeleteEvent(day.date, eventId)
                                }
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onDropOnCard={handleDropOnCard}
                                allDayEvents={day.events}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
