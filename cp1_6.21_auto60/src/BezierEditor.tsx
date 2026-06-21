import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Point } from './MorphEngine';

interface BezierEditorProps {
  controlPoints: [Point, Point];
  onChange: (points: [Point, Point]) => void;
  onReset: () => void;
}

const CANVAS_SIZE = 300;
const PADDING = 20;
const POINT_RADIUS = 8;
const GRAPH_SIZE = CANVAS_SIZE - PADDING * 2;

const BezierEditor: React.FC<BezierEditorProps> = ({ controlPoints, onChange, onReset }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const toCanvasCoord = useCallback((p: Point): Point => {
    return {
      x: PADDING + p.x * GRAPH_SIZE,
      y: PADDING + (1 - p.y) * GRAPH_SIZE
    };
  }, []);

  const fromCanvasCoord = useCallback((x: number, y: number): Point => {
    return {
      x: Math.max(0, Math.min(1, (x - PADDING) / GRAPH_SIZE)),
      y: Math.max(0, Math.min(1, 1 - (y - PADDING) / GRAPH_SIZE))
    };
  }, []);

  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement> | MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }, []);

  const getTouchPos = useCallback((e: TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY
    };
  }, []);

  const findHitPoint = useCallback((mousePos: Point): number | null => {
    for (let i = 0; i < controlPoints.length; i++) {
      const cp = toCanvasCoord(controlPoints[i]);
      const dx = mousePos.x - cp.x;
      const dy = mousePos.y - cp.y;
      if (Math.sqrt(dx * dx + dy * dy) <= POINT_RADIUS * 2) {
        return i;
      }
    }
    return null;
  }, [controlPoints, toCanvasCoord]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const mousePos = getMousePos(e);
    const hitIndex = findHitPoint(mousePos);
    if (hitIndex !== null) {
      setDraggingIndex(hitIndex);
    }
  }, [getMousePos, findHitPoint]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggingIndex === null) return;
    const mousePos = { x: e.clientX, y: e.clientY };
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (mousePos.x - rect.left) * scaleX;
    const canvasY = (mousePos.y - rect.top) * scaleY;
    const newPoint = fromCanvasCoord(canvasX, canvasY);
    const newPoints: [Point, Point] = [...controlPoints] as [Point, Point];
    newPoints[draggingIndex] = newPoint;
    onChange(newPoints);
  }, [draggingIndex, controlPoints, fromCanvasCoord, onChange]);

  const handleMouseUp = useCallback(() => {
    setDraggingIndex(null);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const nativeEvent = e.nativeEvent as unknown as TouchEvent;
    const touchPos = getTouchPos(nativeEvent);
    if (!touchPos) return;
    const hitIndex = findHitPoint(touchPos);
    if (hitIndex !== null) {
      e.preventDefault();
      setDraggingIndex(hitIndex);
    }
  }, [getTouchPos, findHitPoint]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (draggingIndex === null) return;
    const touchPos = getTouchPos(e);
    if (!touchPos) return;
    e.preventDefault();
    const newPoint = fromCanvasCoord(touchPos.x, touchPos.y);
    const newPoints: [Point, Point] = [...controlPoints] as [Point, Point];
    newPoints[draggingIndex] = newPoint;
    onChange(newPoints);
  }, [draggingIndex, controlPoints, fromCanvasCoord, onChange]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const pos = PADDING + (i / 4) * GRAPH_SIZE;
      ctx.beginPath();
      ctx.moveTo(PADDING, pos);
      ctx.lineTo(PADDING + GRAPH_SIZE, pos);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos, PADDING);
      ctx.lineTo(pos, PADDING + GRAPH_SIZE);
      ctx.stroke();
    }

    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 2;
    ctx.strokeRect(PADDING, PADDING, GRAPH_SIZE, GRAPH_SIZE);

    ctx.strokeStyle = '#BDBDBD';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    const start = toCanvasCoord({ x: 0, y: 0 });
    const end = toCanvasCoord({ x: 1, y: 1 });
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);

    const p0 = toCanvasCoord({ x: 0, y: 0 });
    const p1 = toCanvasCoord(controlPoints[0]);
    const p2 = toCanvasCoord(controlPoints[1]);
    const p3 = toCanvasCoord({ x: 1, y: 1 });

    ctx.strokeStyle = '#90CAF9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p3.x, p3.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    ctx.strokeStyle = '#667EEA';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    ctx.stroke();

    ctx.fillStyle = '#4FC3F7';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    for (const cp of controlPoints) {
      const cpCanvas = toCanvasCoord(cp);
      ctx.beginPath();
      ctx.arc(cpCanvas.x, cpCanvas.y, POINT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = '#333333';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('(0,0)', PADDING + 2, PADDING + GRAPH_SIZE - 2);
    ctx.textAlign = 'right';
    ctx.fillText('(1,1)', PADDING + GRAPH_SIZE - 2, PADDING + 12);

  }, [controlPoints, toCanvasCoord]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px',
      gap: '12px'
    }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          cursor: draggingIndex !== null ? 'grabbing' : 'grab',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      />
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
          <span>控制点 1:</span>
          <span style={{ color: '#4FC3F7', fontWeight: 600 }}>
            ({controlPoints[0].x.toFixed(2)}, {controlPoints[0].y.toFixed(2)})
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
          <span>控制点 2:</span>
          <span style={{ color: '#4FC3F7', fontWeight: 600 }}>
            ({controlPoints[1].x.toFixed(2)}, {controlPoints[1].y.toFixed(2)})
          </span>
        </div>
      </div>
      <button
        onClick={onReset}
        style={{
          width: '100%',
          padding: '8px 16px',
          border: '1px solid #DEE2E6',
          borderRadius: '6px',
          backgroundColor: '#FFFFFF',
          color: '#495057',
          fontSize: '13px',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#F8F9FA';
          e.currentTarget.style.borderColor = '#ADB5BD';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#FFFFFF';
          e.currentTarget.style.borderColor = '#DEE2E6';
        }}
      >
        重置为默认缓动
      </button>
    </div>
  );
};

export default BezierEditor;
