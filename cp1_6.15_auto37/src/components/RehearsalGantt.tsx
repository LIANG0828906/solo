import { useState, useEffect, useRef, useMemo } from 'react';
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

interface GanttBarProps {
  track: RehearsalTrack;
  weekStart: Date;
  totalWeeks: number;
  weekWidth: number;
  rowHeight: number;
  onDragStart: (id: string, type: 'start' | 'end' | 'move', e: React.MouseEvent) => void;
  delay: number;
}

function GanttBar({
  track,
  weekStart,
  totalWeeks,
  weekWidth,
  rowHeight,
  onDragStart,
  delay,
}: GanttBarProps) {
  const startDate = parseISO(track.startDate);
  const endDate = parseISO(track.endDate);

  const startOffset = differenceInWeeks(startDate, weekStart) * weekWidth;
  const durationWeeks = Math.max(1, differenceInWeeks(endDate, startDate) + 1);
  const width = durationWeeks * weekWidth - 8;

  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 h-[calc(100%-16px)] rounded-lg overflow-hidden group opacity-0 animate-fade-in-up"
      style={{
        left: startOffset + 4,
        width,
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards',
      }}
    >
      <div
        className={cn(
          'w-full h-full rounded-lg bg-gradient-to-r',
          stageColors[track.stage],
          'cursor-pointer transition-all duration-200',
          'hover:shadow-lg hover:shadow-[#e94560]/20 hover:scale-[1.02]',
          'flex items-center px-3'
        )}
        onMouseDown={(e) => onDragStart(track.id, 'move', e)}
      >
        <span className="text-white text-sm font-medium truncate">
          {track.name}
        </span>
      </div>

      <div
        className="absolute left-0 top-0 bottom-0 w-4 cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => {
          e.stopPropagation();
          onDragStart(track.id, 'start', e);
        }}
      >
        <GripVertical size={12} className="text-white/70" />
      </div>

      <div
        className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => {
          e.stopPropagation();
          onDragStart(track.id, 'end', e);
        }}
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
  const [dragging, setDragging] = useState<{
    id: string;
    type: 'start' | 'end' | 'move';
    startX: number;
    originalStart: string;
    originalEnd: string;
  } | null>(null);

  const ganttRef = useRef<HTMLDivElement>(null);
  const weekWidth = 100;
  const totalWeeks = 12;
  const rowHeight = 60;

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

  const handleDragStart = (
    id: string,
    type: 'start' | 'end' | 'move',
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    const track = tracks.find((t) => t.id === id);
    if (!track) return;

    setDragging({
      id,
      type,
      startX: e.clientX,
      originalStart: track.startDate,
      originalEnd: track.endDate,
    });
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = async (e: MouseEvent) => {
      const deltaX = e.clientX - dragging.startX;
      const deltaWeeks = Math.round(deltaX / weekWidth);

      const originalStartDate = parseISO(dragging.originalStart);
      const originalEndDate = parseISO(dragging.originalEnd);

      let newStartDate = originalStartDate;
      let newEndDate = originalEndDate;

      if (dragging.type === 'start') {
        newStartDate = addWeeks(originalStartDate, deltaWeeks);
        if (differenceInWeeks(newEndDate, newStartDate) < 1) {
          newStartDate = addWeeks(newEndDate, -1);
        }
      } else if (dragging.type === 'end') {
        newEndDate = addWeeks(originalEndDate, deltaWeeks);
        if (differenceInWeeks(newEndDate, newStartDate) < 1) {
          newEndDate = addWeeks(newStartDate, 1);
        }
      } else if (dragging.type === 'move') {
        newStartDate = addWeeks(originalStartDate, deltaWeeks);
        newEndDate = addWeeks(originalEndDate, deltaWeeks);
      }

      setTracks((prev) =>
        prev.map((t) =>
          t.id === dragging.id
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
      if (!dragging) return;

      const track = tracks.find((t) => t.id === dragging.id);
      if (track) {
        try {
          await rehearsalsApi.update(track.id, {
            startDate: track.startDate,
            endDate: track.endDate,
          });

          if (track.relatedGigId) {
            console.log('Syncing with gig:', track.relatedGigId);
          }
        } catch (error) {
          console.error('Failed to update rehearsal:', error);
        }
      }

      setDragging(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, tracks]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="h-10 bg-white/5 rounded-xl mb-6 animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
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
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <span className="px-4 py-2 bg-white/5 rounded-lg text-white text-sm min-w-[150px] text-center">
            {format(weekStart, 'yyyy年M月d日', { locale: zhCN })}
          </span>
          <button
            onClick={() => setCurrentWeekOffset((prev) => prev + 4)}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
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

      <div className="card-glass rounded-2xl overflow-hidden">
        <div className="flex">
          <div
            className="flex-shrink-0 border-r border-white/10 bg-white/5"
            style={{ width: 180 }}
          >
            <div className="h-12 flex items-center px-4 border-b border-white/10">
              <span className="text-sm font-medium text-gray-400">曲目</span>
            </div>
            {tracks.map((track, index) => (
              <div
                key={track.id}
                className="flex items-center px-4 border-b border-white/5 last:border-0"
                style={{ height: rowHeight }}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e94560] to-[#0f3460] flex items-center justify-center mr-3 flex-shrink-0">
                  <Music size={16} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">{track.name}</p>
                  <p
                    className={cn(
                      'text-xs truncate',
                      stageBgColors[track.stage],
                      track.stage === 'not-started' && 'text-gray-400',
                      track.stage === 'first-ensemble' && 'text-blue-400',
                      track.stage === 'polishing' && 'text-purple-400',
                      track.stage === 'mature' && 'text-green-400'
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
              <div className="flex h-12 border-b border-white/10 bg-white/5">
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
                            'bg-[#e94560]/10'
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
                      onDragStart={handleDragStart}
                      delay={index * 50}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 card-glass rounded-xl">
        <p className="text-sm text-gray-400">
          <span className="text-[#e94560] font-medium">提示：</span>
          拖拽进度条可移动整个排练周期，拖拽两端可调整开始和结束时间。
        </p>
      </div>
    </div>
  );
}
