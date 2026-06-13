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
  const lastMousePos = useRef<Point>({ x: 0, y: 0 });
  const panStart = useRef<Point>({ x: 0, y: 0 });
  const currentEventId = useRef<string>('');

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
      drawSticky(ctx, sticky, 1);
    }

    ctx.restore();
  }, [drawHistory, stickies, offset, scale]);

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
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = -e.deltaY * 0.0015;
      let newScale = scale * (1 + delta);
      newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

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
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const worldPoint = screenToWorld(e.clientX, e.clientY);

      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        setIsPanning(true);
        panStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
        return;
      }

      if (currentTool === 'sticky') {
        const stickyColors = [...STICKY_COLORS];
        const color = stickyColors[Math.floor(Math.random() * stickyColors.length)];
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
    [currentTool, offset, screenToWorld, userId, userColor, onDrawStart, onStickyCreate, stickies],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const worldPoint = screenToWorld(e.clientX, e.clientY);
      lastMousePos.current = { x: e.clientX, y: e.clientY };

      onCursorMove(worldPoint.x, worldPoint.y);

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

  const handleStickyDoubleClick = useCallback((stickyId: string, text: string) => {
    setEditingSticky(stickyId);
    setEditText(text);
  }, []);

  const finishEditing = useCallback(() => {
    if (!editingSticky) return;
    const sticky = stickies.find((s) => s.id === editingSticky);
    if (sticky) {
      onStickyUpdate({ ...sticky, text: editText });
    }
    setEditingSticky(null);
  }, [editingSticky, editText, stickies, onStickyUpdate]);

  useEffect(() => {
    if (editingSticky) {
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setEditingSticky(null);
        }
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }
  }, [editingSticky]);

  const getStickyScreenPosition = (sticky: StickyNote) => ({
    left: offset.x + sticky.x * scale,
    top: offset.y + sticky.y * scale,
    width: sticky.width * scale,
    height: sticky.height * scale,
  });

  return (
    <div ref={containerRef} className="canvas-container">
      <canvas
        ref={bgCanvasRef}
        className="canvas-layer"
        style={{
          background: 'var(--bg-canvas)',
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.05)',
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
        style={{ cursor: isPanning ? 'grabbing' : 'crosshair' }}
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
              pointerEvents: 'auto',
              cursor: draggingSticky === sticky.id ? 'grabbing' : 'grab',
            }}
          >
            {isEditing && (
              <textarea
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={finishEditing}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: sticky.color,
                  border: '2px solid #89b4fa',
                  borderRadius: 4,
                  padding: Math.max(8, 12 * scale),
                  fontSize: Math.max(10, 14 * scale),
                  fontFamily: "'Noto Sans SC', sans-serif",
                  color: '#333',
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
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
          <div className="user-cursor" style={{ background: data.color }} />
          <div className="user-label" style={{ background: data.color }}>
            {data.username}
          </div>
        </div>
      ))}
    </div>
  );
}
