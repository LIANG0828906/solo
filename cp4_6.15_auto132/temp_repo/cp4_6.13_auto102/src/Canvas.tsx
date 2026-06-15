import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  useImperativeHandle,
  forwardRef,
  useMemo,
} from 'react';
import {
  Shape,
  ToolType,
  Point,
  PenShape,
  RectangleShape,
  CircleShape,
  LineShape,
  TextShape,
  UserInfo,
  DirtyRect,
} from './types';
import { v4 as uuidv4 } from 'uuid';

export interface CanvasHandle {
  undo?: () => void;
  redo?: () => void;
}

interface CanvasProps {
  shapes: Shape[];
  tool: ToolType;
  color: string;
  thickness: number;
  userId: string;
  remoteCursors: Map<string, { position: Point | null; color: string }>;
  onlineUsers: UserInfo[];
  onShapeComplete: (shape: Shape) => void;
  onShapeInProgress?: (shape: Shape) => void;
  onCursorMove: (position: Point | null) => void;
  version: number;
}

const DIRTY_MARGIN = 8;
const LARGE_DATASET_THRESHOLD = 500;

export const Canvas = forwardRef<CanvasHandle, CanvasProps>(function Canvas(
  props,
  ref,
) {
  const {
    shapes,
    tool,
    color,
    thickness,
    userId,
    remoteCursors,
    onlineUsers,
    onShapeComplete,
    onShapeInProgress,
    onCursorMove,
    version,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [textInput, setTextInput] = useState({
    visible: false,
    x: 0,
    y: 0,
    value: '',
  });
  const textInputRef = useRef<HTMLInputElement>(null);

  const dirtyRectRef = useRef<DirtyRect | null>(null);
  const prevShapeIdsRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);
  const shapesRef = useRef<Shape[]>([]);

  const visibleShapes = useMemo(() => {
    const erased = new Set<string>();
    for (const s of shapes) {
      if (s.type === 'eraser') {
        for (const id of s.erasedIds) {
          erased.add(id);
        }
      }
    }
    shapesRef.current = shapes;
    return shapes.filter((s) => !erased.has(s.id) && s.type !== 'eraser');
  }, [shapes]);

  const normalizePoint = useCallback(
    (clientX: number, clientY: number): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const nx = (clientX - rect.left) / rect.width;
      const ny = (clientY - rect.top) / rect.height;
      return {
        x: Math.max(0, Math.min(1, nx)),
        y: Math.max(0, Math.min(1, ny)),
      };
    },
    [],
  );

  const denormalizePoint = useCallback(
    (p: Point): { x: number; y: number } => {
      return {
        x: p.x * canvasSize.width,
        y: p.y * canvasSize.height,
      };
    },
    [canvasSize],
  );

  const scheduleRepaint = useCallback(() => {
    // Placeholder defined early to allow calls from updateSize
  }, []);

  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      if (!container) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);
      setCanvasSize({ width, height });

      [canvasRef.current, overlayRef.current].forEach((canvas) => {
        if (!canvas) return;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', updateSize);
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const expandDirtyRect = useCallback(
    (rect: DirtyRect) => {
      const cur = dirtyRectRef.current;
      if (cur) {
        const nx = Math.max(0, Math.min(cur.x, rect.x - DIRTY_MARGIN));
        const ny = Math.max(0, Math.min(cur.y, rect.y - DIRTY_MARGIN));
        const nx2 = Math.min(
          canvasSize.width,
          Math.max(cur.x + cur.width, rect.x + rect.width + DIRTY_MARGIN),
        );
        const ny2 = Math.min(
          canvasSize.height,
          Math.max(cur.y + cur.height, rect.y + rect.height + DIRTY_MARGIN),
        );
        cur.x = nx;
        cur.y = ny;
        cur.width = nx2 - nx;
        cur.height = ny2 - ny;
      } else {
        dirtyRectRef.current = {
          x: Math.max(0, rect.x - DIRTY_MARGIN),
          y: Math.max(0, rect.y - DIRTY_MARGIN),
          width: Math.min(canvasSize.width, rect.width + DIRTY_MARGIN * 2),
          height: Math.min(canvasSize.height, rect.height + DIRTY_MARGIN * 2),
        };
      }
    },
    [canvasSize],
  );

  const shapeToDirtyRect = useCallback(
    (shape: Shape): DirtyRect => {
      switch (shape.type) {
        case 'pen': {
          if (shape.points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
          let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
          for (const p of shape.points) {
            const { x, y } = denormalizePoint(p);
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
          const t = shape.thickness;
          return {
            x: minX - t,
            y: minY - t,
            width: maxX - minX + t * 2,
            height: maxY - minY + t * 2,
          };
        }
        case 'rectangle':
        case 'line': {
          const s = denormalizePoint(shape.start);
          const e = denormalizePoint(shape.end);
          const t = shape.thickness;
          return {
            x: Math.min(s.x, e.x) - t,
            y: Math.min(s.y, e.y) - t,
            width: Math.abs(e.x - s.x) + t * 2,
            height: Math.abs(e.y - s.y) + t * 2,
          };
        }
        case 'circle': {
          const c = denormalizePoint(shape.center);
          const r =
            shape.radius * Math.min(canvasSize.width, canvasSize.height) +
            shape.thickness;
          return { x: c.x - r, y: c.y - r, width: r * 2, height: r * 2 };
        }
        case 'text': {
          const p = denormalizePoint(shape.position);
          const w = shape.text.length * (shape.fontSize || 16);
          const h = (shape.fontSize || 16) * 1.4;
          return { x: p.x, y: p.y, width: w, height: h };
        }
        case 'eraser':
          return { x: 0, y: 0, width: canvasSize.width, height: canvasSize.height };
      }
    },
    [denormalizePoint, canvasSize],
  );

  const drawBackgroundGrid = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      const grid = 40;
      const startX = Math.floor(x / grid) * grid;
      const startY = Math.floor(y / grid) * grid;
      ctx.beginPath();
      for (let gx = startX; gx < x + w + grid; gx += grid) {
        ctx.moveTo(gx, y);
        ctx.lineTo(gx, y + h);
      }
      ctx.stroke();
      ctx.beginPath();
      for (let gy = startY; gy < y + h + grid; gy += grid) {
        ctx.moveTo(x, gy);
        ctx.lineTo(x + w, gy);
      }
      ctx.stroke();
    },
    [],
  );

  const drawShape = useCallback(
    (ctx: CanvasRenderingContext2D, shape: Shape) => {
      ctx.save();
      ctx.strokeStyle = shape.color;
      ctx.fillStyle = shape.color;
      ctx.lineWidth = shape.thickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      switch (shape.type) {
        case 'pen': {
          if (shape.points.length < 2) {
            const p = denormalizePoint(shape.points[0] || { x: 0, y: 0 });
            ctx.beginPath();
            ctx.arc(p.x, p.y, shape.thickness / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.beginPath();
            const first = denormalizePoint(shape.points[0]);
            ctx.moveTo(first.x, first.y);
            for (let i = 1; i < shape.points.length; i++) {
              const pt = denormalizePoint(shape.points[i]);
              ctx.lineTo(pt.x, pt.y);
            }
            ctx.stroke();
          }
          break;
        }
        case 'rectangle': {
          const s = denormalizePoint(shape.start);
          const e = denormalizePoint(shape.end);
          ctx.strokeRect(
            Math.min(s.x, e.x),
            Math.min(s.y, e.y),
            Math.abs(e.x - s.x),
            Math.abs(e.y - s.y),
          );
          break;
        }
        case 'circle': {
          const c = denormalizePoint(shape.center);
          const r = shape.radius * Math.min(canvasSize.width, canvasSize.height);
          ctx.beginPath();
          ctx.arc(c.x, c.y, Math.abs(r), 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'line': {
          const s = denormalizePoint(shape.start);
          const e = denormalizePoint(shape.end);
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(e.x, e.y);
          ctx.stroke();
          break;
        }
        case 'text': {
          const p = denormalizePoint(shape.position);
          ctx.font = `${shape.fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
          ctx.textBaseline = 'top';
          ctx.fillText(shape.text, p.x, p.y);
          break;
        }
        case 'eraser':
          break;
      }
      ctx.restore();
    },
    [denormalizePoint, canvasSize],
  );

  const isRectIntersect = (a: DirtyRect, b: DirtyRect): boolean => {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    );
  };

  const renderShapes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dirty = dirtyRectRef.current;
    const isLarge = visibleShapes.length > LARGE_DATASET_THRESHOLD;

    if (!dirty) {
      rafRef.current = 0;
      return;
    }

    const x = Math.floor(dirty.x);
    const y = Math.floor(dirty.y);
    const w = Math.ceil(dirty.width);
    const h = Math.ceil(dirty.height);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    drawBackgroundGrid(ctx, x, y, w, h);

    if (isLarge) {
      for (const shape of visibleShapes) {
        const sr = shapeToDirtyRect(shape);
        if (isRectIntersect(dirty, sr)) {
          drawShape(ctx, shape);
        }
      }
    } else {
      for (const shape of visibleShapes) {
        drawShape(ctx, shape);
      }
    }

    ctx.restore();
    dirtyRectRef.current = null;
    rafRef.current = 0;
  }, [visibleShapes, drawBackgroundGrid, drawShape, shapeToDirtyRect, canvasSize]);

  const scheduleFullRepaint = useCallback(() => {
    if (canvasSize.width === 0) return;
    dirtyRectRef.current = {
      x: 0,
      y: 0,
      width: canvasSize.width,
      height: canvasSize.height,
    };
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(renderShapes);
  }, [canvasSize, renderShapes]);

  const scheduleDirtyRepaint = useCallback(() => {
    if (canvasSize.width === 0) return;
    if (!dirtyRectRef.current) return;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(renderShapes);
  }, [canvasSize, renderShapes]);

  useEffect(() => {
    if (canvasSize.width > 0) {
      scheduleFullRepaint();
    }
  }, [version, canvasSize, scheduleFullRepaint]);

  useEffect(() => {
    const newIds = new Set(visibleShapes.map((s) => s.id));
    const prev = prevShapeIdsRef.current;

    if (
      prev.size === 0 ||
      visibleShapes.length > LARGE_DATASET_THRESHOLD
    ) {
      scheduleFullRepaint();
    } else {
      let changed = false;
      for (const s of visibleShapes) {
        if (!prev.has(s.id)) {
          expandDirtyRect(shapeToDirtyRect(s));
          changed = true;
        }
      }
      for (const id of prev) {
        if (!newIds.has(id)) {
          const oldShape = shapesRef.current.find((s) => s.id === id);
          if (oldShape) {
            expandDirtyRect(shapeToDirtyRect(oldShape));
            changed = true;
          }
        }
      }
      if (changed) {
        scheduleDirtyRepaint();
      }
    }

    prevShapeIdsRef.current = newIds;
  }, [
    visibleShapes,
    expandDirtyRect,
    shapeToDirtyRect,
    scheduleFullRepaint,
    scheduleDirtyRepaint,
  ]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || canvasSize.width === 0) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    if (currentShape) {
      drawShape(ctx, currentShape);
    }
  }, [currentShape, canvasSize, drawShape]);

  const getMousePos = (e: React.MouseEvent): Point =>
    normalizePoint(e.clientX, e.clientY);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const pos = getMousePos(e);

    if (tool === 'text') {
      const d = denormalizePoint(pos);
      setTextInput({ visible: true, x: d.x, y: d.y, value: '' });
      setTimeout(() => textInputRef.current?.focus(), 0);
      return;
    }

    setIsDrawing(true);
    const baseProps = {
      id: uuidv4(),
      color,
      thickness,
      userId,
      timestamp: Date.now(),
      version: 0,
      operationId: uuidv4(),
    };

    switch (tool) {
      case 'pen': {
        const shape: PenShape = {
          ...baseProps,
          type: 'pen',
          points: [pos],
        };
        setCurrentShape(shape);
        break;
      }
      case 'rectangle': {
        const shape: RectangleShape = {
          ...baseProps,
          type: 'rectangle',
          start: pos,
          end: pos,
        };
        setCurrentShape(shape);
        break;
      }
      case 'circle': {
        const shape: CircleShape = {
          ...baseProps,
          type: 'circle',
          center: pos,
          radius: 0,
        };
        setCurrentShape(shape);
        break;
      }
      case 'line': {
        const shape: LineShape = {
          ...baseProps,
          type: 'line',
          start: pos,
          end: pos,
        };
        setCurrentShape(shape);
        break;
      }
      case 'eraser': {
        handleEraser(pos);
        break;
      }
    }
  };

  const handleEraser = (pos: Point) => {
    const hitRadius = thickness * 3;
    const erasedIds: string[] = [];

    for (const shape of visibleShapes) {
      if (isPointNearShape(pos, shape, hitRadius, canvasSize)) {
        erasedIds.push(shape.id);
      }
    }

    if (erasedIds.length > 0) {
      onShapeComplete({
        id: uuidv4(),
        color,
        thickness,
        userId,
        timestamp: Date.now(),
        version: 0,
        operationId: uuidv4(),
        type: 'eraser',
        erasedIds,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    onCursorMove(pos);

    if (!isDrawing || !currentShape) return;

    if (tool === 'eraser') {
      handleEraser(pos);
      return;
    }

    let updated: Shape | null = null;

    switch (currentShape.type) {
      case 'pen':
        updated = { ...currentShape, points: [...currentShape.points, pos] };
        break;
      case 'rectangle':
        updated = { ...currentShape, end: pos };
        break;
      case 'circle': {
        const dx = pos.x - currentShape.center.x;
        const dy = pos.y - currentShape.center.y;
        updated = { ...currentShape, radius: Math.sqrt(dx * dx + dy * dy) };
        break;
      }
      case 'line':
        updated = { ...currentShape, end: pos };
        break;
    }

    if (updated) {
      setCurrentShape(updated);
      if (
        onShapeInProgress &&
        updated.type === 'pen' &&
        updated.points.length % 5 === 0
      ) {
        onShapeInProgress(updated);
      }
    }
  };

  const handleMouseUp = () => {
    onCursorMove(null);

    if (!isDrawing || !currentShape) {
      setIsDrawing(false);
      return;
    }

    if (tool === 'eraser') {
      setIsDrawing(false);
      return;
    }

    let valid = true;
    switch (currentShape.type) {
      case 'pen':
        valid = currentShape.points.length >= 1;
        break;
      case 'rectangle':
      case 'line':
        valid =
          currentShape.start.x !== currentShape.end.x ||
          currentShape.start.y !== currentShape.end.y;
        break;
      case 'circle':
        valid = currentShape.radius > 0;
        break;
    }

    if (valid) {
      onShapeComplete(currentShape);
    }
    setCurrentShape(null);
    setIsDrawing(false);
  };

  const handleMouseLeave = () => {
    onCursorMove(null);
  };

  const handleTextSubmit = () => {
    if (!textInput.value.trim()) {
      setTextInput({ ...textInput, visible: false });
      return;
    }
    const container = containerRef.current;
    const rect = container ? container.getBoundingClientRect() : { left: 0, top: 0 };
    const fontSize = Math.max(12, thickness * 2);
    const absX = rect.left + textInput.x;
    const absY = rect.top + textInput.y;
    const shape: TextShape = {
      id: uuidv4(),
      type: 'text',
      color,
      thickness,
      userId,
      timestamp: Date.now(),
      version: 0,
      operationId: uuidv4(),
      position: normalizePoint(absX, absY),
      text: textInput.value,
      fontSize,
    };
    onShapeComplete(shape);
    setTextInput({ visible: false, x: 0, y: 0, value: '' });
  };

  useImperativeHandle(ref, () => ({}), []);

  return (
    <div className="canvas-wrapper" ref={containerRef}>
      <canvas ref={canvasRef} className="canvas-layer" />
      <canvas
        ref={overlayRef}
        className="canvas-overlay"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor:
            tool === 'text' ? 'text' : tool === 'eraser' ? 'cell' : 'crosshair',
        }}
      />

      {textInput.visible && (
        <input
          ref={textInputRef}
          className="text-input"
          style={{
            left: textInput.x,
            top: textInput.y,
            color: color,
            fontSize: Math.max(12, thickness * 2),
          }}
          value={textInput.value}
          onChange={(e) =>
            setTextInput({ ...textInput, value: e.target.value })
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleTextSubmit();
            if (e.key === 'Escape')
              setTextInput({ ...textInput, visible: false });
          }}
          onBlur={handleTextSubmit}
          autoFocus
          placeholder="输入文字..."
        />
      )}

      {Array.from(remoteCursors.entries()).map(([id, data]) => {
        if (!data.position || id === userId) return null;
        const d = denormalizePoint(data.position);
        return (
          <div
            key={id}
            className="remote-cursor"
            style={{
              left: d.x,
              top: d.y,
              backgroundColor: data.color,
              boxShadow: `0 0 10px ${data.color}`,
            }}
          />
        );
      })}

      <div className="canvas-hud">
        <div className="hud-badge online-count">
          <span className="hud-dot" />
          <span className="hud-count" key={onlineUsers.length}>
            {onlineUsers.length}
          </span>
          <span className="hud-label">人在线</span>
        </div>
        <div className="hud-users">
          {onlineUsers.slice(0, 8).map((u) => (
            <div
              key={u.id}
              className="hud-avatar"
              style={{ backgroundColor: u.color, borderColor: u.color }}
              title={u.name}
            >
              {u.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {onlineUsers.length > 8 && (
            <div className="hud-avatar more">
              +{onlineUsers.length - 8}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

function isPointNearShape(
  pt: Point,
  shape: Shape,
  hitRadius: number,
  size: { width: number; height: number },
): boolean {
  const hitNormX = hitRadius / size.width;
  const hitNormY = hitRadius / size.height;

  switch (shape.type) {
    case 'pen':
      return shape.points.some(
        (p) =>
          Math.abs(p.x - pt.x) <= hitNormX &&
          Math.abs(p.y - pt.y) <= hitNormY,
      );
    case 'rectangle': {
      const minX = Math.min(shape.start.x, shape.end.x) - hitNormX;
      const maxX = Math.max(shape.start.x, shape.end.x) + hitNormX;
      const minY = Math.min(shape.start.y, shape.end.y) - hitNormY;
      const maxY = Math.max(shape.start.y, shape.end.y) + hitNormY;
      return (
        pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY
      );
    }
    case 'circle': {
      const dx = pt.x - shape.center.x;
      const dy = pt.y - shape.center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return (
        Math.abs(dist - shape.radius) <= Math.max(hitNormX, hitNormY) ||
        dist <= shape.radius
      );
    }
    case 'line': {
      return pointNearLine(pt, shape.start, shape.end, Math.max(hitNormX, hitNormY));
    }
    case 'text': {
      const w =
        (shape.text.length * (shape.fontSize || 16) * 0.6) / size.width;
      const h = ((shape.fontSize || 16) * 1.4) / size.height;
      return (
        pt.x >= shape.position.x - hitNormX &&
        pt.x <= shape.position.x + w + hitNormX &&
        pt.y >= shape.position.y - hitNormY &&
        pt.y <= shape.position.y + h + hitNormY
      );
    }
    case 'eraser':
      return false;
  }
}

function pointNearLine(
  pt: Point,
  a: Point,
  b: Point,
  tolerance: number,
): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return Math.hypot(pt.x - a.x, pt.y - a.y) <= tolerance;
  }
  let t = ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const px = a.x + t * dx;
  const py = a.y + t * dy;
  return Math.hypot(pt.x - px, pt.y - py) <= tolerance;
}
