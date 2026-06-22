import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import {
  Tool,
  WhiteboardElement,
  PathElement,
  LineElement,
  RectElement,
  StickyElement,
  Operation,
  Point,
} from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

interface WhiteboardProps {
  socket: Socket;
  currentTool: Tool;
  color: string;
  strokeWidth: number;
  userId: string;
  onToolConsumed?: (tool: Tool) => void;
}

const STICKY_WIDTH = 150;
const STICKY_HEIGHT = 120;
const STICKY_HEADER_HEIGHT = 20;
const THROTTLE_MS = 50;

interface PendingPath {
  elementId: string;
  element: PathElement;
  bufferedPoints: Point[];
  lastSendTime: number;
  sendTimer: ReturnType<typeof setTimeout> | null;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({
  socket,
  currentTool,
  color,
  strokeWidth,
  userId,
  onToolConsumed,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [editingStickyId, setEditingStickyId] = useState<string | null>(null);
  const lastSeqRef = useRef<number>(0);

  const drawingRef = useRef<{
    isDrawing: boolean;
    currentTool: Tool;
    startPoint: Point | null;
    currentPoint: Point | null;
    pendingPath: PendingPath | null;
    tempElement: LineElement | RectElement | null;
  }>({
    isDrawing: false,
    currentTool: 'pen',
    startPoint: null,
    currentPoint: null,
    pendingPath: null,
    tempElement: null,
  });

  const draggingRef = useRef<{
    isDragging: boolean;
    elementId: string | null;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  }>({
    isDragging: false,
    elementId: null,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    moved: false,
  });

  const seqSort = (a: WhiteboardElement, b: WhiteboardElement) => {
    if (a.seq !== b.seq) return a.seq - b.seq;
    return a.timestamp - b.timestamp;
  };

  const applyOperation = useCallback((op: Operation) => {
    if (op.seq <= lastSeqRef.current && op.type !== 'draw:point') {
      return;
    }
    lastSeqRef.current = Math.max(lastSeqRef.current, op.seq);

    switch (op.type) {
      case 'element:add': {
        setElements((prev) => {
          if (prev.some((e) => e.id === op.payload.id)) return prev;
          return [...prev, op.payload as WhiteboardElement].sort(seqSort);
        });
        break;
      }
      case 'element:update':
      case 'sticky:move':
      case 'sticky:text': {
        setElements((prev) =>
          prev
            .map((e) => (e.id === op.payload.id ? { ...e, ...op.payload } as WhiteboardElement : e))
            .sort(seqSort)
        );
        break;
      }
      case 'element:delete': {
        setElements((prev) => prev.filter((e) => e.id !== op.payload.id));
        break;
      }
      case 'canvas:clear': {
        setElements([]);
        break;
      }
      case 'draw:point': {
        const { id, points } = op.payload;
        setElements((prev) =>
          prev.map((e) => {
            if (e.id !== id || e.type !== 'path') return e;
            const pe = e as PathElement;
            return {
              ...pe,
              points: [...pe.points, ...points],
              timestamp: op.payload.timestamp,
              seq: op.payload.seq,
            };
          }).sort(seqSort)
        );
        break;
      }
    }
  }, []);

  useEffect(() => {
    socket.emit('room:history', (res: any) => {
      if (res.success) {
        if (res.elements && res.elements.length > 0) {
          const sorted = [...res.elements].sort(seqSort);
          setElements(sorted);
          const maxSeq = sorted.reduce((m, e) => Math.max(m, e.seq), 0);
          lastSeqRef.current = maxSeq;
        }
        if (res.operations) {
          res.operations.forEach((op: Operation) => applyOperation(op));
        }
      }
    });

    const handler = (op: Operation) => applyOperation(op);
    socket.on('operation', handler);
    return () => {
      socket.off('operation', handler);
    };
  }, [socket, applyOperation]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ w: rect.width, h: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const getCanvasPoint = (e: React.MouseEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const flushThrottledPoints = (pending: PendingPath) => {
    if (pending.bufferedPoints.length === 0) return;
    const pts = pending.bufferedPoints.splice(0, pending.bufferedPoints.length);
    socket.emit('draw:points', { elementId: pending.elementId, points: pts });
    pending.lastSendTime = Date.now();
  };

  const startThrottleTimer = (pending: PendingPath) => {
    if (pending.sendTimer) return;
    pending.sendTimer = setTimeout(() => {
      pending.sendTimer = null;
      flushThrottledPoints(pending);
      if (drawingRef.current.isDrawing && drawingRef.current.pendingPath === pending) {
        startThrottleTimer(pending);
      }
    }, THROTTLE_MS);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (currentTool === 'sticky') return;
    if (editingStickyId) setEditingStickyId(null);

    const pt = getCanvasPoint(e);
    const d = drawingRef.current;
    d.isDrawing = true;
    d.currentTool = currentTool;
    d.startPoint = pt;
    d.currentPoint = pt;

    if (currentTool === 'pen') {
      const elId = uuidv4();
      const element: PathElement = {
        id: elId,
        type: 'path',
        color,
        strokeWidth,
        points: [{ ...pt }],
        timestamp: Date.now(),
        seq: 0,
        userId,
      };
      d.pendingPath = {
        elementId: elId,
        element,
        bufferedPoints: [],
        lastSendTime: Date.now(),
        sendTimer: null,
      };
      setElements((prev) => [...prev, element].sort(seqSort));
      socket.emit('element:add', element);
      startThrottleTimer(d.pendingPath);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const d = drawingRef.current;
    if (!d.isDrawing) return;

    const pt = getCanvasPoint(e);
    d.currentPoint = pt;

    if (d.currentTool === 'pen' && d.pendingPath) {
      d.pendingPath.element.points.push({ ...pt });
      d.pendingPath.bufferedPoints.push({ ...pt });
      const now = Date.now();
      if (now - d.pendingPath.lastSendTime >= THROTTLE_MS) {
        flushThrottledPoints(d.pendingPath);
      }
      setElements((prev) =>
        prev.map((el) => (el.id === d.pendingPath!.elementId ? d.pendingPath!.element : el))
      );
    } else if (d.currentTool === 'line' && d.startPoint) {
      d.tempElement = {
        id: '__temp__',
        type: 'line',
        color,
        strokeWidth,
        start: d.startPoint,
        end: pt,
        timestamp: Date.now(),
        seq: 0,
        userId,
      };
    } else if (d.currentTool === 'rect' && d.startPoint) {
      const x = Math.min(d.startPoint.x, pt.x);
      const y = Math.min(d.startPoint.y, pt.y);
      const w = Math.abs(pt.x - d.startPoint.x);
      const h = Math.abs(pt.y - d.startPoint.y);
      d.tempElement = {
        id: '__temp__',
        type: 'rect',
        color,
        strokeWidth,
        x,
        y,
        width: w,
        height: h,
        filled: false,
        timestamp: Date.now(),
        seq: 0,
        userId,
      } as RectElement;
    }
    renderCanvas();
  };

  const handleCanvasMouseUp = () => {
    const d = drawingRef.current;
    if (!d.isDrawing) return;
    d.isDrawing = false;

    if (d.currentTool === 'pen' && d.pendingPath) {
      flushThrottledPoints(d.pendingPath);
      if (d.pendingPath.sendTimer) {
        clearTimeout(d.pendingPath.sendTimer);
        d.pendingPath.sendTimer = null;
      }
      d.pendingPath = null;
    } else if (d.currentTool === 'line' && d.startPoint && d.currentPoint) {
      const el: LineElement = {
        id: uuidv4(),
        type: 'line',
        color,
        strokeWidth,
        start: d.startPoint,
        end: d.currentPoint,
        timestamp: Date.now(),
        seq: 0,
        userId,
      };
      setElements((prev) => [...prev, el].sort(seqSort));
      socket.emit('element:add', el);
    } else if (d.currentTool === 'rect' && d.startPoint && d.currentPoint) {
      const x = Math.min(d.startPoint.x, d.currentPoint.x);
      const y = Math.min(d.startPoint.y, d.currentPoint.y);
      const w = Math.abs(d.currentPoint.x - d.startPoint.x);
      const h = Math.abs(d.currentPoint.y - d.startPoint.y);
      if (w > 2 && h > 2) {
        const el: RectElement = {
          id: uuidv4(),
          type: 'rect',
          color,
          strokeWidth,
          x,
          y,
          width: w,
          height: h,
          filled: false,
          timestamp: Date.now(),
          seq: 0,
          userId,
        };
        setElements((prev) => [...prev, el].sort(seqSort));
        socket.emit('element:add', el);
      }
    }

    d.startPoint = null;
    d.currentPoint = null;
    d.tempElement = null;
    renderCanvas();
  };

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const sorted = [...elements].sort(seqSort);

    for (const el of sorted) {
      if (el.type === 'path') {
        drawPath(ctx, el);
      } else if (el.type === 'line') {
        drawLine(ctx, el);
      } else if (el.type === 'rect') {
        drawRect(ctx, el);
      }
    }

    const temp = drawingRef.current.tempElement;
    if (temp) {
      if (temp.type === 'line') drawLine(ctx, temp);
      else if (temp.type === 'rect') drawRect(ctx, temp as RectElement);
    }
  }, [elements]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas, canvasSize]);

  const drawPath = (ctx: CanvasRenderingContext2D, el: PathElement) => {
    if (el.points.length < 1) return;
    ctx.strokeStyle = el.color;
    ctx.lineWidth = el.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(el.points[0].x, el.points[0].y);
    for (let i = 1; i < el.points.length; i++) {
      ctx.lineTo(el.points[i].x, el.points[i].y);
    }
    ctx.stroke();
  };

  const drawLine = (ctx: CanvasRenderingContext2D, el: LineElement) => {
    ctx.strokeStyle = el.color;
    ctx.lineWidth = el.strokeWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(el.start.x, el.start.y);
    ctx.lineTo(el.end.x, el.end.y);
    ctx.stroke();
  };

  const drawRect = (ctx: CanvasRenderingContext2D, el: RectElement) => {
    ctx.strokeStyle = el.color;
    ctx.lineWidth = el.strokeWidth;
    if (el.filled) {
      ctx.fillStyle = el.color;
      ctx.fillRect(el.x, el.y, el.width, el.height);
    } else {
      ctx.strokeRect(el.x, el.y, el.width, el.height);
    }
  };

  useEffect(() => {
    if (currentTool === 'sticky') {
      const cx = canvasSize.w / 2 - STICKY_WIDTH / 2;
      const cy = canvasSize.h / 2 - STICKY_HEIGHT / 2;
      const el: StickyElement = {
        id: uuidv4(),
        type: 'sticky',
        color: '#fff9c4',
        strokeWidth: 0,
        x: cx,
        y: cy,
        width: STICKY_WIDTH,
        height: STICKY_HEIGHT,
        text: '',
        timestamp: Date.now(),
        seq: 0,
        userId,
      };
      setElements((prev) => [...prev, el].sort(seqSort));
      socket.emit('element:add', el);
      setEditingStickyId(el.id);
      onToolConsumed?.('sticky');
    }
  }, [currentTool]);

  const handleStickyHeaderMouseDown = (e: React.MouseEvent, sticky: StickyElement) => {
    e.stopPropagation();
    e.preventDefault();
    const d = draggingRef.current;
    d.isDragging = true;
    d.elementId = sticky.id;
    d.startX = e.clientX;
    d.startY = e.clientY;
    d.origX = sticky.x;
    d.origY = sticky.y;
    d.moved = false;
  };

  const handleStickyBodyClick = (e: React.MouseEvent, sticky: StickyElement) => {
    e.stopPropagation();
    if (!draggingRef.current.isDragging || !draggingRef.current.moved) {
      setEditingStickyId(sticky.id);
    }
  };

  const handleStickyBodyMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = draggingRef.current;
      if (!d.isDragging || !d.elementId) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        d.moved = true;
      }
      const newX = d.origX + dx;
      const newY = d.origY + dy;
      setElements((prev) =>
        prev.map((el) =>
          el.id === d.elementId && el.type === 'sticky'
            ? ({ ...el, x: newX, y: newY } as StickyElement)
            : el
        )
      );
    };

    const onUp = () => {
      const d = draggingRef.current;
      if (d.isDragging && d.elementId && d.moved) {
        const el = elements.find((e) => e.id === d.elementId);
        if (el && el.type === 'sticky') {
          socket.emit('element:update', {
            id: el.id,
            updates: { x: el.x, y: el.y },
          });
        }
      }
      d.isDragging = false;
      d.elementId = null;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [elements, socket]);

  const handleStickyTextChange = (id: string, text: string) => {
    const limited = text.slice(0, 200);
    setElements((prev) =>
      prev.map((el) =>
        el.id === id && el.type === 'sticky'
          ? ({ ...el, text: limited } as StickyElement)
          : el
      )
    );
  };

  const handleStickyTextBlur = (id: string) => {
    const el = elements.find((e) => e.id === id);
    if (el && el.type === 'sticky') {
      socket.emit('element:update', {
        id: el.id,
        updates: { text: el.text },
      });
    }
    setEditingStickyId(null);
  };

  const handleStickyDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setElements((prev) => prev.filter((el) => el.id !== id));
    socket.emit('element:delete', id);
    if (editingStickyId === id) setEditingStickyId(null);
  };

  const stickies = elements.filter((e) => e.type === 'sticky') as StickyElement[];

  return (
    <div className="whiteboard-wrapper">
      <div className="whiteboard-container glass-panel" ref={containerRef}>
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
          className="whiteboard-canvas"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        />
        {stickies.map((s) => (
          <div
            key={s.id}
            className="sticky"
            style={{
              left: s.x,
              top: s.y,
              width: s.width,
              height: s.height,
              zIndex: s.seq || 1,
            }}
          >
            <div
              className="sticky-header"
              onMouseDown={(e) => handleStickyHeaderMouseDown(e, s)}
            >
              <button
                className="sticky-delete"
                onClick={(e) => handleStickyDelete(e, s.id)}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                title="删除便利贴"
              >
                ×
              </button>
            </div>
            <div
              className="sticky-body"
              onClick={(e) => handleStickyBodyClick(e, s)}
              onMouseDown={handleStickyBodyMouseDown}
            >
              {editingStickyId === s.id ? (
                <div className="sticky-editor">
                  <textarea
                    className="sticky-textarea"
                    value={s.text}
                    autoFocus
                    maxLength={200}
                    onChange={(e) => handleStickyTextChange(s.id, e.target.value)}
                    onBlur={() => handleStickyTextBlur(s.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        handleStickyTextBlur(s.id);
                      }
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                </div>
              ) : (
                <div className="sticky-text">{s.text || '双击编辑'}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Whiteboard;
