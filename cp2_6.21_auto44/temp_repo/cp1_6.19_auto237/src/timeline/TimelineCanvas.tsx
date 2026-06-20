import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

const YEAR_MIN = 1900;
const YEAR_MAX = 2100;
const YEAR_SPAN = YEAR_MAX - YEAR_MIN;
const PIXELS_PER_YEAR = 14;
const MINOR_TICK = 10;
const MAKER_TICK = 50;

interface TimelineCanvasProps {
  onBeaconDragEnterEvent: (eventId: string) => void;
  onBeaconDragLeaveEvent: (eventId: string) => void;
  hoveredEventId: string | null;
  onBeaconDeliveredAt: (x: number, y: number) => void;
}

const TimelineCanvas: React.FC<TimelineCanvasProps> = ({
  onBeaconDragEnterEvent,
  onBeaconDragLeaveEvent,
  hoveredEventId,
  onBeaconDeliveredAt,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ w: 800, h: 500 });
  const [scrollX, setScrollX] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [draggingScroll, setDraggingScroll] = useState(false);
  const dragScrollStart = useRef({ x: 0, scroll: 0 });
  const [activeBeaconId, setActiveBeaconId] = useState<string | null>(null);
  const beaconDragOffset = useRef({ x: 0, y: 0 });
  const draggingCanvas = useRef(false);
  const canvasDragStart = useRef({ x: 0, scroll: 0 });

  const {
    beacons,
    createBeacon,
    updateBeaconPosition,
    deliverBeacon,
    animations,
  } = useGameStore();

  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setViewport({
          w: Math.floor(e.contentRect.width),
          h: Math.floor(e.contentRect.height - 14),
        });
      }
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  const totalWidth = YEAR_SPAN * PIXELS_PER_YEAR * zoom;
  const axisY = Math.floor(viewport.h * 0.55);

  const maxScroll = Math.max(0, totalWidth - viewport.w);

  useEffect(() => {
    if (scrollX > maxScroll) setScrollX(maxScroll);
  }, [maxScroll, scrollX]);

  const yearToX = useCallback(
    (year: number) => (year - YEAR_MIN) * PIXELS_PER_YEAR * zoom - scrollX,
    [zoom, scrollX]
  );
  const xToYear = useCallback(
    (x: number) => YEAR_MIN + Math.round((x + scrollX) / (PIXELS_PER_YEAR * zoom)),
    [zoom, scrollX]
  );

  const tickCount = YEAR_SPAN / MINOR_TICK;
  const ticks = useMemo(() => {
    const arr: Array<{ year: number; major: boolean; maker: boolean; x: number }> = [];
    for (let i = 0; i <= tickCount; i++) {
      const year = YEAR_MIN + i * MINOR_TICK;
      const x = (year - YEAR_MIN) * PIXELS_PER_YEAR * zoom - scrollX;
      if (x < -60 || x > viewport.w + 60) continue;
      arr.push({
        year,
        major: year % MINOR_TICK === 0,
        maker: year % MAKER_TICK === 0,
        x,
      });
    }
    return arr;
  }, [tickCount, zoom, scrollX, viewport.w]);

  const makerYears = useMemo(() => {
    const arr: Array<{ year: number; x: number }> = [];
    for (let y = YEAR_MIN; y <= YEAR_MAX; y += MAKER_TICK) {
      const x = (y - YEAR_MIN) * PIXELS_PER_YEAR * zoom - scrollX;
      if (x < -60 || x > viewport.w + 60) continue;
      arr.push({ year: y, x });
    }
    return arr;
  }, [zoom, scrollX, viewport.w]);

  const handleWheel = (e: React.WheelEvent) => {
    if (activeBeaconId) return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.0015;
      setZoom((z) => Math.min(2, Math.max(0.5, z + delta)));
    } else {
      setScrollX((s) => Math.min(maxScroll, Math.max(0, s + e.deltaX + e.deltaY)));
    }
  };

  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingScroll(true);
    dragScrollStart.current = { x: e.clientX, scroll: scrollX };
  };

  useEffect(() => {
    if (!draggingScroll) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - dragScrollStart.current.x;
      const trackWidth = viewport.w - 24;
      const ratio = totalWidth > viewport.w ? totalWidth / trackWidth : 1;
      const newScroll = dragScrollStart.current.scroll + dx * ratio;
      setScrollX(Math.min(maxScroll, Math.max(0, newScroll)));
    };
    const onUp = () => setDraggingScroll(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [draggingScroll, viewport.w, totalWidth, maxScroll]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (activeBeaconId) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-maker]') || target.closest('[data-beacon]')) return;
    draggingCanvas.current = true;
    canvasDragStart.current = { x: e.clientX, scroll: scrollX };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (draggingCanvas.current) {
        const dx = e.clientX - canvasDragStart.current.x;
        setScrollX(Math.min(maxScroll, Math.max(0, canvasDragStart.current.scroll - dx)));
      }
    };
    const onUp = () => {
      draggingCanvas.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [maxScroll]);

  const handleMakerClick = (e: React.MouseEvent, year: number, x: number) => {
    e.stopPropagation();
    if (beacons.some((b) => b.createdAt === year && !b.isDelivered)) return;
    createBeacon(year, x, axisY);
  };

  const handleBeaconMouseDown = (e: React.MouseEvent, id: string, x: number, y: number) => {
    e.stopPropagation();
    setActiveBeaconId(id);
    const rect = wrapperRef.current!.getBoundingClientRect();
    beaconDragOffset.current = {
      x: e.clientX - rect.left - x,
      y: e.clientY - rect.top - y,
    };
    updateBeaconPosition(id, x, y, true);
  };

  useEffect(() => {
    if (!activeBeaconId) return;
    const onMove = (e: MouseEvent) => {
      const rect = wrapperRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const x = mx - beaconDragOffset.current.x;
      const y = my - beaconDragOffset.current.y;

      if (mx < -20 || mx > viewport.w + 20 || my < -20 || my > viewport.h + 20) {
        const appRect = document.body.getBoundingClientRect();
        const leftEdge = rect.left - appRect.left;
        if (mx < -20) {
          const allCards = document.querySelectorAll<HTMLElement>('[data-event-card]');
          let matched: HTMLElement | null = null;
          allCards.forEach((card) => {
            const cr = card.getBoundingClientRect();
            if (
              e.clientX >= cr.left &&
              e.clientX <= cr.right &&
              e.clientY >= cr.top &&
              e.clientY <= cr.bottom
            ) {
              matched = card;
            }
          });
          if (matched) {
            const evId = (matched as HTMLElement).getAttribute('data-event-card')!;
            if (hoveredEventId !== evId) onBeaconDragEnterEvent(evId);
          } else if (hoveredEventId) {
            onBeaconDragLeaveEvent(hoveredEventId);
          }
          void leftEdge;
        } else if (hoveredEventId) {
          onBeaconDragLeaveEvent(hoveredEventId);
        }
      } else if (hoveredEventId) {
        onBeaconDragLeaveEvent(hoveredEventId);
      }

      updateBeaconPosition(activeBeaconId, x, y, true);
    };
    const onUp = (e: MouseEvent) => {
      const dropId = activeBeaconId;
      const rect = wrapperRef.current!.getBoundingClientRect();
      const endX = e.clientX - rect.left - beaconDragOffset.current.x;
      const endY = e.clientY - rect.top - beaconDragOffset.current.y;

      const allCards = document.querySelectorAll<HTMLElement>('[data-event-card]');
      let delivered = false;
      allCards.forEach((card) => {
        const cr = card.getBoundingClientRect();
        if (
          e.clientX >= cr.left &&
          e.clientX <= cr.right &&
          e.clientY >= cr.top &&
          e.clientY <= cr.bottom
        ) {
          const evId = card.getAttribute('data-event-card')!;
          const beacon = beacons.find((b) => b.id === dropId);
          const deliveredIds = useGameStore.getState().deliveredEventIds;
          if (beacon && !deliveredIds.has(evId)) {
            deliverBeacon(dropId, evId, endX, endY);
            const bodyRect = document.body.getBoundingClientRect();
            onBeaconDeliveredAt(
              e.clientX - bodyRect.left,
              e.clientY - bodyRect.top
            );
            delivered = true;
          }
        }
      });

      if (!delivered) {
        const b = useGameStore.getState().beacons.find((bb) => bb.id === dropId);
        if (b) {
          const snapX = yearToX(b.createdAt);
          updateBeaconPosition(dropId, snapX, axisY, false);
        }
      }

      if (hoveredEventId) onBeaconDragLeaveEvent(hoveredEventId);
      setActiveBeaconId(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [
    activeBeaconId,
    viewport,
    beacons,
    hoveredEventId,
    onBeaconDragEnterEvent,
    onBeaconDragLeaveEvent,
    deliverBeacon,
    updateBeaconPosition,
    yearToX,
    axisY,
    onBeaconDeliveredAt,
  ]);

  const zoomIn = () => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)));
  const zoomReset = () => setZoom(1);

  const thumbWidth =
    totalWidth > viewport.w ? Math.max(60, (viewport.w - 24) * (viewport.w / totalWidth)) : viewport.w - 24;
  const thumbMax = viewport.w - 24 - thumbWidth;
  const thumbX =
    totalWidth > viewport.w ? (scrollX / maxScroll) * thumbMax : 0;

  const currentYearStart = xToYear(0);
  const currentYearEnd = xToYear(viewport.w);

  return (
    <>
      <div className="timeline-toolbar">
        <div className="timeline-info">
          <span className="chip">
            {currentYearStart} — {currentYearEnd}
          </span>
          <span>
            共 <b style={{ color: '#00D4FF' }}>{beacons.filter((b) => !b.isDelivered).length}</b> 个信标待投递
          </span>
        </div>
        <div className="zoom-controls">
          <button className="zoom-btn" onClick={zoomOut} title="缩小">−</button>
          <span className="zoom-label">{Math.round(zoom * 100)}%</span>
          <button className="zoom-btn" onClick={zoomIn} title="放大">+</button>
          <button className="zoom-btn" onClick={zoomReset} title="重置">⟳</button>
        </div>
      </div>
      <div className="timeline-wrapper" ref={wrapperRef} onWheel={handleWheel}>
        <div
          className="timeline-canvas"
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          style={{ cursor: draggingScroll || draggingCanvas.current ? 'grabbing' : 'grab' }}
        >
          <svg width={viewport.w} height={viewport.h} style={{ display: 'block' }}>
            <defs>
              <linearGradient id="axisGlow" x1="0" x2="1">
                <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.05" />
                <stop offset="50%" stopColor="#00D4FF" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#FD79A8" stopOpacity="0.08" />
              </linearGradient>
              <radialGradient id="makerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#00D4FF" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
              </radialGradient>
              <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect
              x={0}
              y={axisY - 26}
              width={viewport.w}
              height={52}
              fill="url(#axisGlow)"
              rx={14}
            />

            <line
              x1={0}
              y1={axisY}
              x2={viewport.w}
              y2={axisY}
              stroke="rgba(255,255,255,0.22)"
              strokeWidth={2}
            />

            {ticks.map((t) => (
              <line
                key={`tick-${t.year}`}
                x1={t.x}
                y1={axisY - (t.maker ? 14 : 8)}
                x2={t.x}
                y2={axisY + (t.maker ? 14 : 8)}
                stroke={t.maker ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)'}
                strokeWidth={t.maker ? 2 : 1}
              />
            ))}

            {ticks.map((t) => (
              t.maker ? (
                <text
                  key={`label-${t.year}`}
                  x={t.x}
                  y={axisY + 30}
                  fontSize={12}
                  fill="rgba(255,255,255,0.78)"
                  textAnchor="middle"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {t.year}
                </text>
              ) : null
            ))}

            {makerYears.map((m) => {
              const hasPending = beacons.some(
                (b) => b.createdAt === m.year && !b.isDelivered
              );
              return (
                <g
                  key={`maker-${m.year}`}
                  data-maker
                  style={{ cursor: hasPending ? 'default' : 'pointer' }}
                  onClick={(e) => handleMakerClick(e, m.year, m.x)}
                >
                  <circle
                    cx={m.x}
                    cy={axisY}
                    r={18}
                    fill="url(#makerGlow)"
                  />
                  <motion.circle
                    cx={m.x}
                    cy={axisY}
                    r={10}
                    fill="#00D4FF"
                    filter="url(#softGlow)"
                    animate={{
                      r: [10, 11.5, 10],
                      opacity: [0.95, 0.75, 0.95],
                    }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </g>
              );
            })}
          </svg>

          {beacons.map((b) => {
            if (b.isDelivered) return null;
            const snapped = !b.isDragging
              ? { x: yearToX(b.createdAt), y: axisY }
              : { x: b.x, y: b.y };
            const isActive = activeBeaconId === b.id;
            return (
              <motion.div
                key={b.id}
                data-beacon
                onMouseDown={(e) => handleBeaconMouseDown(e, b.id, snapped.x, snapped.y)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  x: snapped.x - 10,
                  y: snapped.y - 10,
                  scale: 1,
                  opacity: 1,
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 420,
                  damping: 22,
                }}
                style={{
                  position: 'absolute',
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 30% 30%, #ffffffcc, ${b.color} 60%, ${b.color}aa)`,
                  boxShadow: `0 0 14px ${b.color}cc, 0 0 24px ${b.color}66`,
                  cursor: isActive ? 'grabbing' : 'grab',
                  zIndex: isActive ? 50 : 20,
                  border: `2px solid ${b.color}`,
                }}
                whileHover={{ scale: 1.18 }}
              />
            );
          })}

          <AnimatePresence>
            {animations.map((a) => (
              <motion.div
                key={a.id}
                initial={{ width: 0, height: 0, x: a.x, y: a.y, opacity: 0.8 }}
                animate={{
                  width: 100,
                  height: 100,
                  x: a.x - 50,
                  y: a.y - 50,
                  opacity: 0,
                  borderWidth: 3,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  border: `2px solid ${a.color}`,
                  borderRadius: '50%',
                  pointerEvents: 'none',
                  zIndex: 99,
                  boxShadow: `0 0 18px ${a.color}`,
                }}
              />
            ))}
          </AnimatePresence>
        </div>

        <div className="timeline-scroll">
          <div
            className="timeline-scroll-track"
            onClick={(e) => {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              setScrollX(Math.min(maxScroll, Math.max(0, ratio * maxScroll)));
            }}
          >
            <div
              className="timeline-scroll-thumb"
              onMouseDown={handleThumbMouseDown}
              style={{
                width: thumbWidth,
                transform: `translateX(${thumbX}px)`,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default TimelineCanvas;
