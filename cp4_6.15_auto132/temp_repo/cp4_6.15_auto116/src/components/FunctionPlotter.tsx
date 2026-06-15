import React, { useRef, useEffect } from 'react';
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

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getPointOnCurve(points: Point[], progress: number): Point | null {
  if (points.length < 2) return null;
  const t = Math.max(0, Math.min(1, progress));
  const index = t * (points.length - 1);
  const i = Math.floor(index);
  const frac = index - i;
  if (i >= points.length - 1) return points[points.length - 1];
  return {
    x: points[i].x + (points[i + 1].x - points[i].x) * frac,
    y: points[i].y + (points[i + 1].y - points[i].y) * frac,
  };
}

const FunctionPlotter: React.FC<FunctionPlotterProps> = ({
  functions,
  viewTransform,
  onViewTransformChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const functionsRef = useRef(functions);
  const viewTransformRef = useRef(viewTransform);
  const onViewTransformChangeRef = useRef(onViewTransformChange);

  const currentTransformRef = useRef<ViewTransform>(viewTransform);
  const particlesRef = useRef<Map<string, Particle[]>>(new Map());
  const pointsCacheRef = useRef<Map<string, Point[]>>(new Map());
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const fpsFramesRef = useRef<number[]>([]);
  const fpsDisplayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    functionsRef.current = functions;
  }, [functions]);

  useEffect(() => {
    viewTransformRef.current = viewTransform;
  }, [viewTransform]);

  useEffect(() => {
    onViewTransformChangeRef.current = onViewTransformChange;
  }, [onViewTransformChange]);

  useEffect(() => {
    pointsCacheRef.current.clear();
  }, [functions]);

  useEffect(() => {
    const existingIds = new Set(functions.map((f) => f.id));
    for (const key of particlesRef.current.keys()) {
      if (!existingIds.has(key)) {
        particlesRef.current.delete(key);
      }
    }
  }, [functions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const worldToScreen = (x: number, y: number, width: number, height: number) => {
      const transform = currentTransformRef.current;
      const centerX = width / 2;
      const centerY = height / 2;
      return {
        sx: centerX + x * transform.scale + transform.offsetX,
        sy: centerY - y * transform.scale + transform.offsetY,
      };
    };

    const screenToWorld = (sx: number, sy: number, width: number, height: number) => {
      const transform = currentTransformRef.current;
      const centerX = width / 2;
      const centerY = height / 2;
      return {
        x: (sx - centerX - transform.offsetX) / transform.scale,
        y: -(sy - centerY - transform.offsetY) / transform.scale,
      };
    };

    const ensureParticles = (funcId: string, funcCount: number) => {
      const existing = particlesRef.current.get(funcId);
      const desiredCount = Math.min(
        PARTICLES_PER_FUNCTION,
        Math.floor(MAX_TOTAL_PARTICLES / Math.max(1, funcCount))
      );
      if (existing && existing.length === desiredCount) return existing;
      const particles: Particle[] = [];
      for (let i = 0; i < desiredCount; i++) {
        particles.push({
          progress: i / desiredCount,
          speed: 0.0015 + Math.random() * 0.001,
          size: 2 + Math.random() * 2,
          trail: [],
        });
      }
      particlesRef.current.set(funcId, particles);
      return particles;
    };

    const drawGrid = (width: number, height: number) => {
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

      ctx.strokeStyle = 'rgba(150, 200, 255, 0.45)';
      ctx.lineWidth = 1.5;

      const x0 = worldToScreen(0, 0, width, height);
      if (x0.sy >= -1 && x0.sy <= height + 1) {
        ctx.beginPath();
        ctx.moveTo(0, x0.sy);
        ctx.lineTo(width, x0.sy);
        ctx.stroke();
      }

      if (x0.sx >= -1 && x0.sx <= width + 1) {
        ctx.beginPath();
        ctx.moveTo(x0.sx, 0);
        ctx.lineTo(x0.sx, height);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(150, 200, 255, 0.55)';
      ctx.font = '11px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      for (let x = startX; x <= endX; x += gridSize) {
        if (Math.abs(x) < gridSize * 0.1) continue;
        const p = worldToScreen(x, 0, width, height);
        const labelY = Math.max(2, Math.min(p.sy + 6, height - 14));
        const label = Math.abs(x) >= 1 ? x.toFixed(0) : x.toFixed(1);
        ctx.fillText(label, p.sx, labelY);
      }

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      for (let y = startY; y <= endY; y += gridSize) {
        if (Math.abs(y) < gridSize * 0.1) continue;
        const p = worldToScreen(0, y, width, height);
        const labelX = Math.max(30, Math.min(p.sx - 6, width - 4));
        const label = Math.abs(y) >= 1 ? y.toFixed(0) : y.toFixed(1);
        ctx.fillText(label, labelX, p.sy);
      }

      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    };

    const drawParticles = (width: number, height: number) => {
      const funcs = functionsRef.current;

      for (const func of funcs) {
        if (!func.visible) continue;

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

        const particles = ensureParticles(func.id, funcs.filter((f) => f.visible).length);

        for (const particle of particles) {
          particle.progress += particle.speed;
          if (particle.progress > 1) {
            particle.progress -= 1;
            particle.trail = [];
          }

          const pos = getPointOnCurve(points, particle.progress);
          if (pos) {
            particle.trail.unshift(pos);
            if (particle.trail.length > TRAIL_LENGTH) {
              particle.trail.length = TRAIL_LENGTH;
            }
          }

          if (particle.trail.length < 2) continue;

          for (let i = 0; i < particle.trail.length - 1; i++) {
            const t1 = particle.trail[i];
            const t2 = particle.trail[i + 1];
            const trailRatio = i / TRAIL_LENGTH;
            const alpha = Math.pow(1 - trailRatio, 2.0) * 0.85;
            const lineWidth = particle.size * Math.pow(1 - trailRatio, 1.5) * 1.2;

            const p1 = worldToScreen(t1.x, t1.y, width, height);
            const p2 = worldToScreen(t2.x, t2.y, width, height);

            ctx.strokeStyle = hexToRgba(func.color, alpha);
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(p1.sx, p1.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.stroke();
          }

          const head = particle.trail[0];
          const p = worldToScreen(head.x, head.y, width, height);

          const glowRadius = particle.size * 4;
          const gradient = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, glowRadius);
          gradient.addColorStop(0, hexToRgba(func.color, 0.95));
          gradient.addColorStop(0.3, hexToRgba(func.color, 0.5));
          gradient.addColorStop(0.7, hexToRgba(func.color, 0.15));
          gradient.addColorStop(1, hexToRgba(func.color, 0));
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, glowRadius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, particle.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const loop = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const target = viewTransformRef.current;
      const current = currentTransformRef.current;
      const lerpFactor = 0.14;

      currentTransformRef.current = {
        offsetX: current.offsetX + (target.offsetX - current.offsetX) * lerpFactor,
        offsetY: current.offsetY + (target.offsetY - current.offsetY) * lerpFactor,
        scale: current.scale + (target.scale - current.scale) * lerpFactor,
      };

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, width, height);

      drawGrid(width, height);
      drawParticles(width, height);

      const now = performance.now();
      fpsFramesRef.current.push(now);
      while (fpsFramesRef.current.length > 0 && fpsFramesRef.current[0] < now - 1000) {
        fpsFramesRef.current.shift();
      }
      if (fpsDisplayRef.current) {
        fpsDisplayRef.current.textContent = `${fpsFramesRef.current.length} FPS`;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const current = viewTransformRef.current;
      const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
      const newScale = Math.max(20, Math.min(500, current.scale * zoomFactor));

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const worldX = (mouseX - centerX - current.offsetX) / current.scale;
      const worldY = -(mouseY - centerY - current.offsetY) / current.scale;

      const newOffsetX = mouseX - centerX - worldX * newScale;
      const newOffsetY = -(mouseY - centerY - worldY * newScale);

      onViewTransformChangeRef.current({
        scale: newScale,
        offsetX: newOffsetX,
        offsetY: newOffsetY,
      });
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2 || e.button === 0) {
        isDraggingRef.current = true;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      const current = viewTransformRef.current;
      onViewTransformChangeRef.current({
        ...current,
        offsetX: current.offsetX + dx,
        offsetY: current.offsetY + dy,
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      canvas.style.cursor = 'grab';
    };

    const handleContextMenu = (e: Event) => {
      e.preventDefault();
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', handleContextMenu);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="plotter-canvas"
      />
      <div className="canvas-hint">
        <span>右键/左键拖拽平移 · 滚轮缩放</span>
      </div>
      <div ref={fpsDisplayRef} className="fps-counter" />
    </div>
  );
};

export default FunctionPlotter;
