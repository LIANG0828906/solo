import { useState, useRef, useCallback, useEffect } from 'react';
import { Check, Pause, Play, Trash2, ChevronDown } from 'lucide-react';
import { parseISO, differenceInDays, format } from 'date-fns';
import type { Milestone, MilestoneStatus } from '../types';
import { MILESTONE_STATUS_LABELS } from '../types';

interface MilestoneTimelineProps {
  milestones: Milestone[];
  activeMilestoneId: string | null;
  onSelectMilestone: (id: string) => void;
  onUpdateMilestone: (id: string, data: Record<string, unknown>) => void;
  onDeleteMilestone: (id: string) => void;
  onStatusChange: (id: string, status: MilestoneStatus) => void;
}

const STATUS_ICONS: Record<MilestoneStatus, React.ReactNode> = {
  planning: null,
  in_progress: <Play className="w-3 h-3" />,
  frozen: <Pause className="w-3 h-3" />,
  completed: <Check className="w-3 h-3 text-green-400" />,
};

const ALL_STATUSES: MilestoneStatus[] = ['planning', 'in_progress', 'frozen', 'completed'];

export default function MilestoneTimeline({
  milestones,
  activeMilestoneId,
  onSelectMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  onStatusChange,
}: MilestoneTimelineProps) {
  const [dropdownId, setDropdownId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const dragRef = useRef<{
    id: string;
    edge: 'left' | 'right';
    startX: number;
    origStart: string;
    origEnd: string;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dropdownId === null) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownId]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, id: string, edge: 'left' | 'right', milestone: Milestone) => {
      e.stopPropagation();
      e.preventDefault();
      dragRef.current = {
        id,
        edge,
        startX: e.clientX,
        origStart: milestone.startDate,
        origEnd: milestone.endDate,
      };
      const handleMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const pxPerDay = 40;
        const daysDelta = Math.round((ev.clientX - dragRef.current.startX) / pxPerDay);
        const orig = dragRef.current;
        if (orig.edge === 'left') {
          const newStart = parseISO(orig.origStart);
          newStart.setDate(newStart.getDate() + daysDelta);
          if (newStart < parseISO(orig.origEnd)) {
            onUpdateMilestone(id, { startDate: format(newStart, 'yyyy-MM-dd') });
          }
        } else {
          const newEnd = parseISO(orig.origEnd);
          newEnd.setDate(newEnd.getDate() + daysDelta);
          if (newEnd > parseISO(orig.origStart)) {
            onUpdateMilestone(id, { endDate: format(newEnd, 'yyyy-MM-dd') });
          }
        }
      };
      const handleUp = () => {
        dragRef.current = null;
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    },
    [onUpdateMilestone],
  );

  const sorted = [...milestones].sort(
    (a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime(),
  );

  const getDaysInfo = (m: Milestone) => {
    if (m.status === 'completed') return '已完成';
    const diff = differenceInDays(parseISO(m.endDate), new Date());
    return diff >= 0 ? `剩余 ${diff} 天` : `逾期 ${-diff} 天`;
  };

  const cardStyle = (m: Milestone) => {
    const base = 'relative h-16 rounded-xl px-3 py-2 cursor-pointer transition-all duration-200 flex flex-col justify-center min-w-[180px] group';
    const active = m.id === activeMilestoneId ? ' ring-2 ring-primary-from/50' : '';
    switch (m.status) {
      case 'planning':
        return `${base} border-2 border-dashed border-gray-500 bg-white/5${active}`;
      case 'in_progress':
        return `${base} bg-primary-gradient text-white${active}`;
      case 'frozen':
        return `${base} bg-yellow-900/30 border border-yellow-600/50${active}`;
      case 'completed':
        return `${base} bg-green-900/30 border border-green-500/50${active}`;
      default:
        return base + active;
    }
  };

  return (
    <div className="glass rounded-xl p-4 overflow-x-auto" ref={containerRef}>
      <div className="flex justify-between items-center mb-3">
        <span className="font-display text-sm gradient-text">里程碑时间轴</span>
      </div>

      <div className="relative flex gap-0" style={{ minWidth: `${Math.max(sorted.length, 1) * 180}px` }}>
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2 z-0" />

        {sorted.map((m) => (
          <div key={m.id} className="relative flex-1 flex items-center z-10 px-1">
            <div
              className={cardStyle(m)}
              onClick={() => onSelectMilestone(m.id)}
              onMouseEnter={() => setHoverId(m.id)}
              onMouseLeave={() => { setHoverId(null); if (dropdownId === m.id) setDropdownId(null); }}
            >
              {m.status === 'frozen' && (
                <div className="absolute inset-0 rounded-xl diagonal-stripes pointer-events-none" />
              )}
              {m.status === 'in_progress' && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white animate-pulse-dot" />
              )}
              {m.status === 'completed' && (
                <Check className="absolute top-1 right-1 w-3.5 h-3.5 text-green-400" />
              )}

              <div className="flex items-center gap-1.5">
                {STATUS_ICONS[m.status]}
                <span className="text-xs font-semibold truncate text-text-primary">{m.name}</span>
              </div>
              <div className="text-[10px] text-text-secondary mt-0.5">
                {format(parseISO(m.startDate), 'MM/dd')} – {format(parseISO(m.endDate), 'MM/dd')}
              </div>
              <div className="text-[10px] text-text-secondary">{getDaysInfo(m)}</div>

              {hoverId === m.id && m.status !== 'in_progress' && (
                <div
                  className="absolute bottom-0.5 right-1"
                  ref={dropdownId === m.id ? dropdownRef : undefined}
                >
                  <button
                    className="p-0.5 rounded hover:bg-white/10 text-text-secondary hover:text-text-primary"
                    onClick={(e) => { e.stopPropagation(); setDropdownId(dropdownId === m.id ? null : m.id); }}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {dropdownId === m.id && (
                    <div className="absolute bottom-full right-0 mb-1 bg-surface-dark border border-white/10 rounded-lg py-1 shadow-xl z-50 min-w-[80px]">
                      {ALL_STATUSES.map((s) => (
                        <button
                          key={s}
                          className={`w-full text-left px-2 py-1 text-[10px] hover:bg-white/10 ${s === m.status ? 'text-primary-from font-semibold' : 'text-text-primary'}`}
                          onClick={(e) => { e.stopPropagation(); onStatusChange(m.id, s); setDropdownId(null); }}
                        >
                          {MILESTONE_STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {hoverId === m.id && (
                <button
                  className="absolute bottom-0.5 right-7 p-0.5 rounded hover:bg-red-500/20 text-text-secondary hover:text-red-400"
                  onClick={(e) => { e.stopPropagation(); onDeleteMilestone(m.id); }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}

              {hoverId === m.id && (
                <>
                  <div
                    className="absolute left-0 top-0 bottom-0 w-2 milestone-handle rounded-l-xl"
                    onMouseDown={(e) => handleMouseDown(e, m.id, 'left', m)}
                  />
                  <div
                    className="absolute right-0 top-0 bottom-0 w-2 milestone-handle rounded-r-xl"
                    onMouseDown={(e) => handleMouseDown(e, m.id, 'right', m)}
                  />
                </>
              )}
            </div>
          </div>
        ))}

        {sorted.length === 0 && (
          <div className="text-text-secondary text-xs py-4 text-center w-full">暂无里程碑</div>
        )}
      </div>
    </div>
  );
}
