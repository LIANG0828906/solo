import { useEffect, useRef, useState, useMemo } from 'react';
import { TimelineEvent, categoryColors } from '../utils/storage';
import type { ViewMode } from '../App';

interface Props {
  events: TimelineEvent[];
  viewMode: ViewMode;
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
  scale: number;
  startX: number;
  startY: number;
  startScale: number;
  targetX: number;
  targetY: number;
  targetScale: number;
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function getDateRange(events: TimelineEvent[], mode: ViewMode): { start: Date; end: Date } {
  let minDate: Date;
  let maxDate: Date;

  if (events.length === 0) {
    const now = new Date();
    minDate = new Date(now);
    maxDate = new Date(now);
  } else {
    const dates = events.map((e) => new Date(e.date));
    minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
  }

  const now = new Date();
  if (now < minDate) minDate = new Date(now);
  if (now > maxDate) maxDate = new Date(now);

  if (mode === 'month') {
    const pad = 45 * 24 * 60 * 60 * 1000;
    minDate = new Date(minDate.getTime() - pad);
    maxDate = new Date(maxDate.getTime() + pad);
  } else if (mode === 'year') {
    const pad = 180 * 24 * 60 * 60 * 1000;
    minDate = new Date(minDate.getTime() - pad);
    maxDate = new Date(maxDate.getTime() + pad);
  } else {
    const pad = 365 * 3 * 24 * 60 * 60 * 1000;
    minDate = new Date(minDate.getTime() - pad);
    maxDate = new Date(maxDate.getTime() + pad);
  }

  return { start: minDate, end: maxDate };
}

function getTicks(start: Date, end: Date, mode: ViewMode): { date: Date; label: string; major: boolean }[] {
  const ticks: { date: Date; label: string; major: boolean }[] = [];
  const current = new Date(start);

  if (mode === 'month') {
    current.setDate(1);
    while (current <= end) {
      ticks.push({
        date: new Date(current),
        label: `${current.getFullYear()}.${String(current.getMonth() + 1).padStart(2, '0')}`,
        major: true,
      });
      const mid = new Date(current);
      mid.setDate(15);
      if (mid >= start && mid <= end) {
        ticks.push({
          date: mid,
          label: '15',
          major: false,
        });
      }
      current.setMonth(current.getMonth() + 1);
    }
  } else if (mode === 'year') {
    current.setMonth(0, 1);
    while (current <= end) {
      ticks.push({
        date: new Date(current),
        label: `${current.getFullYear()}`,
        major: true,
      });
      for (let m = 3; m <= 9; m += 3) {
        const q = new Date(current);
        q.setMonth(m, 1);
        if (q >= start && q <= end) {
          ticks.push({
            date: q,
            label: `Q${Math.floor(m / 3) + 1}`,
            major: false,
          });
        }
      }
      current.setFullYear(current.getFullYear() + 1);
    }
  } else {
    const startDecade = Math.floor(start.getFullYear() / 10) * 10;
    current.setFullYear(startDecade, 0, 1);
    while (current <= end) {
      ticks.push({
        date: new Date(current),
        label: `${current.getFullYear()}s`,
        major: true,
      });
      for (let y = 2; y <= 8; y += 2) {
        const yd = new Date(current);
        yd.setFullYear(yd.getFullYear() + y);
        if (yd >= start && yd <= end) {
          ticks.push({
            date: yd,
            label: `'${String(yd.getFullYear()).slice(-2)}`,
            major: false,
          });
        }
      }
      current.setFullYear(current.getFullYear() + 10);
    }
  }

  return ticks;
}

export default function TimelineCanvas({ events, viewMode, selectedEventId, onSelectEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Map<string, NodePosition>>(new Map());
  const animStartRef = useRef<number>(0);
  const animDurationRef = useRef<number>(500);
  const animTypeRef = useRef<'nodes' | 'scale'>('nodes');
  const scrollXRef = useRef<number>(0);
  const targetScrollXRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartScrollRef = useRef<number>(0);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const prevEventsRef = useRef<string>('');
  const prevModeRef = useRef<ViewMode>(viewMode);
  const dprRef = useRef<number>(1);

  const dateRange = useMemo(() => getDateRange(events, viewMode), [events, viewMode]);

  useEffect(() => {
    if (prevModeRef.current !== viewMode) {
      animTypeRef.current = 'scale';
      animStartRef.current = performance.now();
      animDurationRef.current = 400;
      prevModeRef.current = viewMode;
    }
  }, [viewMode]);

  useEffect(() => {
    const eventsKey = events.map((e) => `${e.id}-${e.date}`).join('|');
    if (prevEventsRef.current !== eventsKey) {
      const prevIds = new Set(prevEventsRef.current.split('|').filter(Boolean).map((s) => s.split('-')[0]));
      const hasNewEvent = events.some((e) => !prevIds.has(e.id));
      animTypeRef.current = 'nodes';
      animStartRef.current = performance.now();
      animDurationRef.current = hasNewEvent ? 300 : 500;
      prevEventsRef.current = eventsKey;
    }
  }, [events]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let lastTime = performance.now();

    const getXForDate = (date: Date, start: Date, end: Date, width: number, padding: number): number => {
      const total = end.getTime() - start.getTime();
      if (total <= 0) return padding;
      const pos = (date.getTime() - start.getTime()) / total;
      return padding + pos * (width - padding * 2);
    };

    const draw = (time: number) => {
      const dpr = dprRef.current;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const padding = 60;
      const axisY = h / 2;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#F3F4F6';
      ctx.fillRect(0, 0, w, h);

      let animProgress = 1;
      if (time - animStartRef.current < animDurationRef.current) {
        animProgress = (time - animStartRef.current) / animDurationRef.current;
        animProgress = animTypeRef.current === 'scale' ? easeInOut(animProgress) : easeOut(animProgress);
      }

      const scrollDiff = targetScrollXRef.current - scrollXRef.current;
      if (Math.abs(scrollDiff) > 0.5) {
        scrollXRef.current += scrollDiff * Math.min(1, (time - lastTime) / 200);
      } else {
        scrollXRef.current = targetScrollXRef.current;
      }

      ctx.save();
      ctx.translate(-scrollXRef.current, 0);

      const { start, end } = dateRange;
      const ticks = getTicks(start, end, viewMode);
      const contentWidth = Math.max(w, (ticks.length || 20) * 60);

      ctx.beginPath();
      ctx.moveTo(padding, axisY);
      ctx.lineTo(contentWidth - padding, axisY);
      ctx.strokeStyle = '#9CA3AF';
      ctx.lineWidth = 2;
      ctx.stroke();

      ticks.forEach((tick) => {
        const x = getXForDate(tick.date, start, end, contentWidth, padding);
        const tickHeight = tick.major ? 16 : 8;

        ctx.beginPath();
        ctx.moveTo(x, axisY - tickHeight / 2);
        ctx.lineTo(x, axisY + tickHeight / 2);
        ctx.strokeStyle = tick.major ? '#9CA3AF' : '#CBD5E1';
        ctx.lineWidth = tick.major ? 2 : 1;
        ctx.stroke();

        ctx.font = tick.major ? 'bold 12px -apple-system, sans-serif' : '11px -apple-system, sans-serif';
        ctx.fillStyle = tick.major ? '#475569' : '#94A3B8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(tick.label, x, axisY + tickHeight / 2 + 6);
      });

      const now = new Date();
      const nowX = getXForDate(now, start, end, contentWidth, padding);
      if (nowX >= padding && nowX <= contentWidth - padding) {
        ctx.save();
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(nowX, 40);
        ctx.lineTo(nowX, h - 40);
        ctx.strokeStyle = '#6366F1';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        ctx.font = '11px -apple-system, sans-serif';
        ctx.fillStyle = '#6366F1';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('现在', nowX, 32);
      }

      const currentIds = new Set(events.map((e) => e.id));
      nodesRef.current.forEach((_, id) => {
        if (!currentIds.has(id)) {
          nodesRef.current.delete(id);
        }
      });

      events.forEach((event, index) => {
        const date = new Date(event.date);
        const targetX = getXForDate(date, start, end, contentWidth, padding);
        const verticalOffset = (index % 2 === 0 ? -1 : 1) * 60;
        const targetY = axisY + verticalOffset;

        let node = nodesRef.current.get(event.id);
        if (!node) {
          node = {
            id: event.id,
            x: targetX,
            y: axisY,
            targetX,
            targetY,
            scale: 0,
            targetScale: 1,
          };
          nodesRef.current.set(event.id, node);
        }

        if (node.targetX !== targetX || node.targetY !== targetY) {
          node.x = node.x;
          node.y = node.y;
          node.targetX = targetX;
          node.targetY = targetY;
        }

        const isSelected = event.id === selectedEventId;
        const isHovered = event.id === hoveredEventId;
        const targetNodeScale = isSelected ? 1.33 : isHovered ? 1.1 : 1;
        node.targetScale = targetNodeScale;

        if (animProgress < 1) {
          node.x = node.x + (node.targetX - node.x) * animProgress;
          node.y = node.y + (node.targetY - node.y) * animProgress;
          node.scale = node.scale + (node.targetScale - node.scale) * animProgress;
        } else {
          node.x = node.targetX;
          node.y = node.targetY;
          node.scale = node.targetScale;
        }

        const color = categoryColors[event.category];
        const displayScale = node.scale;
        const radius = 12 * displayScale;

        ctx.beginPath();
        ctx.moveTo(node.x, axisY);
        ctx.lineTo(node.x, node.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;

        if (isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = color + '22';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#1D4ED8' : color;
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.font = 'bold 12px -apple-system, sans-serif';
        ctx.fillStyle = '#1E293B';
        ctx.textAlign = 'center';
        ctx.textBaseline = node.y < axisY ? 'bottom' : 'top';
        const labelY = node.y < axisY ? node.y - radius - 8 : node.y + radius + 8;

        let displayName = event.name;
        ctx.save();
        ctx.beginPath();
        ctx.rect(node.x - 80, labelY - 20, 160, 24);
        ctx.clip();
        ctx.fillText(displayName, node.x, labelY);
        ctx.restore();

        ctx.font = '10px -apple-system, sans-serif';
        ctx.fillStyle = '#64748B';
        ctx.textBaseline = node.y < axisY ? 'bottom' : 'top';
        const dateY = node.y < axisY ? labelY - 16 : labelY + 14;
        ctx.fillText(event.date, node.x, dateY);
      });

      ctx.restore();

      lastTime = time;
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(rafId);
  }, [events, viewMode, selectedEventId, hoveredEventId, dateRange]);

  const getEventAt = (clientX: number, clientY: number): TimelineEvent | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left + scrollXRef.current;
    const y = clientY - rect.top;

    for (let i = events.length - 1; i >= 0; i--) {
      const node = nodesRef.current.get(events[i].id);
      if (!node) continue;
      const dx = x - node.x;
      const dy = y - node.y;
      const r = 12 * node.scale + 4;
      if (dx * dx + dy * dy <= r * r) {
        return events[i];
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const event = getEventAt(e.clientX, e.clientY);
    if (event) {
      onSelectEvent(event.id === selectedEventId ? null : event.id);
    } else {
      isDraggingRef.current = true;
      dragStartXRef.current = e.clientX;
      dragStartScrollRef.current = scrollXRef.current;
      onSelectEvent(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      const dx = dragStartXRef.current - e.clientX;
      targetScrollXRef.current = Math.max(0, dragStartScrollRef.current + dx);
    } else {
      const event = getEventAt(e.clientX, e.clientY);
      setHoveredEventId(event ? event.id : null);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    setHoveredEventId(null);
  };

  const canvasWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        cursor: isDraggingRef.current ? 'grabbing' : hoveredEventId ? 'pointer' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        id="timeline-canvas"
        ref={canvasRef}
        width={canvasWidth}
        height={500}
        style={{ display: 'block' }}
      />
      {selectedEventId && (() => {
        const event = events.find((e) => e.id === selectedEventId);
        if (!event) return null;
        const node = nodesRef.current.get(event.id);
        const x = (node?.x || 0) - scrollXRef.current;
        const y = node?.y || 0;
        const isTop = y < (typeof window !== 'undefined' ? window.innerHeight * 0.35 : 300);
        const color = categoryColors[event.category];

        return (
          <div
            style={{
              position: 'absolute',
              left: Math.max(16, Math.min(x - 160, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 336)),
              top: isTop ? y + 30 : y - 220,
              width: 320,
              background: '#FFFFFF',
              borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              padding: 16,
              zIndex: 15,
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: color,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color,
                  textTransform: 'uppercase' as const,
                  letterSpacing: 0.5,
                }}
              >
                {event.category === 'milestone' ? '里程碑' : event.category === 'task' ? '任务' : '纪念日'}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748B' }}>{event.date}</span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1E293B', marginBottom: 8 }}>{event.name}</h3>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0, marginBottom: 12 }}>
              {event.description}
            </p>
            {event.imageUrl && (
              <img
                src={event.imageUrl}
                alt={event.name}
                style={{
                  width: '100%',
                  height: 140,
                  objectFit: 'cover',
                  borderRadius: 8,
                  display: 'block',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>
        );
      })()}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
