import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  format,
  parseISO,
  addWeeks,
  startOfWeek,
  differenceInWeeks,
  isSameWeek,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  Music,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from 'lucide-react';
import { useDraggable, DndContext, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragMoveEvent } from '@dnd-kit/core';
import { rehearsalsApi, gigsApi } from '../api';
import type { RehearsalTrack, RehearsalStage, Gig } from '../types';
import { cn } from '../lib/utils';

const stageLabels: Record<RehearsalStage, string> = {
  'not-started': '未开始',
  'first-ensemble': '初次合奏',
  'polishing': '细节打磨',
  'mature': '已成熟',
};

const stageColors: Record<RehearsalStage, string> = {
  'not-started': 'from-gray-500 to-gray-600',
  'first-ensemble': 'from-blue-500 to-blue-600',
  'polishing': 'from-purple-500 to-purple-600',
  'mature': 'from-green-500 to-green-600',
};

const stageBgColors: Record<RehearsalStage, string> = {
  'not-started': 'bg-gray-500/20',
  'first-ensemble': 'bg-blue-500/20',
  'polishing': 'bg-purple-500/20',
  'mature': 'bg-green-500/20',
};

const stageTextColors: Record<RehearsalStage, string> = {
  'not-started': 'text-gray-400',
  'first-ensemble': 'text-blue-400',
  'polishing': 'text-purple-400',
  'mature': 'text-green-400',
};

interface GanttBarProps {
  track: RehearsalTrack;
  weekStart: Date;
  totalWeeks: number;
  weekWidth: number;
  rowHeight: number;
  onResizeStart: (id: string, type: 'start' | 'end', e: React.MouseEvent) => void;
  delay: number;
}

function GanttBar({
  track,
  weekStart,
  totalWeeks,
  weekWidth,
  rowHeight,
  onResizeStart,
  delay,
}: GanttBarProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: track.id,
    data: { track },
  });

  const startDate = parseISO(track.startDate);
  const endDate = parseISO(track.endDate);

  const startOffset = differenceInWeeks(startDate, weekStart) * weekWidth;
  const durationWeeks = Math.max(1, differenceInWeeks(endDate, startDate) + 1);
  const width = durationWeeks * weekWidth - 8;

  const dragX = transform?.x ?? 0;

  return (
    <div
      ref={setNodeRef}
      className="absolute top-1/2 -translate-y-1/2 h-[calc(100%-16px)] rounded-lg overflow-hidden group opacity-0 animate-fade-in-up"
      style={{
        left: startOffset + 4 + dragX,
        width,
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards',
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.9 : undefined,
      }}
      {...attributes}
      {...listeners}
    >
      <div
        className={cn(
          'w-full h-full rounded-lg bg-gradient-to-r',
          stageColors[track.stage],
          'cursor-pointer transition-all duration-200',
          'hover:shadow-lg hover:shadow-accent/20 hover:scale-[1.02]',
          'flex items-center px-3'
        )}
      >
        <span className="text-white text-sm font-medium truncate">
          {track.name}
        </span>
      </div>

      <div
        className="absolute left-0 top-0 bottom-0 w-4 cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => {
          e.stopPropagation();
          onResizeStart(track.id, 'start', e);
        }}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <GripVertical size={12} className="text-white/70" />
      </div>

      <div
        className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => {
          e.stopPropagation();
          onResizeStart(track.id, 'end', e);
        }}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <GripVertical size={12} className="text-white/70" />
      </div>
    </div>
  );
}

export default function RehearsalGantt() {
  const [tracks, setTracks] = useState<RehearsalTrack[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragStartDates, setDragStartDates] = useState<{ startDate: string; endDate: string } | null>(null);

  const [resizing, setResizing] = useState<{
    id: string;
    type: 'start' | 'end';
    startX: number;
    originalStart: string;
    originalEnd: string;
  } | null>(null);

  const ganttRef = useRef<HTMLDivElement>(null);
  const weekWidth = 100;
  const totalWeeks = 12;
  const rowHeight = 60;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addWeeks(base, currentWeekOffset);
  }, [currentWeekOffset]);

  const weeks = useMemo(() => {
    return Array.from({ length: totalWeeks }, (_, i) => addWeeks(weekStart, i));
  }, [weekStart]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tracksData, gigsData] = await Promise.all([
          rehearsalsApi.getAll(),
          gigsApi.getAll(),
        ]);
        setTracks(tracksData);
        setGigs(gigsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const trackId = active.id as string;
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return;

    setActiveDragId(trackId);
    setDragStartDates({ startDate: track.startDate, endDate: track.endDate });
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { active, delta } = event;
    const trackId = active.id as string;
    if (!dragStartDates) return;

    const deltaWeeks = Math.round(delta.x / weekWidth);
    const originalStartDate = parseISO(dragStartDates.startDate);
    const originalEndDate = parseISO(dragStartDates.endDate);

    const newStartDate = addWeeks(originalStartDate, deltaWeeks);
    const newEndDate = addWeeks(originalEndDate, deltaWeeks);

    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId
          ? {
              ...t,
              startDate: format(newStartDate, 'yyyy-MM-dd'),
              endDate: format(newEndDate, 'yyyy-MM-dd'),
            }
          : t
      )
    );
  };

  const persistTrack = useCallback(async (track: RehearsalTrack) => {
    try {
      await rehearsalsApi.update(track.id, {
        startDate: track.startDate,
        endDate: track.endDate,
      });

      if (track.relatedGigId) {
        const gig = gigs.find((g) => g.id === track.relatedGigId);
        if (gig) {
          await gigsApi.update(gig.id, {
            schedule: {
              ...gig.schedule,
              warmup: track.endDate,
            },
          });
        }
      }
    } catch (error) {
      console.error('Failed to update rehearsal:', error);
    }
  }, [gigs]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active } = event;
    const trackId = active.id as string;
    const track = tracks.find((t) => t.id === trackId);

    if (track) {
      await persistTrack(track);
    }

    setActiveDragId(null);
    setDragStartDates(null);
  };

  const handleResizeStart = (
    id: string,
    type: 'start' | 'end',
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    const track = tracks.find((t) => t.id === id);
    if (!track) return;

    setResizing({
      id,
      type,
      startX: e.clientX,
      originalStart: track.startDate,
      originalEnd: track.endDate,
    });
  };

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizing.startX;
      const deltaWeeks = Math.round(deltaX / weekWidth);

      const originalStartDate = parseISO(resizing.originalStart);
      const originalEndDate = parseISO(resizing.originalEnd);

      let newStartDate = originalStartDate;
      let newEndDate = originalEndDate;

      if (resizing.type === 'start') {
        newStartDate = addWeeks(originalStartDate, deltaWeeks);
        if (differenceInWeeks(newEndDate, newStartDate) < 1) {
          newStartDate = addWeeks(newEndDate, -1);
        }
      } else if (resizing.type === 'end') {
        newEndDate = addWeeks(originalEndDate, deltaWeeks);
        if (differenceInWeeks(newEndDate, newStartDate) < 1) {
          newEndDate = addWeeks(newStartDate, 1);
        }
      }

      setTracks((prev) =>
        prev.map((t) =>
          t.id === resizing.id
            ? {
                ...t,
                startDate: format(newStartDate, 'yyyy-MM-dd'),
                endDate: format(newEndDate, 'yyyy-MM-dd'),
              }
            : t
        )
      );
    };

    const handleMouseUp = async () => {
      if (!resizing) return;

      const track = tracks.find((t) => t.id === resizing.id);
      if (track) {
        await persistTrack(track);
      }

      setResizing(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, tracks, persistTrack]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="h-10 bg-white-5 rounded-xl mb-6 animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-white-5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
            排练进度追踪
          </h1>
          <p className="text-gray-400">查看和调整各曲目的排练进度</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentWeekOffset((prev) => prev - 4)}
            className="p-2 bg-white-5 hover:bg-white-10 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <span className="px-4 py-2 bg-white-5 rounded-lg text-white text-sm min-w-[150px] text-center">
            {format(weekStart, 'yyyy年M月d日', { locale: zhCN })}
          </span>
          <button
            onClick={() => setCurrentWeekOffset((prev) => prev + 4)}
            className="p-2 bg-white-5 hover:bg-white-10 rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {Object.entries(stageLabels).map(([stage, label]) => (
          <div key={stage} className="flex items-center gap-2">
            <div
              className={cn(
                'w-3 h-3 rounded-full bg-gradient-to-r',
                stageColors[stage as RehearsalStage]
              )}
            />
            <span className="text-sm text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <div className="card-glass rounded-2xl overflow-hidden">
          <div className="flex">
            <div
              className="flex-shrink-0 border-r border-theme bg-white-5"
              style={{ width: 180 }}
            >
              <div className="h-12 flex items-center px-4 border-b border-theme">
                <span className="text-sm font-medium text-gray-400">曲目</span>
              </div>
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center px-4 border-b border-white/5 last:border-0"
                  style={{ height: rowHeight }}
                >
                  <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center mr-3 flex-shrink-0">
                    <Music size={16} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">{track.name}</p>
                    <p
                      className={cn(
                        'text-xs truncate',
                        stageBgColors[track.stage],
                        stageTextColors[track.stage]
                      )}
                    >
                      {stageLabels[track.stage]}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-x-auto" ref={ganttRef}>
              <div style={{ minWidth: totalWeeks * weekWidth }}>
                <div className="flex h-12 border-b border-theme bg-white-5">
                  {weeks.map((week, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 flex flex-col items-center justify-center border-r border-white/5 last:border-0"
                      style={{ width: weekWidth }}
                    >
                      <span className="text-xs text-gray-400">
                        第 {Math.ceil((i + 1 + currentWeekOffset * -1) % 52)} 周
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(week, 'M/d', { locale: zhCN })}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="relative">
                  {tracks.map((track, index) => (
                    <div
                      key={track.id}
                      className="relative border-b border-white/5 last:border-0"
                      style={{ height: rowHeight }}
                    >
                      {weeks.map((week, i) => (
                        <div
                          key={i}
                          className={cn(
                            'absolute top-0 bottom-0 border-r border-white/5',
                            gigs.some((g) => isSameWeek(parseISO(g.date), week)) &&
                              'bg-accent/10'
                          )}
                          style={{
                            left: i * weekWidth,
                            width: weekWidth,
                          }}
                        />
                      ))}

                      <GanttBar
                        track={track}
                        weekStart={weekStart}
                        totalWeeks={totalWeeks}
                        weekWidth={weekWidth}
                        rowHeight={rowHeight}
                        onResizeStart={handleResizeStart}
                        delay={index * 50}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DndContext>

      <div className="mt-6 p-4 card-glass rounded-xl">
        <p className="text-sm text-gray-400">
          <span className="text-accent font-medium">提示：</span>
          拖拽进度条可移动整个排练周期，拖拽两端可调整开始和结束时间。
        </p>
      </div>
    </div>
  );
}
