import React, { useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Point, ToolType, DrawingPath } from '../types';
import { redrawAll, drawPreview } from './draw';

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
  const animationFrameRef = useRef<number | null>(null);
  const needsRedrawRef = useRef(false);

  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
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
        ctx.scale(dpr, dpr);
      }
      requestRender();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [requestRender]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    const point = getCanvasPoint(e);
    currentPathRef.current = [point];
    requestRender();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const point = getCanvasPoint(e);
    currentPathRef.current.push(point);
    requestRender();
  };

  const handleMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentPathRef.current.length >= 2) {
      const newPath: DrawingPath = {
        id: uuidv4(),
        type: tool,
        points: [...currentPathRef.current],
        color,
        lineWidth,
      };
      onDrawEnd(newPath);
    }

    currentPathRef.current = [];
    requestRender();
  };

  const handleMouseLeave = () => {
    if (isDrawingRef.current) {
      handleMouseUp();
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
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
};

export default CanvasBoard;
