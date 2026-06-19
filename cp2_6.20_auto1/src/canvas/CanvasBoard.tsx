import React, { useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Point, ToolType, DrawingPath } from '../types';
import { redrawAll, drawPreview, densifyPoints } from './draw';

interface CanvasBoardProps {
  drawings: DrawingPath[];
  tool: ToolType;
  color: string;
  lineWidth: number;
  onDrawEnd: (path: DrawingPath) => void;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
}

const CanvasBoard: React.FC<CanvasBoardProps> = ({
  drawings,
  tool,
  color,
  lineWidth,
  onDrawEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef<Point[]>([]);
  const lastPointRef = useRef<Point | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const needsRedrawRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  const getCanvasPoint = useCallback((clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    redrawAll(ctx, drawings, rect.width, rect.height);

    if (isDrawingRef.current && currentPathRef.current.length > 0) {
      drawPreview(ctx, tool, currentPathRef.current, color, lineWidth);
    }

    needsRedrawRef.current = false;
  }, [drawings, tool, color, lineWidth]);

  const requestRender = useCallback(() => {
    if (needsRedrawRef.current) return;
    needsRedrawRef.current = true;
    if (animationFrameRef.current) return;
    animationFrameRef.current = requestAnimationFrame(() => {
      animationFrameRef.current = null;
      render();
    });
  }, [render]);

  useEffect(() => {
    requestRender();
  }, [drawings, requestRender]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
      requestRender();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [requestRender]);

  const addPointWithInterpolation = useCallback((point: Point) => {
    if (lastPointRef.current) {
      const interpolated = densifyPoints([lastPointRef.current, point], 2);
      if (interpolated.length > 2) {
        currentPathRef.current.push(...interpolated.slice(1, -1));
      }
    }
    currentPathRef.current.push(point);
    lastPointRef.current = point;
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointerIdRef.current !== null) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (canvas && canvas.setPointerCapture) {
      canvas.setPointerCapture(e.pointerId);
    }
    pointerIdRef.current = e.pointerId;

    isDrawingRef.current = true;
    const point = getCanvasPoint(e.clientX, e.clientY);
    currentPathRef.current = [point];
    lastPointRef.current = point;
    requestRender();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || e.pointerId !== pointerIdRef.current) return;
    e.preventDefault();

    const point = getCanvasPoint(e.clientX, e.clientY);
    addPointWithInterpolation(point);
    requestRender();
  };

  const endDrawing = useCallback((pointerId: number) => {
    if (pointerId !== pointerIdRef.current) return;
    if (!isDrawingRef.current) {
      pointerIdRef.current = null;
      return;
    }

    const canvas = canvasRef.current;
    if (canvas && canvas.releasePointerCapture) {
      try {
        canvas.releasePointerCapture(pointerId);
      } catch (_) {
        // ignore errors
      }
    }

    isDrawingRef.current = false;
    pointerIdRef.current = null;

    if (currentPathRef.current.length >= 2) {
      const newPath: DrawingPath = {
        id: uuidv4(),
        type: tool,
        points: [...currentPathRef.current],
        color,
        lineWidth,
      };
      onDrawEnd(newPath);
    } else if (currentPathRef.current.length === 1 && tool === 'pen') {
      const singlePoint = currentPathRef.current[0];
      const offset = Math.max(lineWidth / 4, 1);
      const newPath: DrawingPath = {
        id: uuidv4(),
        type: tool,
        points: [
          singlePoint,
          { x: singlePoint.x + offset, y: singlePoint.y + offset },
        ],
        color,
        lineWidth,
      };
      onDrawEnd(newPath);
    }

    currentPathRef.current = [];
    lastPointRef.current = null;
    requestRender();
  }, [tool, color, lineWidth, onDrawEnd, requestRender]);

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    endDrawing(e.pointerId);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    endDrawing(e.pointerId);
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawingRef.current && e.pointerId === pointerIdRef.current) {
      endDrawing(e.pointerId);
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          backgroundColor: '#f0f0f0',
          cursor: 'crosshair',
          display: 'block',
          width: '100%',
          height: '100%',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerLeave}
      />
    </div>
  );
};

export default CanvasBoard;
