import React, { useRef, useEffect, useCallback } from 'react';
import { FunctionConfig, ViewTransform, Point, Particle } from '../types';
import { evaluateFunction } from '../utils/mathParser';

interface FunctionPlotterProps {
  functions: FunctionConfig[];
  viewTransform: ViewTransform;
  onViewTransformChange: (transform: ViewTransform) => void;
}

const TRAIL_LENGTH = 30;
const PARTICLES_PER_FUNCTION = 80;
const MAX_TOTAL_PARTICLES = 10000;
const X_RANGE = [-15, 15];

const FunctionPlotter: React.FC<FunctionPlotterProps> = ({
  functions,
  viewTransform,
  onViewTransformChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Map<string, Particle[]>>(new Map());
  const pointsCacheRef = useRef<Map<string, Point[]>>(new Map());
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const targetTransformRef = useRef(viewTransform);
  const currentTransformRef = useRef(viewTransform);

  useEffect(() => {
    targetTransformRef.current = viewTransform;
  }, [viewTransform]);

  const interpolateTransform = useCallback(() => {
    const target = targetTransformRef.current;
    const current = currentTransformRef.current;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const t = 0.12;

    currentTransformRef.current = {
      offsetX: lerp(current.offsetX, target.offsetX, t),
      offsetY: lerp(current.offsetY, target.offsetY, t),
      scale: lerp(current.scale, target.scale, t),
    };
  }, []);

  const initParticles = useCallback((funcId: string) => {
    const count = Math.min(PARTICLES_PER_FUNCTION, Math.floor(MAX_TOTAL_PARTICLES / Math.max(1, functions.length)));
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        progress: i / count,
        speed: 0.0008 + Math.random() * 0.0006,
        size: 2 + Math.random() * 2,
        trail: [],
      });
    }
    particlesRef.current.set(funcId, particles);
  }, [functions.length]);

  const getPointOnCurve = useCallback((points: Point[], progress: number): Point | null => {
    if (points.length < 2) return null;
    const t = Math.max(0, Math.min(1, progress));
    const index = t * (points.length - 1);
    const i = Math.floor(index);
    const frac = index - i;
    if (i >= points.length - 1) {
      return points[points.length - 1];
    }
    return {
      x: points[i].x + (points[i + 1].x - points[i].x) * frac,
      y: points[i].y + (points[i + 1].y - points[i].y) * frac,
    };
  }, []);

  const worldToScreen = useCallback(
    (x: number, y: number, width: number, height: number) => {
      const transform = currentTransformRef.current;
      const centerX = width / 2;
      const centerY = height / 2;
      return {
        sx: centerX + (x * transform.scale) + transform.offsetX,
        sy: centerY - (y * transform.scale) + transform.offsetY,
      };
    },
    []
  );

  const screenToWorld = useCallback(
    (sx: number, sy: number, width: number, height: number) => {
      const transform = currentTransformRef.current;
      const centerX = width / 2;
      const centerY = height / 2;
      return {
        x: (sx - centerX - transform.offsetX) / transform.scale,
        y: -(sy - centerY - transform.offsetY) / transform.scale,
      };
    },
    []
  );

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const transform = currentTransformRef.current;
      const scale = transform.scale;

      let gridSize = 5;
      if (scale < 30) gridSize = 5;
      else if (scale < 80) gridSize = 2;
      else if (scale < 150) gridSize = 1;
      else if (scale < 300) gridSize = 0.5;
      else gridSize = 0.2;

      const topLeft = screenToWorld(0, 0, width, height);
      const bottomRight = screenToWorld(width, height, width, height);

      const startX = Math.floor(topLeft.x / gridSize) * gridSize;
      const endX = Math.ceil(bottomRight.x / gridSize) * gridSize;
      const startY = Math.floor(bottomRight.y / gridSize) * gridSize;
      const endY = Math.ceil(topLeft.y / gridSize) * gridSize;

      ctx.strokeStyle = 'rgba(100, 150, 200, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      for (let x = startX; x <= endX; x += gridSize) {
        const p1 = worldToScreen(x, topLeft.y, width, height);
        const p2 = worldToScreen(x, bottomRight.y, width, height);
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();
      }

      for (let y = startY; y <= endY; y += gridSize) {
        const p1 = worldToScreen(topLeft.x, y, width, height);
        const p2 = worldToScreen(bottomRight.x, y, width, height);
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();
      }

      ctx.setLineDash([]);

      ctx.strokeStyle = 'rgba(150, 200, 255, 0.4)';
      ctx.lineWidth = 2;

      const xAxisY1 = worldToScreen(topLeft.x, 0, width, height);
      if (xAxisY1.sy >= 0 && xAxisY1.sy <= height) {
        ctx.beginPath();
        ctx.moveTo(0, xAxisY1.sy);
        ctx.lineTo(width, xAxisY1.sy);
        ctx.stroke();
      }

      const yAxisX1 = worldToScreen(0, topLeft.y, width, height);
      if (yAxisX1.sx >= 0 && yAxisX1.sx <= width) {
        ctx.beginPath();
        ctx.moveTo(yAxisX1.sx, 0);
        ctx.lineTo(yAxisX1.sx, height);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(150, 200, 255, 0.6)';
      ctx.font = '12px "Segoe UI", sans-serif';

      for (let x = startX; x <= endX; x += gridSize) {
        if (Math.abs(x) < 0.001) continue;
        const p = worldToScreen(x, 0, width, height);
        if (p.sy >= 0 && p.sy <= height) {
          const label = Math.abs(x) >= 1 ? x.toFixed(0) : x.toFixed(1);
          ctx.fillText(label, p.sx - 10, Math.min(Math.max(p.sy + 16, 16), height - 4));
        }
      }

      for (let y = startY; y <= endY; y += gridSize) {
        if (Math.abs(y) < 0.001) continue;
        const p = worldToScreen(0, y, width, height);
        if (p.sx >= 0 && p.sx <= width) {
          const label = Math.abs(y) >= 1 ? y.toFixed(0) : y.toFixed(1);
          ctx.fillText(label, Math.max(p.sx + 6, 4), p.sy + 4);
        }
      }
    },
    [worldToScreen, screenToWorld]
  );

  const drawParticles = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      functions.forEach((func) => {
        if (!func.visible) return;

        const cacheKey = `${func.id}_${func.expression}_${func.amplitude}_${func.frequency}_${func.phase}`;
        let points = pointsCacheRef.current.get(cacheKey);
        if (!points) {
          points = evaluateFunction(
            func.expression,
            X_RANGE[0],
            X_RANGE[1],
            func.amplitude,
            func.frequency,
            func.phase
          );
          pointsCacheRef.current.set(cacheKey, points);
        }

        let particles = particlesRef.current.get(func.id);
        if (!particles) {
          initParticles(func.id);
          particles = particlesRef.current.get(func.id)!;
        }

        particles.forEach((particle) => {
          particle.progress += particle.speed;
          if (particle.progress > 1) {
            particle.progress = 0;
            particle.trail = [];
          }

          const pos = getPointOnCurve(points!, particle.progress);
          if (pos) {
            particle.trail.unshift(pos);
            if (particle.trail.length > TRAIL_LENGTH) {
              particle.trail.pop();
            }
          }

          for (let i = 0; i < particle.trail.length - 1; i++) {
            const t1 = particle.trail[i];
            const t2 = particle.trail[i + 1];
            const alpha = 1 - i / TRAIL_LENGTH;
            const p1 = worldToScreen(t1.x, t1.y, width, height);
            const p2 = worldToScreen(t2.x, t2.y, width, height);

            ctx.strokeStyle = hexToRgba(func.color, alpha * 0.8);
            ctx.lineWidth = particle.size * (1 - i / TRAIL_LENGTH) * 0.8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(p1.sx, p1.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.stroke();
          }

          if (particle.trail.length > 0) {
            const head = particle.trail[0];
            const p = worldToScreen(head.x, head.y, width, height);
            const gradient = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, particle.size * 3);
            gradient.addColorStop(0, hexToRgba(func.color, 1));
            gradient.addColorStop(0.4, hexToRgba(func.color, 0.6));
            gradient.addColorStop(1, hexToRgba(func.color, 0));
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.sx, p.sy, particle.size * 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(p.sx, p.sy, particle.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      });
    },
    [functions, initParticles, getPointOnCurve, worldToScreen]
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }

    interpolateTransform();

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    drawGrid(ctx, width, height);
    drawParticles(ctx, width, height);

    animationRef.current = requestAnimationFrame(render);
  }, [interpolateTransform, drawGrid, drawParticles]);

  useEffect(() => {
    pointsCacheRef.current.clear();
  }, [functions]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [render]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 2) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    onViewTransformChange({
      ...targetTransformRef.current,
      offsetX: targetTransformRef.current.offsetX + dx,
      offsetY: targetTransformRef.current.offsetY + dy,
    });
  }, [onViewTransformChange]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const current = targetTransformRef.current;
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(20, Math.min(500, current.scale * zoomFactor));

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const worldX = (mouseX - centerX - current.offsetX) / current.scale;
      const worldY = -(mouseY - centerY - current.offsetY) / current.scale;

      const newOffsetX = mouseX - centerX - worldX * newScale;
      const newOffsetY = -(mouseY - centerY - worldY * newScale);

      onViewTransformChange({
        scale: newScale,
        offsetX: newOffsetX,
        offsetY: newOffsetY,
      });
    },
    [onViewTransformChange]
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="plotter-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      />
      <div className="canvas-hint">
        <span>右键拖拽平移 · 滚轮缩放</span>
      </div>
    </div>
  );
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default FunctionPlotter;
