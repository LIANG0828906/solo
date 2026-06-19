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

type EventType = 'slot' | 'heatmap' | 'vote-tag' | 'overlay';

interface CalendarEventInput {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    type: EventType;
    slotId?: string;
    userName?: string;
    userColor?: string;
    voteId?: string;
    userNames?: string[];
    count?: number;
    heatmapIntensity?: number;
    tagPosition?: number;
    totalTags?: number;
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
          ? 'rgba(79, 70, 229, 0.25)'
          : 'rgba(51, 65, 85, 0.35)',
        borderColor: isSelected ? '#4F46E5' : '#475569',
        extendedProps: {
          type: 'slot',
          slotId: slot.id,
        },
        className: `fc-slot-base ${isSelected ? 'fc-slot-selected' : 'fc-slot-available'}`,
      });

      if (voteCount > 0) {
        const intensity = Math.min(0.55, 0.12 + (voteCount / Math.max(totalVoters, 1)) * 0.45);
        result.push({
          id: `heatmap-${slot.id}`,
          title: '',
          start: `${slot.date}T${slot.startTime}:00`,
          end: `${slot.date}T${slot.endTime}:00`,
          backgroundColor: `rgba(79, 70, 229, ${intensity})`,
          borderColor: 'transparent',
          extendedProps: {
            type: 'heatmap',
            slotId: slot.id,
            heatmapIntensity: intensity,
          },
          className: 'fc-heatmap-layer',
        });

        const positions = calculateTagPositions(slotVotes.length);
        slotVotes.forEach((vote, idx) => {
          const userColor = getColorForUser(vote.userName, totalVoters);
          result.push({
            id: `vote-tag-${vote.id}-${slot.id}`,
            title: vote.userName,
            start: `${slot.date}T${slot.startTime}:00`,
            end: `${slot.date}T${slot.endTime}:00`,
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            extendedProps: {
              type: 'vote-tag',
              userName: vote.userName,
              userColor,
              voteId: vote.id,
              slotId: slot.id,
              tagPosition: positions[idx],
              totalTags: slotVotes.length,
            },
            className: `fc-vote-tag-layer`,
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

  function calculateTagPositions(count: number): number[] {
    const positions: number[] = [];
    const maxPerRow = 4;
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / maxPerRow);
      const col = i % maxPerRow;
      const rowCount = Math.min(maxPerRow, count - row * maxPerRow);
      const colSpacing = 100 / (rowCount + 1);
      positions.push(row * 100 + colSpacing * (col + 1));
    }
    return positions;
  }

  function getAbbreviation(name: string): string {
    if (!name) return '?';
    if (name.length <= 2) return name.toUpperCase();
    const chineseMatch = name.match(/[\u4e00-\u9fa5]/);
    if (chineseMatch && name.length >= 2) {
      return name.slice(0, 2);
    }
    const words = name.split(/[\s_-]+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

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
              className={`card p-4 cursor-pointer transition-all duration-200 ease-bounce-subtle hover:scale-[1.02] relative overflow-hidden ${
                isSelected ? 'border-primary-500 shadow-glow' : ''
              }`}
              style={{
                animationDelay: `${index * 0.05}s`,
                animation: 'fade-in-up 0.5s ease-out both',
              }}
            >
              {slotVotes.length > 0 && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, ${hexToRgba('#4F46E5', Math.min(0.35, slotVotes.length / Math.max(votes.length, 1) * 0.3))} 0%, transparent 60%)`,
                  }}
                />
              )}

              {slotVotes.length > 0 && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-primary-600/95 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                  <Users className="w-3 h-3" />
                  {slotVotes.length}人
                </div>
              )}

              <div className="relative flex items-center justify-between mb-4 pr-16">
                <div>
                  <div className="text-lg font-semibold text-dark-100">{slot.date}</div>
                  <div className="text-sm text-dark-400 flex items-center gap-1">
                    <span>{slot.startTime} - {slot.endTime}</span>
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

              <div className="relative flex flex-wrap gap-1.5">
                {slotVotes.length === 0 ? (
                  <div className="text-xs text-dark-500 py-2 px-3 bg-dark-800/50 rounded-lg">
                    暂无参与者选择
                  </div>
                ) : (
                  slotVotes.map((vote, vIdx) => {
                    const color = getColorForUser(vote.userName, slotVotes.length);
                    const abbr = getAbbreviation(vote.userName);
                    return (
                      <div
                        key={vote.id}
                        className="group relative"
                        title={`${vote.userName} - 可用`}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white border-2 shadow-md transition-all duration-200 ease-bounce-subtle hover:scale-125 hover:z-10 hover:shadow-xl"
                          style={{
                            backgroundColor: color,
                            borderColor: hexToRgba(color, 0.5),
                            animation: `fade-in-up 0.4s ease-out ${vIdx * 0.04}s both`,
                            boxShadow: `0 2px 8px ${hexToRgba(color, 0.4)}`,
                          }}
                        >
                          {abbr}
                        </div>
                        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="bg-dark-900 text-dark-100 text-[11px] px-2 py-1 rounded shadow-xl whitespace-nowrap border border-dark-600">
                            {vote.userName}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {slotVotes.length > 12 && (
                  <div
                    className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center text-[11px] font-bold text-dark-300 border-2 border-dark-600"
                    title={`还有 ${slotVotes.length - 12} 人可用`}
                  >
                    +{slotVotes.length - 12}
                  </div>
                )}
              </div>

              <div className="relative mt-4 flex items-center gap-2">
                <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${votes.length > 0 ? (slotVotes.length / votes.length) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, #4F46E5, #818CF8, #4F46E5)',
                      backgroundSize: '200% 100%',
                      animation: slotVotes.length > 0 ? 'progress-shine 3s ease-in-out infinite' : undefined,
                    }}
                  />
                </div>
                <span className="text-xs text-dark-400 flex-shrink-0 min-w-[3.5rem] text-right font-medium">
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
      <style>{`
        @keyframes progress-shine {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>

      {tooltip.visible && (
        <div
          className="fixed z-[9999] pointer-events-none animate-fade-in"
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          <div className="bg-dark-900/95 backdrop-blur-md border border-dark-600 rounded-card shadow-2xl p-3 min-w-[200px] max-w-[280px]">
            <div className="text-sm font-semibold text-dark-100 mb-1">{tooltip.date}</div>
            <div className="text-xs text-dark-400 mb-3">{tooltip.time}</div>
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-dark-700">
              <Users className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-bold text-primary-300">
                {tooltip.count} 人可用
              </span>
            </div>
            {tooltip.userNames.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {tooltip.userNames.map((name, i) => {
                  const color = getColorForUser(name, tooltip.userNames.length);
                  const abbr = getAbbreviation(name);
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs text-dark-300">
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {abbr}
                      </div>
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
        eventOrder={((a: any, b: any) => {
          const order = { slot: 0, heatmap: 1, 'vote-tag': 2, overlay: 3 };
          const aType = a.extendedProps.type as keyof typeof order;
          const bType = b.extendedProps.type as keyof typeof order;
          return order[aType] - order[bType];
        }) as any}
        eventContent={(arg) => {
          const type = arg.event.extendedProps.type as EventType;

          if (type === 'overlay') {
            const count = arg.event.extendedProps.count || 0;
            const slotId = arg.event.extendedProps.slotId || '';
            if (count === 0) return null;

            return (
              <div
                className="w-full h-full flex items-start justify-end p-1.5 pointer-events-auto cursor-help"
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
                <div
                  className="flex items-center gap-1 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-fade-in"
                  style={{
                    background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.5)',
                  }}
                >
                  <Users className="w-3 h-3" />
                  {count}人
                </div>
              </div>
            );
          }

          if (type === 'vote-tag') {
            const userName = arg.event.extendedProps.userName || '';
            const userColor = arg.event.extendedProps.userColor || '#8B5CF6';
            const position = arg.event.extendedProps.tagPosition || 50;
            const totalTags = arg.event.extendedProps.totalTags || 1;
            const abbr = getAbbreviation(userName);

            const row = Math.floor(position / 100);
            const colPercent = position % 100;
            const tagHeight = 24;
            const topOffset = 6 + row * (tagHeight + 4);

            return (
              <div
                className="w-full h-full pointer-events-none"
                style={{ position: 'relative' }}
              >
                <div
                  className="absolute group"
                  style={{
                    top: `${topOffset}px`,
                    left: `${colPercent}%`,
                    transform: 'translateX(-50%)',
                    animation: `fade-in-up 0.3s ease-out`,
                  }}
                >
                  <div
                    className="flex items-center justify-center text-[10px] font-bold text-white rounded-md border shadow-sm transition-all duration-200"
                    style={{
                      width: totalTags > 8 ? '20px' : '24px',
                      height: totalTags > 8 ? '20px' : '24px',
                      backgroundColor: userColor,
                      borderColor: hexToRgba(userColor, 0.7),
                      boxShadow: `0 2px 6px ${hexToRgba(userColor, 0.35)}`,
                    }}
                    title={userName}
                  >
                    {abbr}
                  </div>
                </div>
              </div>
            );
          }

          if (type === 'heatmap') {
            return (
              <div
                className="w-full h-full pointer-events-none"
                style={{
                  background: arg.event.backgroundColor,
                  borderRadius: '6px',
                  mixBlendMode: 'multiply',
                }}
              />
            );
          }

          if (type === 'slot') {
            return null;
          }

          return null;
        }}
        eventDidMount={(info) => {
          const type = info.event.extendedProps.type as EventType;
          if (type === 'vote-tag') {
            info.el.style.zIndex = '5';
            info.el.style.background = 'transparent';
            info.el.style.border = 'none';
            info.el.style.boxShadow = 'none';
            info.el.style.pointerEvents = 'none';
          } else if (type === 'heatmap') {
            info.el.style.zIndex = '2';
            info.el.style.background = 'transparent';
            info.el.style.border = 'none';
            info.el.style.boxShadow = 'none';
            info.el.style.pointerEvents = 'none';
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
