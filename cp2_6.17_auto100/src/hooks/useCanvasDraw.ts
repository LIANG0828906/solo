import { useRef, useEffect, useCallback } from 'react';
import { useCanvasStore, DrawAction, Point, ToolType } from '../store/useCanvasStore';

interface UseCanvasDrawOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onRedrawNeeded?: () => void;
}

export function useCanvasDraw({ canvasRef, onRedrawNeeded }: UseCanvasDrawOptions) {
  const isDrawing = useRef(false);
  const currentPoints = useRef<Point[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const lastPoint = useRef<Point | null>(null);
  const lastDrawTime = useRef<number>(0);

  const tool = useCanvasStore((state) => state.tool);
  const color = useCanvasStore((state) => state.color);
  const lineWidth = useCanvasStore((state) => state.lineWidth);
  const addAction = useCanvasStore((state) => state.addAction);
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const getUndoStack = useCanvasStore((state) => state.getUndoStack);

  const getCanvasPoint = useCallback((e: MouseEvent | TouchEvent): Point | null => {
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
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }, [canvasRef]);

  const drawBrush = useCallback((ctx: CanvasRenderingContext2D, points: Point[], currentColor: string, currentWidth: number) => {
    if (points.length < 2) return;

    ctx.save();
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }

    if (points.length >= 2) {
      const last = points[points.length - 1];
      const prev = points[points.length - 2];
      ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y);
    }

    ctx.stroke();
    ctx.restore();
  }, []);

  const drawAirbrush = useCallback((ctx: CanvasRenderingContext2D, point: Point, currentColor: string, currentWidth: number) => {
    ctx.save();
    ctx.fillStyle = currentColor;
    ctx.globalCompositeOperation = 'source-over';

    const density = Math.floor(currentWidth * 2);
    const radius = currentWidth * 2;

    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      const x = point.x + Math.cos(angle) * r;
      const y = point.y + Math.sin(angle) * r;

      ctx.globalAlpha = 0.3 + Math.random() * 0.4;
      ctx.beginPath();
      ctx.arc(x, y, 1 + Math.random(), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }, []);

  const drawEraser = useCallback((ctx: CanvasRenderingContext2D, from: Point, to: Point, currentWidth: number) => {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = currentWidth * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  }, []);

  const drawSegment = useCallback((ctx: CanvasRenderingContext2D, from: Point, to: Point, currentTool: ToolType, currentColor: string, currentWidth: number) => {
    switch (currentTool) {
      case 'brush':
        drawBrush(ctx, [from, to], currentColor, currentWidth);
        break;
      case 'airbrush':
        drawAirbrush(ctx, to, currentColor, currentWidth);
        break;
      case 'eraser':
        drawEraser(ctx, from, to, currentWidth);
        break;
    }
  }, [drawBrush, drawAirbrush, drawEraser]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const actions = getUndoStack();
    actions.forEach((action) => {
      if (action.points.length < 2) return;

      if (action.tool === 'brush') {
        drawBrush(ctx, action.points, action.color, action.lineWidth);
      } else {
        for (let i = 1; i < action.points.length; i++) {
          drawSegment(ctx, action.points[i - 1], action.points[i], action.tool, action.color, action.lineWidth);
        }
      }
    });
  }, [canvasRef, getUndoStack, drawSegment, drawBrush]);

  const startDrawing = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (!point) return;

    isDrawing.current = true;
    currentPoints.current = [point];
    lastPoint.current = point;
  }, [getCanvasPoint]);

  const continueDrawing = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawing.current) return;
    e.preventDefault();

    const point = getCanvasPoint(e);
    if (!point || !lastPoint.current) return;

    currentPoints.current.push(point);

    const draw = (timestamp: number) => {
      if (timestamp - lastDrawTime.current < 20) {
        animationFrameId.current = requestAnimationFrame(draw);
        return;
      }
      lastDrawTime.current = timestamp;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx || !lastPoint.current) return;

      drawSegment(ctx, lastPoint.current!, point, tool, color, lineWidth);
      lastPoint.current = point;

      if (isDrawing.current) {
        animationFrameId.current = requestAnimationFrame(draw);
      }
    };

    if (!animationFrameId.current) {
      animationFrameId.current = requestAnimationFrame(draw);
    }
  }, [canvasRef, getCanvasPoint, drawSegment, tool, color, lineWidth]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    if (currentPoints.current.length >= 2) {
      const action: Omit<DrawAction, 'id'> = {
        tool,
        color,
        lineWidth,
        points: [...currentPoints.current],
      };
      addAction(action);
    }

    currentPoints.current = [];
    lastPoint.current = null;
  }, [tool, color, lineWidth, addAction]);

  const handleUndo = useCallback(() => {
    const action = undo();
    if (action) {
      redrawCanvas();
      onRedrawNeeded?.();
    }
    return action;
  }, [undo, redrawCanvas, onRedrawNeeded]);

  const handleRedo = useCallback(() => {
    const action = redo();
    if (action) {
      redrawCanvas();
      onRedrawNeeded?.();
    }
    return action;
  }, [redo, redrawCanvas, onRedrawNeeded]);

  const exportToPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.fillStyle = '#1E1E2E';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);

    const dataURL = tempCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `sketchpulse-export-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => startDrawing(e);
    const handleMouseMove = (e: MouseEvent) => continueDrawing(e);
    const handleMouseUp = () => stopDrawing();
    const handleMouseLeave = () => stopDrawing();

    const handleTouchStart = (e: TouchEvent) => startDrawing(e);
    const handleTouchMove = (e: TouchEvent) => continueDrawing(e);
    const handleTouchEnd = () => stopDrawing();

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);

      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);

      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [canvasRef, startDrawing, continueDrawing, stopDrawing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1E1E2E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [canvasRef]);

  return {
    redrawCanvas,
    handleUndo,
    handleRedo,
    exportToPNG,
  };
}
