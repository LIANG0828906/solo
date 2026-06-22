import { useRef, useEffect, useCallback } from 'react';
import { useStarStore } from '@/store/starStore';
import { worldToScreen, formatDistance, getMidpoint } from '@/utils/coordinates';
import * as THREE from 'three';
import './ConstellationEditor.css';

export function ConstellationEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationId = useRef<number | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const dpr = window.devicePixelRatio || 1;

  useEffect(() => {
    const getCamera = () => {
      const canvas = document.querySelector('.app-container canvas:first-of-type');
      if (canvas) {
        const fiber = (canvas as any).__r3f;
        if (fiber && fiber.state) {
          cameraRef.current = fiber.state.camera as THREE.PerspectiveCamera;
        }
      }
    };
    
    getCamera();
    const interval = setInterval(getCamera, 1000);
    return () => clearInterval(interval);
  }, []);

  const stars = useStarStore((state) => state.stars);
  const constellationLines = useStarStore((state) => state.constellationLines);
  const isDragging = useStarStore((state) => state.isDragging);
  const dragStartStarId = useStarStore((state) => state.dragStartStarId);
  const dragCurrentPosition = useStarStore((state) => state.dragCurrentPosition);
  const getStarById = useStarStore((state) => state.getStarById);

  const getStarScreenPos = useCallback(
    (starId: string) => {
      const star = getStarById(starId);
      if (!star || !cameraRef.current) return null;

      const { x, y, visible } = worldToScreen(
        [star.x, star.y, star.z],
        cameraRef.current,
        window.innerWidth,
        window.innerHeight
      );

      return { x, y, visible, star };
    },
    [getStarById]
  );

  const drawCurvedLine = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      progress: number = 1
    ) => {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2 - 30;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(midX, midY, x2, y2);
      ctx.stroke();
    },
    []
  );

  const drawGlowLine = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x1: number,
      y1: number,
      x2: number,
      y2: number
    ) => {
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
      gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.6)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.save();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 4;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 15;

      drawCurvedLine(ctx, x1, y1, x2, y2);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      drawCurvedLine(ctx, x1, y1, x2, y2);
      ctx.restore();
    },
    [drawCurvedLine]
  );

  const drawDistanceLabel = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      distance: number
    ) => {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2 - 15;

      const text = formatDistance(distance);
      ctx.font = '12px "Courier New", monospace';
      const textWidth = ctx.measureText(text).width;
      const padding = 6;

      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.roundRect(midX - textWidth / 2 - padding, midY - 8, textWidth + padding * 2, 18, 4);
      ctx.fill();

      ctx.fillStyle = 'rgba(232, 232, 240, 0.9)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, midX, midY + 1);
      ctx.restore();
    },
    []
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    constellationLines.forEach((line) => {
      const start = getStarScreenPos(line.startStarId);
      const end = getStarScreenPos(line.endStarId);

      if (start && end && start.visible && end.visible) {
        drawGlowLine(ctx, start.x, start.y, end.x, end.y);
        drawDistanceLabel(ctx, start.x, start.y, end.x, end.y, line.distance);
      }
    });

    if (isDragging && dragStartStarId && dragCurrentPosition && cameraRef.current) {
      const start = getStarScreenPos(dragStartStarId);
      if (start && start.visible) {
        const { x: endX, y: endY } = worldToScreen(
          [dragCurrentPosition.x, dragCurrentPosition.y, dragCurrentPosition.z],
          cameraRef.current,
          window.innerWidth,
          window.innerHeight
        );

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        drawCurvedLine(ctx, start.x, start.y, endX, endY);
        ctx.restore();
      }
    }

    animationId.current = requestAnimationFrame(render);
  }, [
    constellationLines,
    isDragging,
    dragStartStarId,
    dragCurrentPosition,
    getStarScreenPos,
    drawGlowLine,
    drawDistanceLabel,
    drawCurvedLine,
  ]);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, [dpr]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  useEffect(() => {
    animationId.current = requestAnimationFrame(render);

    return () => {
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
    };
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      className="constellation-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    />
  );
}
