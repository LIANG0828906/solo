import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { roomManager } from '../roomManager';

export interface PaintingBoardRef {
  clear: () => void;
  undo: () => void;
  applyDrawAction: (action: any) => void;
}

interface Props {
  isDrawer: boolean;
  word?: string | null;
  wordCategory?: string;
  flashState?: 'none' | 'correct' | 'wrong';
  onDraw?: () => void;
}

interface Point {
  x: number;
  y: number;
}

const COLORS = ['#000000', '#e94560', '#3b82f6', '#10b981', '#f59e0b'];
const SIZES = [2, 5, 8];
const SIZE_LABELS = ['细', '中', '粗'];

const PaintingBoard = forwardRef<PaintingBoardRef, Props>(({ isDrawer, word, wordCategory, flashState, onDraw }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(SIZES[1]);
  const [isEraser, setIsEraser] = useState(false);
  const lastPoint = useRef<Point | null>(null);
  const pathsRef = useRef<{ color: string; size: number; isEraser: boolean; points: Point[] }[]>([]);
  const [, forceUpdate] = useState(0);

  const getCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { w: 800, h: 600 };
    return { w: canvas.width, h: canvas.height };
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    redrawAll();
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { w, h } = getCanvasSize();
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w / dpr, h / dpr);

    pathsRef.current.forEach((path) => {
      if (path.points.length < 2) return;
      ctx.strokeStyle = path.isEraser ? '#ffffff' : path.color;
      ctx.lineWidth = path.isEraser ? path.size * 3 : path.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
    });
  }, [getCanvasSize]);

  useEffect(() => {
    redrawAll();
  }, [redrawAll]);

  const getPoint = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer) return;
    const pt = getPoint(e);
    if (!pt) return;
    setDrawing(true);
    lastPoint.current = pt;
    const newPath = { color, size, isEraser, points: [pt] };
    pathsRef.current.push(newPath);
    onDraw?.();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !isDrawer) return;
    const pt = getPoint(e);
    if (!pt || !lastPoint.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const path = pathsRef.current[pathsRef.current.length - 1];
    path.points.push(pt);

    ctx.strokeStyle = isEraser ? '#ffffff' : color;
    ctx.lineWidth = isEraser ? size * 3 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();

    roomManager.sendDrawAction({
      type: 'segment',
      color,
      size,
      isEraser,
      from: lastPoint.current,
      to: pt
    });

    lastPoint.current = pt;
  };

  const endDraw = () => {
    if (!drawing) return;
    setDrawing(false);
    lastPoint.current = null;
    const path = pathsRef.current[pathsRef.current.length - 1];
    if (path) {
      roomManager.sendDrawAction({ type: 'path_end' });
    }
  };

  const clearCanvas = useCallback(() => {
    pathsRef.current = [];
    redrawAll();
    forceUpdate((n) => n + 1);
  }, [redrawAll]);

  const undoLast = useCallback(() => {
    pathsRef.current.pop();
    redrawAll();
    forceUpdate((n) => n + 1);
  }, [redrawAll]);

  useImperativeHandle(ref, () => ({
    clear: clearCanvas,
    undo: undoLast,
    applyDrawAction: (action: any) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (action.type === 'segment') {
        ctx.strokeStyle = action.isEraser ? '#ffffff' : action.color;
        ctx.lineWidth = action.isEraser ? action.size * 3 : action.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(action.from.x, action.from.y);
        ctx.lineTo(action.to.x, action.to.y);
        ctx.stroke();

        if (pathsRef.current.length === 0 || action._new) {
          pathsRef.current.push({
            color: action.color,
            size: action.size,
            isEraser: action.isEraser,
            points: [action.from, action.to]
          });
        } else {
          const last = pathsRef.current[pathsRef.current.length - 1];
          last.points.push(action.to);
        }
      }
    }
  }));

  const flashClass =
    flashState === 'correct' ? 'flash-green' : flashState === 'wrong' ? 'flash-red' : '';

  return (
    <div
      ref={containerRef}
      className={`painting-board-container ${flashClass}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 400,
        borderRadius: 16,
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        background: '#ffffff',
        transition: 'all 0.3s ease'
      }}
    >
      {word && isDrawer && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 10,
            background: 'rgba(22, 33, 62, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '10px 18px',
            borderRadius: 12,
            border: '1px solid rgba(233, 69, 96, 0.3)',
            pointerEvents: 'none'
          }}
        >
          <div style={{ fontSize: 12, color: '#a0aec0', marginBottom: 4 }}>
            词牌 ({wordCategory})
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: 2 }}>
            {word}
          </div>
        </div>
      )}

      {!isDrawer && wordCategory && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 10,
            background: 'rgba(15, 52, 96, 0.8)',
            backdropFilter: 'blur(8px)',
            padding: '8px 14px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: 13,
            color: '#fff'
          }}
        >
          主题: <strong style={{ color: '#e94560' }}>{wordCategory}</strong>
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: isDrawer ? (isEraser ? 'cell' : 'crosshair') : 'default',
          touchAction: 'none'
        }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />

      {isDrawer && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 8,
            padding: '10px 14px',
            background: 'rgba(22, 33, 62, 0.92)',
            borderRadius: 14,
            border: '1px solid var(--border-color)',
            zIndex: 10,
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}
        >
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#a0aec0', marginRight: 4 }}>颜色:</span>
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setIsEraser(false);
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: c,
                  border:
                    color === c && !isEraser
                      ? '3px solid #e94560'
                      : '2px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  transform: color === c && !isEraser ? 'scale(1.15)' : 'scale(1)',
                  boxShadow: color === c && !isEraser ? '0 0 10px rgba(233, 69, 96, 0.5)' : 'none'
                }}
                title={c === '#000000' ? '黑色' : c === '#e94560' ? '红色' : c === '#3b82f6' ? '蓝色' : c === '#10b981' ? '绿色' : '橙色'}
              />
            ))}
          </div>

          <div style={{ width: 1, background: 'rgba(255,255,255,0.15)', margin: '0 6px' }} />

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#a0aec0', marginRight: 4 }}>粗细:</span>
            {SIZES.map((s, idx) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                style={{
                  width: 44,
                  height: 32,
                  borderRadius: 8,
                  background: size === s ? 'rgba(233, 69, 96, 0.3)' : 'rgba(255,255,255,0.08)',
                  border:
                    size === s ? '2px solid #e94560' : '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: size === s ? '#fff' : '#a0aec0',
                  fontSize: 12,
                  fontWeight: 600,
                  gap: 6
                }}
              >
                <div
                  style={{
                    width: s + 2,
                    height: s + 2,
                    borderRadius: '50%',
                    background: isEraser ? '#fff' : color
                  }}
                />
                <span>{SIZE_LABELS[idx]}</span>
              </button>
            ))}
          </div>

          <div style={{ width: 1, background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

          <button
            onClick={() => setIsEraser(!isEraser)}
            title="橡皮擦"
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: isEraser ? '#e94560' : 'rgba(255,255,255,0.08)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            🧽 橡皮
          </button>

          <button
            onClick={() => {
              undoLast();
              roomManager.undoCanvas();
            }}
            title="撤销"
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600
            }}
          >
            ↩️ 撤销
          </button>

          <button
            onClick={() => {
              clearCanvas();
              roomManager.clearCanvas();
            }}
            title="清空"
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(233, 69, 96, 0.2)',
              color: '#ff8098',
              border: '1px solid rgba(233,69,96,0.3)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600
            }}
          >
            🗑️ 清空
          </button>
        </div>
      )}
    </div>
  );
});

PaintingBoard.displayName = 'PaintingBoard';

export default PaintingBoard;
