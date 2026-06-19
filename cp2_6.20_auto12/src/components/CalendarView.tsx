import { useMemo, memo, useCallback, useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import { format, parseISO } from 'date-fns';
import type { TimeSlot, Vote } from '@/types';
import { getColorForUser, hexToRgba } from '@/utils/computeBestTime';
import { Users } from 'lucide-react';

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
    type: 'slot' | 'vote' | 'overlay';
    slotId?: string;
    userName?: string;
    voteId?: string;
    userNames?: string[];
    count?: number;
  };
  className: string;
  display?: 'block' | 'background' | 'inverse-background';
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  slotId?: string;
  userNames: string[];
  count: number;
  date: string;
  time: string;
}

const CalendarView = memo(function CalendarView({
  timeSlots,
  votes,
  selectedSlotIds,
  onSlotSelect,
  isSelectable = true,
  isMobile = false,
}: CalendarViewProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    userNames: [],
    count: 0,
    date: '',
    time: '',
  });
  const calendarRef = useRef<FullCalendar>(null);
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slotVoteMap = useMemo(() => {
    const map: Record<string, Vote[]> = {};
    timeSlots.forEach((slot) => {
      map[slot.id] = votes.filter((v) => v.availableSlotIds.includes(slot.id));
    });
    return map;
  }, [timeSlots, votes]);

  const events = useMemo<CalendarEventInput[]>(() => {
    const result: CalendarEventInput[] = [];
    const totalVoters = votes.length;

    timeSlots.forEach((slot) => {
      const isSelected = selectedSlotIds.includes(slot.id);
      const slotVotes = slotVoteMap[slot.id] || [];
      const voteCount = slotVotes.length;

      result.push({
        id: `slot-${slot.id}`,
        title: '',
        start: `${slot.date}T${slot.startTime}:00`,
        end: `${slot.date}T${slot.endTime}:00`,
        backgroundColor: isSelected
          ? 'rgba(79, 70, 229, 0.35)'
          : 'rgba(51, 65, 85, 0.4)',
        borderColor: isSelected ? '#4F46E5' : '#475569',
        extendedProps: {
          type: 'slot',
          slotId: slot.id,
        },
        className: `fc-slot-base ${isSelected ? 'fc-slot-selected' : 'fc-slot-available'}`,
      });

      if (voteCount > 0) {
        const intensity = Math.min(0.6, 0.15 + (voteCount / Math.max(totalVoters, 1)) * 0.45);
        slotVotes.forEach((vote, idx) => {
          const userColor = getColorForUser(vote.userName, totalVoters);
          result.push({
            id: `vote-${vote.id}-${slot.id}`,
            title: vote.userName,
            start: `${slot.date}T${slot.startTime}:00`,
            end: `${slot.date}T${slot.endTime}:00`,
            backgroundColor: hexToRgba(userColor, 0.28),
            borderColor: hexToRgba(userColor, 0.55),
            extendedProps: {
              type: 'vote',
              userName: vote.userName,
              voteId: vote.id,
              slotId: slot.id,
            },
            className: `fc-vote-block fc-vote-${idx % 5}`,
          });
        });

        result.push({
          id: `overlay-${slot.id}`,
          title: `${voteCount}`,
          start: `${slot.date}T${slot.startTime}:00`,
          end: `${slot.date}T${slot.endTime}:00`,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          extendedProps: {
            type: 'overlay',
            slotId: slot.id,
            userNames: slotVotes.map((v) => v.userName),
            count: voteCount,
          },
          className: 'fc-count-overlay',
        });
      }
    });

    return result;
  }, [timeSlots, votes, selectedSlotIds, slotVoteMap]);

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

  const showTooltip = useCallback(
    (e: React.MouseEvent, slotId: string) => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }

      const slotVotes = slotVoteMap[slotId] || [];
      const slot = timeSlots.find((s) => s.id === slotId);
      if (!slot) return;

      setTooltip({
        visible: true,
        x: e.clientX + 12,
        y: e.clientY + 12,
        slotId,
        userNames: slotVotes.map((v) => v.userName),
        count: slotVotes.length,
        date: slot.date,
        time: `${slot.startTime} - ${slot.endTime}`,
      });
    },
    [slotVoteMap, timeSlots]
  );

  const hideTooltip = useCallback(() => {
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltip((prev) => ({ ...prev, visible: false }));
    }, 150);
  }, []);

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

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
          const slotVotes = slotVoteMap[slot.id] || [];

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
              className={`card p-4 cursor-pointer transition-all duration-200 ease-bounce-subtle hover:scale-[1.02] relative ${
                isSelected ? 'border-primary-500 shadow-glow' : ''
              }`}
              style={{
                animationDelay: `${index * 0.05}s`,
                animation: 'fade-in-up 0.5s ease-out both',
              }}
            >
              {slotVotes.length > 0 && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-primary-600/90 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                  <Users className="w-3 h-3" />
                  {slotVotes.length}
                </div>
              )}

              <div className="flex items-center justify-between mb-3 pr-12">
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
                {slotVotes.slice(0, 8).map((vote, vIdx) => {
                  const color = getColorForUser(vote.userName, slotVotes.length);
                  return (
                    <div
                      key={vote.id}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-dark-800 shadow-sm transition-transform hover:scale-125 hover:z-10"
                      style={{
                        backgroundColor: color,
                        animation: `fade-in-up 0.4s ease-out ${vIdx * 0.05}s both`,
                      }}
                      title={`${vote.userName} - 可用`}
                    >
                      {vote.userName.charAt(0).toUpperCase()}
                    </div>
                  );
                })}
                {slotVotes.length > 8 && (
                  <div
                    className="w-7 h-7 rounded-full bg-dark-600 flex items-center justify-center text-xs font-medium text-dark-200 border-2 border-dark-800"
                    title={`还有 ${slotVotes.length - 8} 人可用`}
                  >
                    +{slotVotes.length - 8}
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${votes.length > 0 ? (slotVotes.length / votes.length) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, #4F46E5, #818CF8)',
                    }}
                  />
                </div>
                <span className="text-sm text-dark-400 flex-shrink-0 min-w-[3rem] text-right">
                  {slotVotes.length}/{votes.length} 人
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="fc-dark-theme relative">
      {tooltip.visible && (
        <div
          className="fixed z-[9999] pointer-events-none animate-fade-in"
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          <div className="bg-dark-900/95 backdrop-blur-sm border border-dark-600 rounded-card shadow-2xl p-3 min-w-[180px] max-w-[240px]">
            <div className="text-sm font-semibold text-dark-100 mb-1">{tooltip.date}</div>
            <div className="text-xs text-dark-400 mb-3">{tooltip.time}</div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-medium text-primary-300">
                {tooltip.count} 人可用
              </span>
            </div>
            {tooltip.userNames.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {tooltip.userNames.map((name, i) => {
                  const color = getColorForUser(name, tooltip.userNames.length);
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs text-dark-300">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate">{name}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {tooltip.userNames.length === 0 && (
              <div className="text-xs text-dark-500">暂无参与者选择此时段</div>
            )}
          </div>
        </div>
      )}

      <FullCalendar
        ref={calendarRef}
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
        eventOrderStrict={true}
        eventOrder={(a: { extendedProps: { type: string } }, b: { extendedProps: { type: string } }) => {
          const order = { slot: 0, vote: 1, overlay: 2 };
          const aType = a.extendedProps.type as keyof typeof order;
          const bType = b.extendedProps.type as keyof typeof order;
          return order[aType] - order[bType];
        }}
        eventContent={(arg) => {
          const type = arg.event.extendedProps.type;

          if (type === 'overlay') {
            const count = arg.event.extendedProps.count || 0;
            const slotId = arg.event.extendedProps.slotId || '';
            if (count === 0) return null;

            return (
              <div
                className="w-full h-full flex items-start justify-end p-1 pointer-events-auto cursor-help"
                onMouseEnter={(e) => showTooltip(e, slotId)}
                onMouseLeave={hideTooltip}
                onMouseMove={(e) => {
                  if (tooltipTimeoutRef.current) {
                    clearTimeout(tooltipTimeoutRef.current);
                  }
                  setTooltip((prev) => ({
                    ...prev,
                    visible: true,
                    x: e.clientX + 12,
                    y: e.clientY + 12,
                  }));
                }}
              >
                <div className="flex items-center gap-1 bg-primary-600/90 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-fade-in">
                  <Users className="w-3 h-3" />
                  {count}
                </div>
              </div>
            );
          }

          if (type === 'vote') {
            const userName = arg.event.extendedProps.userName || '';
            const userColor = getColorForUser(userName, votes.length);
            return (
              <div
                className="w-full h-full"
                style={{
                  background: `linear-gradient(135deg, ${hexToRgba(userColor, 0.35)} 0%, ${hexToRgba(userColor, 0.15)} 100%)`,
                  borderLeft: `3px solid ${userColor}`,
                  borderRadius: '4px',
                }}
              />
            );
          }

          return null;
        }}
        eventDidMount={(info) => {
          const type = info.event.extendedProps.type;
          if (type === 'vote') {
            info.el.style.zIndex = '2';
            info.el.style.pointerEvents = 'none';
            info.el.style.margin = '1px';
          } else if (type === 'slot') {
            info.el.style.zIndex = '1';
          } else if (type === 'overlay') {
            info.el.style.zIndex = '10';
            info.el.style.background = 'transparent';
            info.el.style.border = 'none';
            info.el.style.boxShadow = 'none';
          }
        }}
      />
    </div>
  );
});

export default CalendarView;
