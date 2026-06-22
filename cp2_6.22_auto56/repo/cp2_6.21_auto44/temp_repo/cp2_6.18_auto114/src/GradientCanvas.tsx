import { useRef, useEffect, useState, useCallback } from 'react';
import { useGradientStore, type ColorStop, type GradientType } from './GradientStore';

const CANVAS_SIZE = 300;
const STOP_HANDLE_SIZE = 16;

export function GradientCanvas({ onExport }: { onExport: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const dirtyRef = useRef(true);

  const type = useGradientStore((state) => state.type);
  const angle = useGradientStore((state) => state.angle);
  const centerX = useGradientStore((state) => state.centerX);
  const centerY = useGradientStore((state) => state.centerY);
  const colorStops = useGradientStore((state) => state.colorStops);
  const updateColorStopPosition = useGradientStore(
    (state) => state.updateColorStopPosition
  );

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
  }, []);

  useEffect(() => {
    markDirty();
  }, [type, angle, centerX, centerY, colorStops, markDirty]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (!dirtyRef.current) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }
      dirtyRef.current = false;

      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      drawGradient(ctx);

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const drawGradient = (ctx: CanvasRenderingContext2D) => {
    let gradient: CanvasGradient;

    const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);

    if (type === 'linear') {
      const angleRad = (angle * Math.PI) / 180;
      const center = CANVAS_SIZE / 2;
      const length = CANVAS_SIZE * Math.SQRT2;
      const dx = Math.cos(angleRad - Math.PI / 2) * (length / 2);
      const dy = Math.sin(angleRad - Math.PI / 2) * (length / 2);
      gradient = ctx.createLinearGradient(
        center - dx,
        center - dy,
        center + dx,
        center + dy
      );
    } else if (type === 'radial') {
      const cx = (centerX / 100) * CANVAS_SIZE;
      const cy = (centerY / 100) * CANVAS_SIZE;
      const radius = CANVAS_SIZE * 0.75;
      gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    } else {
      const cx = (centerX / 100) * CANVAS_SIZE;
      const cy = (centerY / 100) * CANVAS_SIZE;
      const startAngle = (angle * Math.PI) / 180 - Math.PI / 2;
      gradient = ctx.createConicGradient(startAngle, cx, cy);
    }

    for (const stop of sortedStops) {
      gradient.addColorStop(stop.position / 100, stop.color);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  };

  const getStopX = (stop: ColorStop) => {
    return (stop.position / 100) * CANVAS_SIZE;
  };

  const handleMouseDown = (e: React.MouseEvent, stopId: string) => {
    e.preventDefault();
    setDraggingId(stopId);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingId) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_SIZE / rect.width;
      const x = (e.clientX - rect.left) * scaleX;
      const position = Math.max(0, Math.min(100, (x / CANVAS_SIZE) * 100));
      updateColorStopPosition(draggingId, Number(position.toFixed(2)));
    },
    [draggingId, updateColorStopPosition]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
  }, []);

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, handleMouseMove, handleMouseUp]);

  const activeId = draggingId || hoveredId;

  return (
    <div className="canvas-area">
      <div className="canvas-wrapper">
        <div className="checkerboard" />
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="gradient-canvas"
        />
        {colorStops.map((stop) => {
          const x = getStopX(stop);
          const isActive = activeId === stop.id;
          const isDragging = draggingId === stop.id;
          return (
            <div
              key={stop.id}
              style={{
                position: 'absolute',
                left: `${(x / CANVAS_SIZE) * 100}%`,
                bottom: '-4px',
                transform: `translateX(-50%) ${isActive ? 'scale(1.2)' : 'scale(1)'}`,
                width: `${STOP_HANDLE_SIZE}px`,
                height: `${STOP_HANDLE_SIZE}px`,
                borderRadius: '50%',
                background: stop.color,
                border: isActive
                  ? '2px solid #fff'
                  : '2px solid rgba(255,255,255,0.5)',
                cursor: 'grab',
                zIndex: isDragging ? 10 : 5,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
              onMouseDown={(e) => handleMouseDown(e, stop.id)}
              onMouseEnter={() => setHoveredId(stop.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {(isDragging || isActive) && (
                <div className="color-stop-tooltip">
                  {stop.position.toFixed(2)}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button className="export-btn" onClick={onExport}>
        导出 CSS 代码
      </button>
    </div>
  );
}

export function generateCSS(
  type: GradientType,
  angle: number,
  centerX: number,
  centerY: number,
  colorStops: ColorStop[]
): string {
  const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);
  const stopsStr = sortedStops
    .map((stop) => `${stop.color} ${stop.position.toFixed(2)}%`)
    .join(', ');

  if (type === 'linear') {
    return `linear-gradient(${angle}deg, ${stopsStr})`;
  } else if (type === 'radial') {
    return `radial-gradient(circle at ${centerX}% ${centerY}%, ${stopsStr})`;
  } else {
    return `conic-gradient(from ${angle}deg at ${centerX}% ${centerY}%, ${stopsStr})`;
  }
}
