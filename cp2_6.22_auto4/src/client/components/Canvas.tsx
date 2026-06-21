import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DrawPath, Point, ToolSettings } from '../../shared/types';

interface CanvasProps {
  toolSettings: ToolSettings;
  onDrawPath: (path: DrawPath) => void;
  onClear: () => void;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
}

export interface CanvasWithMethods extends HTMLCanvasElement {
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
}

const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(({ toolSettings, onDrawPath, onClear, onHistoryChange }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<DrawPath | null>(null);
  const historyRef = useRef<DrawPath[]>([]);
  const historyIndexRef = useRef(-1);

  useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement);

  const notifyHistoryChange = useCallback(() => {
    if (onHistoryChange) {
      onHistoryChange(
        historyIndexRef.current >= 0,
        historyIndexRef.current < historyRef.current.length - 1
      );
    }
  }, [onHistoryChange]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx && canvas.width > 0 && canvas.height > 0) {
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCtx.drawImage(canvas, 0, 0);
    }

    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    const ctx = canvas.getContext('2d');
    if (ctx && tempCanvas.width > 0) {
      ctx.drawImage(tempCanvas, 0, 0);
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  const getMousePos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getMousePos(e);
    const path: DrawPath = {
      id: uuidv4(),
      userId: 'local',
      points: [point],
      color: toolSettings.color,
      size: toolSettings.size,
      isEraser: toolSettings.type === 'eraser',
    };
    setCurrentPath(path);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentPath) return;
    e.preventDefault();

    const point = getMousePos(e);
    const newPath = {
      ...currentPath,
      points: [...currentPath.points, point],
    };

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const points = newPath.points;
    if (points.length >= 2) {
      ctx.save();
      ctx.strokeStyle = newPath.isEraser ? '#ffffff' : newPath.color;
      ctx.lineWidth = newPath.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (newPath.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
      }

      ctx.beginPath();
      const startIdx = Math.max(0, points.length - 2);
      ctx.moveTo(points[startIdx].x, points[startIdx].y);
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.stroke();
      ctx.restore();
    }

    setCurrentPath(newPath);
  };

  const stopDrawing = () => {
    if (!isDrawing || !currentPath) return;

    if (currentPath.points.length > 1) {
      const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
      newHistory.push(currentPath);
      historyRef.current = newHistory;
      historyIndexRef.current = newHistory.length - 1;

      onDrawPath(currentPath);
      notifyHistoryChange();
    }

    setIsDrawing(false);
    setCurrentPath(null);
  };

  const redrawCanvas = useCallback((paths: DrawPath[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      if (path.points.length < 2) continue;

      ctx.save();
      ctx.strokeStyle = path.isEraser ? '#ffffff' : path.color;
      ctx.lineWidth = path.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (path.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
      }

      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let j = 1; j < path.points.length; j++) {
        ctx.lineTo(path.points[j].x, path.points[j].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current < 0) return;

    historyIndexRef.current = historyIndexRef.current - 1;

    const paths = historyRef.current.slice(0, historyIndexRef.current + 1);
    redrawCanvas(paths);
    notifyHistoryChange();
  }, [redrawCanvas, notifyHistoryChange]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;

    historyIndexRef.current = historyIndexRef.current + 1;

    const paths = historyRef.current.slice(0, historyIndexRef.current + 1);
    redrawCanvas(paths);
    notifyHistoryChange();
  }, [redrawCanvas, notifyHistoryChange]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    historyRef.current = [];
    historyIndexRef.current = -1;
    onClear();
    notifyHistoryChange();
  }, [onClear, notifyHistoryChange]);

  useEffect(() => {
    const canvas = canvasRef.current as CanvasWithMethods | null;
    if (!canvas) return;
    canvas.undo = undo;
    canvas.redo = redo;
    canvas.clearCanvas = clearCanvas;
  }, [undo, redo, clearCanvas]);

  useEffect(() => {
    notifyHistoryChange();
  }, [notifyHistoryChange]);

  return (
    <canvas
      ref={canvasRef}
      className="whiteboard-canvas"
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
    />
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
