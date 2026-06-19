import { useMemo, memo, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import { format, parseISO } from 'date-fns';
import type { TimeSlot, Vote } from '@/types';

interface CalendarViewProps {
  timeSlots: TimeSlot[];
  votes: Vote[];
  selectedSlotIds: string[];
  onSlotSelect?: (slotIds: string[]) => void;
  isSelectable?: boolean;
  isMobile?: boolean;
}

interface CalendarEventInput {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    type: 'slot' | 'vote';
    slotId?: string;
    userName?: string;
    voteId?: string;
  };
  className: string;
}

const CalendarView = memo(function CalendarView({
  timeSlots,
  votes,
  selectedSlotIds,
  onSlotSelect,
  isSelectable = true,
  isMobile = false,
}: CalendarViewProps) {
  const events = useMemo<CalendarEventInput[]>(() => {
    const result: CalendarEventInput[] = [];

    timeSlots.forEach((slot) => {
      const isSelected = selectedSlotIds.includes(slot.id);
      result.push({
        id: `slot-${slot.id}`,
        title: '',
        start: `${slot.date}T${slot.startTime}:00`,
        end: `${slot.date}T${slot.endTime}:00`,
        backgroundColor: isSelected ? 'rgba(79, 70, 229, 0.5)' : 'rgba(51, 65, 85, 0.6)',
        borderColor: isSelected ? '#4F46E5' : '#475569',
        extendedProps: {
          type: 'slot',
          slotId: slot.id,
        },
        className: isSelected ? 'fc-slot-selected' : 'fc-slot-available',
      });
    });

    votes.forEach((vote) => {
      vote.availableSlotIds.forEach((slotId) => {
        const slot = timeSlots.find((s) => s.id === slotId);
        if (slot) {
          result.push({
            id: `vote-${vote.id}-${slotId}`,
            title: vote.userName,
            start: `${slot.date}T${slot.startTime}:00`,
            end: `${slot.date}T${slot.endTime}:00`,
            backgroundColor: vote.userColor + '40',
            borderColor: vote.userColor + '80',
            extendedProps: {
              type: 'vote',
              userName: vote.userName,
              voteId: vote.id,
              slotId: slot.id,
            },
            className: 'fc-vote-block',
          });
        }
      });
    });

    return result;
  }, [timeSlots, votes, selectedSlotIds]);

  const handleDateClick = useCallback(
    (arg: { date: Date; dateStr: string }) => {
      if (!isSelectable || !onSlotSelect) return;

      const clickedDate = arg.dateStr.split('T')[0];
      const clickedTime = format(arg.date, 'HH:mm');
      const clickedMinutes =
        parseInt(clickedTime.split(':')[0]) * 60 + parseInt(clickedTime.split(':')[1]);

      const clickedSlot = timeSlots.find((slot) => {
        if (slot.date !== clickedDate) return false;
        const startMin =
          parseInt(slot.startTime.split(':')[0]) * 60 + parseInt(slot.startTime.split(':')[1]);
        const endMin =
          parseInt(slot.endTime.split(':')[0]) * 60 + parseInt(slot.endTime.split(':')[1]);
        return clickedMinutes >= startMin && clickedMinutes < endMin;
      });

      if (clickedSlot) {
        const isSelected = selectedSlotIds.includes(clickedSlot.id);
        if (isSelected) {
          onSlotSelect(selectedSlotIds.filter((id) => id !== clickedSlot.id));
        } else {
          onSlotSelect([...selectedSlotIds, clickedSlot.id]);
        }
      }
    },
    [timeSlots, selectedSlotIds, isSelectable, onSlotSelect]
  );

  const handleSelect = useCallback(
    (arg: { start: Date; end: Date; startStr: string; endStr: string }) => {
      if (!isSelectable || !onSlotSelect) return;

      const startDate = format(arg.start, 'yyyy-MM-dd');
      const startTime = format(arg.start, 'HH:mm');
      const endTime = format(arg.end, 'HH:mm');

      const startMin = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
      const endMin = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);

      const overlappingSlotIds = timeSlots
        .filter((slot) => {
          if (slot.date !== startDate) return false;
          const sMin =
            parseInt(slot.startTime.split(':')[0]) * 60 + parseInt(slot.startTime.split(':')[1]);
          const eMin =
            parseInt(slot.endTime.split(':')[0]) * 60 + parseInt(slot.endTime.split(':')[1]);
          return startMin < eMin && endMin > sMin;
        })
        .map((s) => s.id);

      if (overlappingSlotIds.length > 0) {
        const allSelected = overlappingSlotIds.every((id) => selectedSlotIds.includes(id));
        if (allSelected) {
          onSlotSelect(selectedSlotIds.filter((id) => !overlappingSlotIds.includes(id)));
        } else {
          const newSelected = [...new Set([...selectedSlotIds, ...overlappingSlotIds])];
          onSlotSelect(newSelected);
        }
      }
    },
    [timeSlots, selectedSlotIds, isSelectable, onSlotSelect]
  );

  const initialDate = useMemo(() => {
    if (timeSlots.length > 0) {
      return timeSlots[0].date;
    }
    return format(new Date(), 'yyyy-MM-dd');
  }, [timeSlots]);

  const slotMinTime = useMemo(() => {
    if (timeSlots.length === 0) return '08:00:00';
    let min = '23:59';
    timeSlots.forEach((s) => {
      if (s.startTime < min) min = s.startTime;
    });
    const h = Math.max(0, parseInt(min.split(':')[0]) - 1);
    return `${h.toString().padStart(2, '0')}:00:00`;
  }, [timeSlots]);

  const slotMaxTime = useMemo(() => {
    if (timeSlots.length === 0) return '20:00:00';
    let max = '00:00';
    timeSlots.forEach((s) => {
      if (s.endTime > max) max = s.endTime;
    });
    const h = Math.min(23, parseInt(max.split(':')[0]) + 1);
    return `${h.toString().padStart(2, '0')}:00:00`;
  }, [timeSlots]);

  const validRange = useMemo(() => {
    if (timeSlots.length === 0) return undefined;
    const dates = timeSlots.map((s) => parseISO(s.date).getTime());
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    min.setDate(min.getDate() - 1);
    max.setDate(max.getDate() + 2);
    return {
      start: format(min, 'yyyy-MM-dd'),
      end: format(max, 'yyyy-MM-dd'),
    };
  }, [timeSlots]);

  if (isMobile) {
    return (
      <div className="space-y-4">
        {timeSlots.map((slot, index) => {
          const isSelected = selectedSlotIds.includes(slot.id);
          const slotVotes = votes.filter((v) => v.availableSlotIds.includes(slot.id));

          return (
            <div
              key={slot.id}
              onClick={() => {
                if (!isSelectable || !onSlotSelect) return;
                if (isSelected) {
                  onSlotSelect(selectedSlotIds.filter((id) => id !== slot.id));
                } else {
                  onSlotSelect([...selectedSlotIds, slot.id]);
                }
              }}
              className={`card p-4 cursor-pointer transition-all duration-200 ease-bounce-subtle hover:scale-[1.02] ${
                isSelected ? 'border-primary-500 shadow-glow' : ''
              }`}
              style={{
                animationDelay: `${index * 0.05}s`,
                animation: 'fade-in-up 0.5s ease-out both',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-lg font-semibold text-dark-100">{slot.date}</div>
                  <div className="text-sm text-dark-400">
                    {slot.startTime} - {slot.endTime}
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-primary-600 border-primary-600'
                      : 'border-dark-500 bg-dark-700'
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {slotVotes.slice(0, 8).map((vote) => (
                  <div
                    key={vote.id}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                    style={{ backgroundColor: vote.userColor }}
                    title={vote.userName}
                  >
                    {vote.userName.charAt(0).toUpperCase()}
                  </div>
                ))}
                {slotVotes.length > 8 && (
                  <div className="w-6 h-6 rounded-full bg-dark-600 flex items-center justify-center text-xs font-medium text-dark-300">
                    +{slotVotes.length - 8}
                  </div>
                )}
              </div>

              <div className="mt-3 text-sm text-dark-400">
                {slotVotes.length} 人可用
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="fc-dark-theme">
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin, dayGridPlugin]}
        initialView="timeGridWeek"
        initialDate={initialDate}
        selectable={isSelectable}
        selectMirror={true}
        select={handleSelect}
        dateClick={handleDateClick}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay',
        }}
        slotMinTime={slotMinTime}
        slotMaxTime={slotMaxTime}
        slotDuration="00:30:00"
        slotLabelInterval="01:00"
        allDaySlot={false}
        nowIndicator={false}
        weekNumbers={false}
        dayMaxEvents={true}
        events={events}
        validRange={validRange}
        height="auto"
        eventOrder="type"
        eventDidMount={(info) => {
          const type = info.event.extendedProps.type;
          if (type === 'vote') {
            info.el.style.zIndex = '2';
            info.el.style.pointerEvents = 'none';
          } else {
            info.el.style.zIndex = '1';
          }
        }}
      />
    </div>
  );
});

export default CalendarView;
