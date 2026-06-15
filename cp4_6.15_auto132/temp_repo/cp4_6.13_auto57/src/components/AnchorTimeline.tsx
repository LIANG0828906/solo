import { useState, useRef, useCallback } from 'react';

interface Anchor {
  id: string;
  time: number;
  params: object;
}

interface AnchorTimelineProps {
  duration: number;
  anchors: Anchor[];
  currentTime: number;
  onAddAnchor: (time: number, params: object) => void;
  onRemoveAnchor: (id: string) => void;
  onUpdateAnchor: (id: string, time: number) => void;
  onAnchorClick: (id: string) => void;
  onSeek: (time: number) => void;
  currentParams: object;
}

export default function AnchorTimeline({
  duration,
  anchors,
  currentTime,
  onAddAnchor,
  onRemoveAnchor,
  onUpdateAnchor,
  onAnchorClick,
  onSeek,
  currentParams,
}: AnchorTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredAnchor, setHoveredAnchor] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);

  const timeToX = useCallback(
    (time: number) => {
      if (duration <= 0) return 0;
      return (time / duration) * 100;
    },
    [duration]
  );

  const xToTime = useCallback(
    (clientX: number) => {
      const el = timelineRef.current;
      if (!el || duration <= 0) return 0;
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * duration;
    },
    [duration]
  );

  const handleRulerClick = useCallback(
    (e: React.MouseEvent) => {
      if (draggingId) return;
      const time = xToTime(e.clientX);
      onSeek(time);
    },
    [draggingId, xToTime, onSeek]
  );

  const handleAnchorDragStart = useCallback(
    (e: React.PointerEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      setDraggingId(id);
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    []
  );

  const handleAnchorDragMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingId) return;
      const time = xToTime(e.clientX);
      onUpdateAnchor(draggingId, Math.max(0, Math.min(duration, time)));
    },
    [draggingId, xToTime, duration, onUpdateAnchor]
  );

  const handleAnchorDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  const handleAddAnchor = useCallback(() => {
    if (anchors.length >= 5) return;
    onAddAnchor(currentTime, currentParams);
  }, [anchors.length, currentTime, currentParams, onAddAnchor]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = (t % 60).toFixed(1);
    return `${m}:${Number(s).toFixed(1).padStart(4, '0')}`;
  };

  const rulerMarks = duration > 0
    ? Array.from(
        { length: Math.ceil(duration) + 1 },
        (_, i) => i
      ).filter((s) => s <= duration)
    : [];

  const sortedAnchors = [...anchors].sort((a, b) => a.time - b.time);

  return (
    <div className="bg-card rounded-xl p-4 select-none">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-xs uppercase tracking-widest text-accent">
          Anchor Points
        </h3>
        {anchors.length < 5 && (
          <button
            onClick={handleAddAnchor}
            className="font-body text-xs px-3 py-1 rounded bg-accent/20 text-accent hover:bg-accent/30 transition-default"
          >
            + Add Anchor
          </button>
        )}
      </div>

      <div
        ref={timelineRef}
        className="relative w-full h-20 rounded-lg bg-deep-blue/50 cursor-pointer overflow-visible"
        onClick={handleRulerClick}
        onPointerMove={handleAnchorDragMove}
        onPointerUp={handleAnchorDragEnd}
      >
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="anchorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e94560" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#7b2ff7" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {sortedAnchors.map((anchor, i) => {
            if (i >= sortedAnchors.length - 1) return null;
            const next = sortedAnchors[i + 1];
            const x1 = timeToX(anchor.time);
            const x2 = timeToX(next.time);
            return (
              <rect
                key={`grad-${anchor.id}`}
                x={`${x1}%`}
                y="20"
                width={`${x2 - x1}%`}
                height="20"
                fill="url(#anchorGrad)"
                rx="2"
              />
            );
          })}
        </svg>

        <div className="absolute top-0 left-0 right-0 h-5 flex items-end">
          {rulerMarks.map((s) => (
            <div
              key={s}
              className="absolute flex flex-col items-center"
              style={{ left: `${timeToX(s)}%` }}
            >
              <div className="w-px h-2 bg-accent/30" />
              <span className="font-body text-[8px] text-accent/40 whitespace-nowrap">
                {s}s
              </span>
            </div>
          ))}
        </div>

        <div
          className="absolute top-0 bottom-0 w-0.5 bg-accent z-10 pointer-events-none"
          style={{ left: `${timeToX(currentTime)}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent" />
        </div>

        {anchors.map((anchor) => {
          const left = timeToX(anchor.time);
          const isHovered = hoveredAnchor === anchor.id;
          const isPendingRemove = pendingRemove === anchor.id;
          return (
            <div
              key={anchor.id}
              className="absolute z-20 anchor-marker"
              style={{
                left: `${left}%`,
                top: '28px',
                transform: 'translateX(-50%)',
              }}
              onPointerDown={(e) => handleAnchorDragStart(e, anchor.id)}
              onMouseEnter={() => setHoveredAnchor(anchor.id)}
              onMouseLeave={() => {
                setHoveredAnchor(null);
                setPendingRemove(null);
              }}
            >
              <div
                className="cursor-grab active:cursor-grabbing"
                onClick={(e) => {
                  e.stopPropagation();
                  onAnchorClick(anchor.id);
                }}
              >
                <svg width={14} height={12} viewBox="0 0 14 12">
                  <polygon
                    points="7,0 14,12 0,12"
                    fill="#e94560"
                    stroke="#ff6b81"
                    strokeWidth={0.5}
                  />
                </svg>
              </div>
              {(isHovered || draggingId === anchor.id) && (
                <div className="fade-in absolute top-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-auto">
                  <span className="font-body text-[10px] text-accent-hover bg-bg/90 rounded px-1.5 py-0.5 whitespace-nowrap">
                    {formatTime(anchor.time)}
                  </span>
                  {isPendingRemove ? (
                    <button
                      className="font-body text-[9px] px-1.5 py-0.5 rounded bg-red-900/80 text-red-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveAnchor(anchor.id);
                        setPendingRemove(null);
                      }}
                    >
                      Confirm
                    </button>
                  ) : (
                    <button
                      className="font-body text-[9px] px-1.5 py-0.5 rounded bg-accent/20 text-accent hover:bg-accent/40 transition-default"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingRemove(anchor.id);
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
