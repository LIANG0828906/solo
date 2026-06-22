import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  clearCanvas as clearCanvasUtil,
  drawGrid,
  drawPath,
  drawKeyframes,
  drawBezierPath,
  drawTrail,
  getCanvasCoords,
} from '@/utils/canvas';
import { generateBezierPath, getPositionOnPath, offsetPathPoints } from '@/utils/bezier';
import type { DrawOptions } from '@/utils/canvas';
import type { PathPoint } from '@/types';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRID_SIZE = 20;
const LINE_WIDTH = 4;
const ERASER_WIDTH = 20;

interface DrawCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const DrawCanvas: React.FC<DrawCanvasProps> = ({ canvasRef }) => {
  const internalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const pathPoints = useAppStore((state) => state.pathPoints);
  const drawTool = useAppStore((state) => state.drawTool);
  const addPathPoint = useAppStore((state) => state.addPathPoint);
  const clearCanvas = useAppStore((state) => state.clearCanvas);
  const keyframes = useAppStore((state) => state.keyframes);
  const addKeyframe = useAppStore((state) => state.addKeyframe);
  const currentScheme = useAppStore((state) => state.currentScheme);
  const animation = useAppStore((state) => state.animation);
  const setTrailPoints = useAppStore((state) => state.setTrailPoints);
  const setCurrentFrame = useAppStore((state) => state.setCurrentFrame);

  const getCanvas = useCallback((): HTMLCanvasElement | null => {
    return (canvasRef as React.RefObject<HTMLCanvasElement>).current || internalCanvasRef.current;
  }, [canvasRef]);

  const drawOptions: DrawOptions = {
    lineColor: currentScheme.primary,
    lineWidth: LINE_WIDTH,
    eraserWidth: ERASER_WIDTH,
    eraserColor: '#FFFFFF',
  };

  const render = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgColor = currentScheme.secondary;
    clearCanvasUtil(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, bgColor);
    drawGrid(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE);

    const bezierPath = generateBezierPath(keyframes);
    drawBezierPath(ctx, bezierPath);

    let pointsToRender: PathPoint[] = pathPoints;
    let trailToRender = animation.trailPoints;

    if (animation.isPlaying && bezierPath.length > 1) {
      const progress = (animation.currentFrame % bezierPath.length) / bezierPath.length;
      const position = getPositionOnPath(bezierPath, progress);

      if (pathPoints.length > 0) {
        const minX = Math.min(...pathPoints.map((p) => p.x));
        const minY = Math.min(...pathPoints.map((p) => p.y));
        const offsetX = position.x - minX;
        const offsetY = position.y - minY;
        pointsToRender = offsetPathPoints(pathPoints, offsetX, offsetY);

        const currentTrailPoint: PathPoint = {
          id: `trail-${Date.now()}`,
          x: position.x,
          y: position.y,
          timestamp: Date.now(),
          isEraser: false,
        };

        const newTrail = [...animation.trailPoints, currentTrailPoint].slice(-80);
        trailToRender = newTrail;
        setTrailPoints(newTrail);
      }
    }

    drawPath(ctx, pointsToRender, drawOptions);
    drawTrail(ctx, trailToRender, currentScheme.primary);
    drawKeyframes(ctx, keyframes);
  }, [
    getCanvas,
    pathPoints,
    keyframes,
    currentScheme,
    animation,
    drawOptions,
    setTrailPoints,
  ]);

  useEffect(() => {
    let animationId: number;
    let lastTime = 0;
    const fpsInterval = 1000 / 60;

    const animate = (timestamp: number) => {
      animationId = requestAnimationFrame(animate);

      const elapsed = timestamp - lastTime;
      if (elapsed > fpsInterval) {
        lastTime = timestamp - (elapsed % fpsInterval);

        if (animation.isPlaying) {
          const frameIncrement = animation.speed * 2;
          setCurrentFrame(animation.currentFrame + frameIncrement);
        }

        render();
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [animation.isPlaying, animation.currentFrame, animation.speed, render, setCurrentFrame]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = getCanvas();
    if (!canvas) return;

    if (e.shiftKey) {
      const coords = getCanvasCoords(e, canvas);
      addKeyframe(coords);
      return;
    }

    setIsDrawing(true);
    const coords = getCanvasCoords(e, canvas);
    addPathPoint({
      x: coords.x,
      y: coords.y,
      isEraser: drawTool === 'eraser',
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = getCanvas();
    if (!canvas) return;

    const coords = getCanvasCoords(e, canvas);
    addPathPoint({
      x: coords.x,
      y: coords.y,
      isEraser: drawTool === 'eraser',
    });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleMouseLeave = () => {
    setIsDrawing(false);
  };

  return (
    <div className="draw-canvas-container">
      <div className="canvas-toolbar">
        <button
          type="button"
          className={`tool-btn ${drawTool === 'pen' ? 'active' : ''}`}
          onClick={() => useAppStore.getState().setDrawTool('pen')}
        >
          ✏️ 画笔
        </button>
        <button
          type="button"
          className={`tool-btn ${drawTool === 'eraser' ? 'active' : ''}`}
          onClick={() => useAppStore.getState().setDrawTool('eraser')}
        >
          🧹 橡皮擦
        </button>
        <button type="button" className="clear-btn" onClick={clearCanvas}>
          🗑️ 清空画布
        </button>
      </div>
      <canvas
        ref={(el) => {
          internalCanvasRef.current = el;
          if (canvasRef && 'current' in canvasRef) {
            (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
          }
        }}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: drawTool === 'eraser' ? 'cell' : 'crosshair' }}
      />
      <div className="canvas-hint">
        提示：按住 Shift 键点击画布可添加关键帧（最多10个）
      </div>
    </div>
  );
};
