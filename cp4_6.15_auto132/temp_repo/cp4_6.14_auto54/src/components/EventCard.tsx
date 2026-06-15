import { useState, useRef } from 'react';
import { MapPin, Clock, Pencil, Trash2 } from 'lucide-react';
import { TripEvent, TAG_COLORS } from '@/types';

interface EventCardProps {
  event: TripEvent;
  dayDate: string;
  isHighlighted?: boolean;
  isBlinking?: boolean;
  onEdit: (event: TripEvent) => void;
  onDelete: (eventId: string) => void;
  onDragStart: (eventId: string, dayDate: string) => void;
  onDragEnd: () => void;
  onDropOnCard: (draggedEventId: string, targetEventId: string, dayDate: string, position: 'before' | 'after') => void;
  allDayEvents: TripEvent[];
}

export default function EventCard({
  event,
  dayDate,
  isHighlighted = false,
  isBlinking = false,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  onDropOnCard,
  allDayEvents,
}: EventCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ eventId: event.id, dayDate })
    );
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    onDragStart(event.id, dayDate);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDropPosition(null);
    onDragEnd();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'before' : 'after';
    setDropPosition(position);
  };

  const handleDragLeave = () => {
    setDropPosition(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const draggedEventId = data.eventId;

      if (!cardRef.current || !draggedEventId) {
        setDropPosition(null);
        return;
      }

      const rect = cardRef.current.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const position = e.clientY < midY ? 'before' : 'after';

      onDropOnCard(draggedEventId, event.id, dayDate, position);
    } catch {
      // 忽略解析错误
    }

    setDropPosition(null);
  };

  const handleDelete = () => {
    if (window.confirm('确定删除此事件？')) {
      onDelete(event.id);
    }
  };

  const hasConflict = allDayEvents.some(
    (other) =>
      other.id !== event.id &&
      ((event.startTime >= other.startTime && event.startTime < other.endTime) ||
        (event.endTime > other.startTime && event.endTime <= other.endTime) ||
        (event.startTime <= other.startTime && event.endTime >= other.endTime))
  );

  return (
    <div
      ref={cardRef}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`card-base relative flex items-stretch overflow-hidden group cursor-grab active:cursor-grabbing ${
        isHighlighted ? 'highlight-pulse' : ''
      } ${isDragging ? 'drag-active' : ''}`}
    >
      {isBlinking && (
        <div
          className="blink-green-dot absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full z-10"
          style={{ backgroundColor: '#10b981', left: '-5px' }}
        />
      )}

      {dropPosition === 'before' && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5 z-20"
          style={{ backgroundColor: '#f97316' }}
        />
      )}

      {dropPosition === 'after' && (
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 z-20"
          style={{ backgroundColor: '#f97316' }}
        />
      )}

      <div className="w-20 h-20 flex-shrink-0 relative overflow-hidden" style={{ borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
        {event.locationThumbnail ? (
          <img
            src={event.locationThumbnail}
            alt={event.location}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: '#e2e8f0' }}
          >
            <MapPin size={24} className="text-slate-400" />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center p-3 min-w-0 gap-1">
        <div className="flex items-center gap-2">
          <h3
            className="font-semibold text-sm truncate flex-1"
            style={{ color: '#1e293b' }}
          >
            {event.title}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: TAG_COLORS[tag] }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 truncate">
          <MapPin size={12} className="flex-shrink-0 text-slate-400" />
          <span className="text-xs truncate" style={{ color: '#64748b' }}>
            {event.location}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Clock size={12} className="flex-shrink-0 text-slate-400" />
          <span className="text-xs" style={{ color: '#64748b' }}>
            {event.startTime} - {event.endTime}
          </span>
          {event.cost !== undefined && event.cost !== null && (
            <span className="text-xs font-medium" style={{ color: '#f97316' }}>
              ¥{event.cost}
            </span>
          )}
          {hasConflict && (
            <span className="text-xs" style={{ color: '#ef4444' }}>
              ⚠ 时间冲突
            </span>
          )}
        </div>
      </div>

      {event.notes && (
        <div
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {showTooltip && (
            <div
              className="absolute right-12 top-1/2 -translate-y-1/2 z-30 bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap"
            >
              <div className="whitespace-pre-wrap max-w-xs">{event.notes}</div>
              <div
                className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0"
                style={{
                  borderTop: '6px solid transparent',
                  borderBottom: '6px solid transparent',
                  borderLeft: '6px solid #1e293b',
                }}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col items-center justify-center gap-1 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(event)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="编辑"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
          title="删除"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
