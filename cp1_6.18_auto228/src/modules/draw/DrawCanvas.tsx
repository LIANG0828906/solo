import React, { useRef, useEffect, useCallback } from 'react';
import { useAppStore, Point2D } from '../../store/appStore';

const DrawCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSampleTime = useRef<number>(0);
  const currentPath = useRef<Point2D[]>([]);
  const animationFrame = useRef<number>(0);

  const {
    isDrawing,
    pathColor,
    addPathPoint,
    setIsDrawing,
    setLastDrawTime,
    setGrowthPhase,
    setPathPoints,
    pathPoints
  } = useAppStore();

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  const draw2DPath = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (pathPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length; i++) {
        const t = i / (pathPoints.length - 1);
        const r1 = parseInt('#FF6B6B'.slice(1, 3), 16);
        const g1 = parseInt('#FF6B6B'.slice(3, 5), 16);
        const b1 = parseInt('#FF6B6B'.slice(5, 7), 16);
        const r2 = parseInt('#4FC3F7'.slice(1, 3), 16);
        const g2 = parseInt('#4FC3F7'.slice(3, 5), 16);
        const b2 = parseInt('#4FC3F7'.slice(5, 7), 16);
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        ctx.strokeStyle = `rgb(${r},${g},${b})`;
        ctx.lineWidth = 1.5 + t * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
      }
      ctx.stroke();
    }

    if (currentPath.current.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = pathColor;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(currentPath.current[0].x, currentPath.current[0].y);
      for (let i = 1; i < currentPath.current.length; i++) {
        ctx.lineTo(currentPath.current[i].x, currentPath.current[i].y);
      }
      ctx.stroke();
    }

    animationFrame.current = requestAnimationFrame(draw2DPath);
  }, [pathPoints, pathColor]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animationFrame.current = requestAnimationFrame(draw2DPath);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrame.current);
    };
  }, [resizeCanvas, draw2DPath]);

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): Point2D | null => {
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
      y: clientY - rect.top,
      timestamp: Date.now()
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (!point) return;
    currentPath.current = [point];
    setPathPoints([]);
    addPathPoint(point);
    setIsDrawing(true);
    setGrowthPhase('drawing');
    lastSampleTime.current = point.timestamp;
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const now = Date.now();
    if (now - lastSampleTime.current < 20) return;
    const point = getCanvasPoint(e);
    if (!point) return;
    currentPath.current.push(point);
    addPathPoint(point);
    lastSampleTime.current = now;
    setLastDrawTime(now);
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    setIsDrawing(false);
    currentPath.current = [];
    const stopTime = Date.now();
    setLastDrawTime(stopTime);

    setTimeout(() => {
      const state = useAppStore.getState();
      if (!state.isDrawing && Date.now() - state.lastDrawTime >= 490) {
        setGrowthPhase('growing');
        setTimeout(() => {
          setGrowthPhase('complete');
        }, 3000);
      }
    }, 500);
  };

  return (
    <div className="canvas-overlay" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="canvas-element"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />
    </div>
  );
};

export default DrawCanvas;
