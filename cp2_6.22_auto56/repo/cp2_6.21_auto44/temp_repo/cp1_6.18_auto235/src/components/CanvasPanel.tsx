import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAppStore, Point2D } from '@/store/appStore';

const CANVAS_SIZE = 500;
const GRID_SIZE = 25;
const SAMPLE_INTERVAL = 5;
const LINE_WIDTH = 4;
const LINE_COLOR = '#212529';
const BG_COLOR = '#F8F9FA';
const GRID_COLOR = '#DEE2E6';

export const CanvasPanel: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point2D[]>([]);
  const [strokes, setStrokes] = useState<Point2D[][]>([]);

  const skeleton = useAppStore((s) => s.skeleton);
  const setSkeleton = useAppStore((s) => s.setSkeleton);
  const resetCanvas = useAppStore((s) => s.resetCanvas);
  const generateLattice = useAppStore((s) => s.generateLattice);
  const isGenerating = useAppStore((s) => s.isGenerating);
  const isGenerated = useAppStore((s) => s.isGenerated);
  const error = useAppStore((s) => s.error);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    for (let x = 0; x <= CANVAS_SIZE; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_SIZE; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_SIZE, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }, []);

  const drawStroke = useCallback(
    (ctx: CanvasRenderingContext2D, points: Point2D[]) => {
      if (points.length < 2) return;
      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    },
    []
  );

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawGrid(ctx);
    strokes.forEach((stroke) => drawStroke(ctx, stroke));
    if (currentPath.length > 0) drawStroke(ctx, currentPath);
  }, [drawGrid, drawStroke, strokes, currentPath]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const samplePoints = (points: Point2D[]): Point2D[] => {
    if (points.length <= 1) return points;
    const sampled: Point2D[] = [points[0]];
    let accDist = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      accDist += dist;
      if (accDist >= SAMPLE_INTERVAL) {
        sampled.push(points[i]);
        accDist = 0;
      }
    }
    if (sampled[sampled.length - 1] !== points[points.length - 1]) {
      sampled.push(points[points.length - 1]);
    }
    return sampled;
  };

  const updateSkeleton = (allStrokes: Point2D[][]) => {
    const combined: Point2D[] = [];
    allStrokes.forEach((stroke) => {
      const sampled = samplePoints(stroke);
      combined.push(...sampled);
    });
    setSkeleton(combined);
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>): Point2D => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPos(e);
    setIsDrawing(true);
    setCurrentPath([pos]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    setCurrentPath((prev) => [...prev, pos]);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.length >= 2) {
      const newStrokes = [...strokes, currentPath];
      setStrokes(newStrokes);
      updateSkeleton(newStrokes);
    }
    setCurrentPath([]);
  };

  const handleReset = () => {
    setStrokes([]);
    setCurrentPath([]);
    resetCanvas();
  };

  const statusText = isGenerating
    ? '生成中...'
    : isGenerated
      ? '生成完成 - 可调节右侧参数或重新绘制'
      : error
        ? `错误: ${error}`
        : '绘制阶段 - 请在左侧画板绘制轮廓';

  const statusClass = isGenerating
    ? 'status-bar status-generating'
    : isGenerated
      ? 'status-bar status-done'
      : error
        ? 'status-bar status-error'
        : 'status-bar status-drawing';

  return (
    <div className="canvas-panel">
      <div className={statusClass}>
        <span className="status-icon">{isGenerating ? '⏳' : isGenerated ? '✨' : error ? '⚠️' : '✏️'}</span>
        <span className="status-text">{statusText}</span>
      </div>

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="drawing-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      <div className="canvas-info">
        <span className="skeleton-count">骨架点数: {skeleton.length}</span>
      </div>

      <div className="canvas-actions">
        <button className="btn-primary" onClick={generateLattice} disabled={isGenerating || skeleton.length < 2}>
          {isGenerating ? '生成中...' : '生 成'}
        </button>
        <button className="btn-secondary" onClick={handleReset} disabled={isGenerating}>
          重 置
        </button>
      </div>
    </div>
  );
};
