import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import { Shape, ToolType, Point, PenShape, RectangleShape, CircleShape, LineShape, TextShape, UserInfo } from './types';
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
}

const PRESET_COLORS_COUNT = 8;

export const Canvas = forwardRef<CanvasHandle, CanvasProps>(function Canvas(
  { shapes, tool, color, thickness, userId, remoteCursors, onlineUsers, onShapeComplete, onShapeInProgress, onCursorMove },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [textInput, setTextInput] = useState<{ visible: boolean; x: number; y: number; value: string }>({
    visible: false,
    x: 0,
    y: 0,
    value: '',
  });
  const textInputRef = useRef<HTMLInputElement>(null);

  const [eraserSet, setEraserSet] = useState<Set<string>>(new Set());

  const computeEffectiveErasedSet = useCallback(() => {
    const erased = new Set<string>();
    shapes.forEach((s) => {
      if (s.type === 'eraser') {
        s.erasedIds.forEach((id) => erased.add(id));
      }
    });
    return erased;
  }, [shapes]);

  useEffect(() => {
    setEraserSet(computeEffectiveErasedSet());
  }, [computeEffectiveErasedSet]);

  const normalizePoint = useCallback(
    (clientX: number, clientY: number): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left) / rect.width,
        y: (clientY - rect.top) / rect.height,
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

  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      if (!container) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
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
    };
  }, []);

  const drawShapeToContext = useCallback(
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
          ctx.strokeRect(Math.min(s.x, e.x), Math.min(s.y, e.y), Math.abs(e.x - s.x), Math.abs(e.y - s.y));
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    const grid = 40;
    for (let x = 0; x < canvasSize.width; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvasSize.height; y += grid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();
    }

    const visibleShapes = shapes.filter((s) => !eraserSet.has(s.id));
    visibleShapes.forEach((shape) => drawShapeToContext(ctx, shape));
  }, [shapes, eraserSet, canvasSize, drawShapeToContext]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || canvasSize.width === 0) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    if (currentShape) {
      drawShapeToContext(ctx, currentShape);
    }
  }, [currentShape, canvasSize, drawShapeToContext]);

  const getMousePos = (e: React.MouseEvent | MouseEvent): Point => {
    return normalizePoint(e.clientX, e.clientY);
  };

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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const d = denormalizePoint(pos);
    const hitRadius = thickness * 2;
    const erasedIds: string[] = [];

    const visibleShapes = shapes.filter((s) => !eraserSet.has(s.id) && s.type !== 'eraser');

    for (const shape of visibleShapes) {
      if (isPointNearShape(pos, shape, hitRadius, canvasSize)) {
        erasedIds.push(shape.id);
      }
    }

    if (erasedIds.length > 0) {
      const baseProps = {
        id: uuidv4(),
        color,
        thickness,
        userId,
        timestamp: Date.now(),
        type: 'eraser' as const,
        erasedIds,
      };
      onShapeComplete(baseProps);
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
        const radius = Math.sqrt(dx * dx + dy * dy);
        updated = { ...currentShape, radius };
        break;
      }
      case 'line':
        updated = { ...currentShape, end: pos };
        break;
    }

    if (updated) {
      setCurrentShape(updated);
      if (onShapeInProgress && updated.type === 'pen') {
        onShapeInProgress(updated);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
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
        valid = currentShape.start.x !== currentShape.end.x || currentShape.start.y !== currentShape.end.y;
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
    const normPos = normalizePoint(
      textInput.x + (containerRef.current?.getBoundingClientRect().left || 0),
      textInput.y + (containerRef.current?.getBoundingClientRect().top || 0),
    );
    const fontSize = Math.max(12, thickness * 2);
    const shape: TextShape = {
      id: uuidv4(),
      type: 'text',
      color,
      thickness,
      userId,
      timestamp: Date.now(),
      position: normalizePoint(
        (containerRef.current?.getBoundingClientRect().left || 0) + textInput.x,
        (containerRef.current?.getBoundingClientRect().top || 0) + textInput.y,
      ),
      text: textInput.value,
      fontSize,
    };
    onShapeComplete(shape);
    setTextInput({ visible: false, x: 0, y: 0, value: '' });
  };

  useImperativeHandle(
    ref,
    () => ({}),
    [],
  );

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
        style={{ cursor: tool === 'text' ? 'text' : tool === 'eraser' ? 'cell' : 'crosshair' }}
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
          onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleTextSubmit();
            if (e.key === 'Escape') setTextInput({ ...textInput, visible: false });
          }}
          onBlur={handleTextSubmit}
          autoFocus
          placeholder="输入文字..."
        />
      )}

      {Array.from(remoteCursors.entries()).map(([id, data]) => {
        if (!data.position) return null;
        const d = denormalizePoint(data.position);
        return (
          <div
            key={id}
            className="remote-cursor"
            style={{
              left: d.x,
              top: d.y,
              backgroundColor: data.color,
              boxShadow: `0 0 8px ${data.color}`,
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
          {onlineUsers.length > 8 && <div className="hud-avatar more">+{onlineUsers.length - 8}</div>}
        </div>
      </div>
    </div>
  );
});

function isPointNearShape(pt: Point, shape: Shape, hitRadius: number, size: { width: number; height: number }): boolean {
  const hitNormX = hitRadius / size.width;
  const hitNormY = hitRadius / size.height;

  switch (shape.type) {
    case 'pen':
      return shape.points.some(
        (p) => Math.abs(p.x - pt.x) <= hitNormX && Math.abs(p.y - pt.y) <= hitNormY,
      );
    case 'rectangle': {
      const minX = Math.min(shape.start.x, shape.end.x) - hitNormX;
      const maxX = Math.max(shape.start.x, shape.end.x) + hitNormX;
      const minY = Math.min(shape.start.y, shape.end.y) - hitNormY;
      const maxY = Math.max(shape.start.y, shape.end.y) + hitNormY;
      return pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY;
    }
    case 'circle': {
      const dx = pt.x - shape.center.x;
      const dy = pt.y - shape.center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return Math.abs(dist - shape.radius) <= Math.max(hitNormX, hitNormY) || dist <= shape.radius;
    }
    case 'line': {
      return pointNearLine(pt, shape.start, shape.end, Math.max(hitNormX, hitNormY));
    }
    case 'text': {
      const w = shape.text.length * shape.fontSize * 0.6 / size.width;
      const h = shape.fontSize * 1.4 / size.height;
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

function pointNearLine(pt: Point, a: Point, b: Point, tolerance: number): boolean {
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
