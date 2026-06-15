import { useRef, useEffect, useState, useCallback } from 'react';
import type { ToolType, Point, DrawStyle, DrawEvent, StickyNote } from '../utils/drawEngine';
import {
  drawEvent,
  drawSticky,
  getLineWidth,
  generateId,
  STICKY_COLORS,
} from '../utils/drawEngine';

interface CanvasProps {
  currentTool: ToolType;
  userColor: string;
  userId: string;
  username: string;
  drawHistory: DrawEvent[];
  stickies: StickyNote[];
  remoteCursors: Map<string, { x: number; y: number; username: string; color: string }>;
  onDrawStart: (event: DrawEvent) => void;
  onDrawMove: (event: DrawEvent) => void;
  onDrawEnd: (event: DrawEvent) => void;
  onStickyCreate: (sticky: StickyNote) => void;
  onStickyUpdate: (sticky: StickyNote) => void;
  onCursorMove: (x: number, y: number) => void;
  scale: number;
  offset: Point;
  onScaleChange: (scale: number, offset: Point) => void;
  onOffsetChange: (offset: Point) => void;
}

const MIN_SCALE = 0.2;
const MAX_SCALE = 5;

export default function Canvas({
  currentTool,
  userColor,
  userId,
  username,
  drawHistory,
  stickies,
  remoteCursors,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
  onStickyCreate,
  onStickyUpdate,
  onCursorMove,
  scale,
  offset,
  onScaleChange,
  onOffsetChange,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [draggingSticky, setDraggingSticky] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [editingSticky, setEditingSticky] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const panStart = useRef<Point>({ x: 0, y: 0 });
  const currentEventId = useRef<string>('');
  const cursorThrottle = useRef<number>(0);

  const screenToWorld = useCallback(
    (screenX: number, screenY: number): Point => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (screenX - rect.left - offset.x) / scale,
        y: (screenY - rect.top - offset.y) / scale,
      };
    },
    [offset, scale],
  );

  const redrawAll = useCallback(() => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    const ctx = bgCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    for (const event of drawHistory) {
      drawEvent(ctx, event);
    }

    for (const sticky of stickies) {
      if (editingSticky !== sticky.id) {
        drawSticky(ctx, sticky, 1);
      }
    }

    ctx.restore();
  }, [drawHistory, stickies, offset, scale, editingSticky]);

  const redrawPreview = useCallback(() => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas) return;
    const ctx = previewCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    if (currentPoints.length > 0 && isDrawing) {
      ctx.save();
      ctx.translate(offset.x, offset.y);
      ctx.scale(scale, scale);

      const style: DrawStyle = {
        color: userColor,
        lineWidth: getLineWidth(currentTool),
      };

      const previewEvent: DrawEvent = {
        id: 'preview',
        userId,
        tool: currentTool,
        points: currentPoints,
        style,
        timestamp: Date.now(),
      };

      drawEvent(ctx, previewEvent);
      ctx.restore();
    }
  }, [currentPoints, isDrawing, offset, scale, userColor, currentTool, userId]);

  useEffect(() => {
    const canvas = bgCanvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !previewCanvas || !drawCanvas || !container) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      for (const c of [canvas, previewCanvas, drawCanvas]) {
        c.width = width * dpr;
        c.height = height * dpr;
        c.style.width = `${width}px`;
        c.style.height = `${height}px`;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
      }

      redrawAll();
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [redrawAll]);

  useEffect(() => {
    redrawAll();
  }, [redrawAll]);

  useEffect(() => {
    redrawPreview();
  }, [redrawPreview]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!e || !e.preventDefault) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const rawDelta = e.deltaY !== 0 ? e.deltaY : (e.deltaX !== 0 ? e.deltaX : 0);
      if (rawDelta === 0) return;

      const deltaFactor = e.ctrlKey ? 0.002 : 0.0015;
      const delta = -rawDelta * deltaFactor;
      let newScale = scale * (1 + delta);

      newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));

      if (newScale === scale) return;

      const scaleRatio = newScale / scale;
      const newOffsetX = mouseX - (mouseX - offset.x) * scaleRatio;
      const newOffsetY = mouseY - (mouseY - offset.y) * scaleRatio;

      onScaleChange(newScale, { x: newOffsetX, y: newOffsetY });
    },
    [scale, offset, onScaleChange],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const opts: AddEventListenerOptions = { passive: false, capture: false };
    container.addEventListener('wheel', handleWheel, opts);

    const preventDefault = (ev: WheelEvent) => {
      if (container.contains(ev.target as Node)) {
        ev.preventDefault();
      }
    };
    document.addEventListener('wheel', preventDefault, opts);

    return () => {
      container.removeEventListener('wheel', handleWheel, opts);
      document.removeEventListener('wheel', preventDefault, opts);
    };
  }, [handleWheel]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.shiftKey) || e.button === 2) {
        e.preventDefault();
        setIsPanning(true);
        panStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
        return;
      }

      const worldPoint = screenToWorld(e.clientX, e.clientY);

      if (currentTool === 'sticky') {
        const color = STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)];
        const newSticky: StickyNote = {
          id: generateId(),
          userId,
          x: worldPoint.x - 80,
          y: worldPoint.y - 50,
          width: 160,
          height: 120,
          text: '',
          color,
        };
        onStickyCreate(newSticky);
        setEditingSticky(newSticky.id);
        setEditText('');
        return;
      }

      if (editingSticky) {
        finishEditingInternal();
      }

      const hitSticky = [...stickies].reverse().find(
        (s) =>
          worldPoint.x >= s.x &&
          worldPoint.x <= s.x + s.width &&
          worldPoint.y >= s.y &&
          worldPoint.y <= s.y + s.height,
      );

      if (hitSticky) {
        setDraggingSticky(hitSticky.id);
        setDragOffset({ x: worldPoint.x - hitSticky.x, y: worldPoint.y - hitSticky.y });
        return;
      }

      if (e.button !== 0) return;

      setIsDrawing(true);
      currentEventId.current = generateId();
      const points = [worldPoint];
      setCurrentPoints(points);

      const style: DrawStyle = {
        color: userColor,
        lineWidth: getLineWidth(currentTool),
      };

      onDrawStart({
        id: currentEventId.current,
        userId,
        tool: currentTool,
        points,
        style,
        timestamp: Date.now(),
      });
    },
    [currentTool, offset, screenToWorld, userId, userColor, onDrawStart, onStickyCreate, stickies, editingSticky],
  );

  const finishEditingInternal = useCallback(() => {
    if (!editingSticky) return;
    const sticky = stickies.find((s) => s.id === editingSticky);
    if (sticky) {
      onStickyUpdate({ ...sticky, text: editText });
    }
    setEditingSticky(null);
  }, [editingSticky, editText, stickies, onStickyUpdate]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const worldPoint = screenToWorld(e.clientX, e.clientY);

      const now = performance.now();
      if (now - cursorThrottle.current > 30) {
        cursorThrottle.current = now;
        onCursorMove(worldPoint.x, worldPoint.y);
      }

      if (isPanning) {
        const newOffset = {
          x: e.clientX - panStart.current.x,
          y: e.clientY - panStart.current.y,
        };
        onOffsetChange(newOffset);
        return;
      }

      if (draggingSticky) {
        const sticky = stickies.find((s) => s.id === draggingSticky);
        if (sticky) {
          const updated = {
            ...sticky,
            x: worldPoint.x - dragOffset.x,
            y: worldPoint.y - dragOffset.y,
          };
          onStickyUpdate(updated);
        }
        return;
      }

      if (!isDrawing) return;

      const newPoints = [...currentPoints, worldPoint];
      setCurrentPoints(newPoints);

      const style: DrawStyle = {
        color: userColor,
        lineWidth: getLineWidth(currentTool),
      };

      onDrawMove({
        id: currentEventId.current,
        userId,
        tool: currentTool,
        points: newPoints,
        style,
        timestamp: Date.now(),
      });
    },
    [
      isDrawing,
      isPanning,
      draggingSticky,
      dragOffset,
      currentPoints,
      currentTool,
      userId,
      userColor,
      screenToWorld,
      onCursorMove,
      onDrawMove,
      onOffsetChange,
      onStickyUpdate,
      stickies,
    ],
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (draggingSticky) {
      setDraggingSticky(null);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    const style: DrawStyle = {
      color: userColor,
      lineWidth: getLineWidth(currentTool),
    };

    onDrawEnd({
      id: currentEventId.current,
      userId,
      tool: currentTool,
      points: currentPoints,
      style,
      timestamp: Date.now(),
    });

    setCurrentPoints([]);
  }, [isDrawing, isPanning, draggingSticky, currentPoints, currentTool, userId, userColor, onDrawEnd]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const handleStickyDoubleClick = useCallback((stickyId: string, text: string) => {
    setEditingSticky(stickyId);
    setEditText(text);
  }, []);

  const finishEditing = useCallback(() => {
    finishEditingInternal();
  }, [finishEditingInternal]);

  useEffect(() => {
    if (editingSticky) {
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setEditingSticky(null);
        }
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          finishEditingInternal();
        }
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }
  }, [editingSticky, finishEditingInternal]);

  const getStickyScreenPosition = (sticky: StickyNote) => ({
    left: offset.x + sticky.x * scale,
    top: offset.y + sticky.y * scale,
    width: sticky.width * scale,
    height: sticky.height * scale,
  });

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      onContextMenu={handleContextMenu}
    >
      <canvas
        ref={bgCanvasRef}
        className="canvas-layer"
        style={{
          background: 'var(--bg-canvas)',
        }}
      />
      <canvas ref={drawCanvasRef} className="canvas-layer" style={{ pointerEvents: 'none' }} />
      <canvas
        ref={previewCanvasRef}
        className="canvas-layer"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: isPanning
            ? 'grabbing'
            : currentTool === 'sticky'
            ? 'copy'
            : draggingSticky
            ? 'grabbing'
            : 'crosshair',
        }}
      />

      {stickies.map((sticky) => {
        const pos = getStickyScreenPosition(sticky);
        const isEditing = editingSticky === sticky.id;
        return (
          <div
            key={sticky.id}
            onDoubleClick={() => handleStickyDoubleClick(sticky.id, sticky.text)}
            style={{
              position: 'absolute',
              left: pos.left,
              top: pos.top,
              width: pos.width,
              height: pos.height,
              pointerEvents: isEditing ? 'auto' : 'auto',
              cursor: isEditing ? 'text' : draggingSticky === sticky.id ? 'grabbing' : 'grab',
              zIndex: 5,
            }}
          >
            {isEditing && (
              <textarea
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={finishEditing}
                placeholder="输入文字..."
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: sticky.color,
                  border: '2px solid #89b4fa',
                  borderRadius: Math.max(3, 4 * scale),
                  padding: Math.max(8, 12 * scale),
                  fontSize: Math.max(10, 14 * scale),
                  lineHeight: 1.6,
                  fontFamily: "'Noto Sans SC', sans-serif",
                  color: '#2d2d2d',
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                }}
              />
            )}
          </div>
        );
      })}

      {Array.from(remoteCursors.entries()).map(([id, data]) => (
        <div
          key={id}
          className="user-indicator"
          style={{
            left: offset.x + data.x * scale,
            top: offset.y + data.y * scale,
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              transform: 'translate(-2px, -2px)',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            }}
          >
            <path
              d="M2 2 L2 20 L8 15 L12 22 L15 21 L11 14 L19 14 Z"
              fill={data.color}
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: 18,
              left: 14,
              fontSize: Math.max(9, 11),
              padding: '2px 6px',
              borderRadius: 4,
              background: data.color,
              color: '#fff',
              whiteSpace: 'nowrap',
              fontFamily: "'Noto Sans SC', sans-serif",
              fontWeight: 500,
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}
          >
            {data.username}
          </div>
        </div>
      ))}
    </div>
  );
}
