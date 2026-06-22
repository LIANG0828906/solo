import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

export interface TeaBowlProps {
  force: number;
  angle: number;
  speed: number;
  isRecording?: boolean;
  isPlaying?: boolean;
  playbackData?: TrajectoryPoint[] | null;
  playbackSpeed?: number;
  onTrajectoryPoint?: (point: TrajectoryPoint) => void;
  compareMode?: boolean;
  compareParticles?: Particle[] | null;
  size?: number;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  timestamp: number;
  force: number;
  speed: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export interface TeaBowlRef {
  getParticles: () => Particle[];
  reset: () => void;
}

const BOWL_RADIUS_UNITS = 6;
const PIXELS_PER_UNIT = 30;
const BOWL_RADIUS_PX = BOWL_RADIUS_UNITS * PIXELS_PER_UNIT;
const BOWL_WALL_TILT = 15;
const MAX_PARTICLES = 500;

const TeaBowl = forwardRef<TeaBowlRef, TeaBowlProps>(function TeaBowl(
  {
    force,
    angle,
    speed,
    isRecording = false,
    isPlaying = false,
    playbackData = null,
    playbackSpeed = 1,
    onTrajectoryPoint,
    compareMode = false,
    compareParticles = null,
    size = BOWL_RADIUS_PX * 2 + 60,
  },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const isDraggingRef = useRef(false);
  const lastPositionRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const playbackStartTimeRef = useRef<number>(0);
  const playbackIndexRef = useRef<number>(0);
  const bowlCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useImperativeHandle(ref, () => ({
    getParticles: () => particlesRef.current.map(p => ({ ...p })),
    reset: () => {
      particlesRef.current = [];
      playbackIndexRef.current = 0;
    },
  }));

  const canvasSize = size;
  const bowlCenterX = canvasSize / 2;
  const bowlCenterY = canvasSize / 2;
  const bowlRadius = BOWL_RADIUS_PX;

  useEffect(() => {
    bowlCenterRef.current = { x: bowlCenterX, y: bowlCenterY };
  }, [bowlCenterX, bowlCenterY]);

  const spawnParticles = useCallback(
    (x: number, y: number, velocityX: number, velocityY: number, localForce: number, localSpeed: number) => {
      const particles = particlesRef.current;
      const spawnCount = Math.floor((localForce / 100) * 8) + 2;

      for (let i = 0; i < spawnCount; i++) {
        if (particles.length >= MAX_PARTICLES) break;

        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * (localForce / 100) * 15 + 2;
        const size = 2 + (localForce / 100) * 4 + Math.random() * 2;
        const opacity = 0.6 + Math.random() * 0.3;
        const life = 3000 + (10 - localSpeed) * 500 + Math.random() * 1000;

        const speedFactor = 0.3 + (localSpeed / 10) * 0.5;

        particles.push({
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist,
          vx: velocityX * speedFactor * 0.1 + Math.cos(angle) * 0.5,
          vy: velocityY * speedFactor * 0.1 + Math.sin(angle) * 0.5,
          size,
          opacity,
          life,
          maxLife: life,
        });
      }
    },
    []
  );

  const isInsideBowl = useCallback(
    (x: number, y: number): boolean => {
      const dx = x - bowlCenterX;
      const dy = y - bowlCenterY;
      return Math.sqrt(dx * dx + dy * dy) <= bowlRadius;
    },
    [bowlCenterX, bowlCenterY, bowlRadius]
  );

  const updateParticles = useCallback(
    (deltaTime: number) => {
      const particles = particlesRef.current;
      const friction = 0.98 - (speed / 10) * 0.02;
      const decayRate = 1 + (speed / 10) * 1.5;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.vx *= friction;
        p.vy *= friction;

        p.x += p.vx * deltaTime * 0.06;
        p.y += p.vy * deltaTime * 0.06;

        const dx = p.x - bowlCenterX;
        const dy = p.y - bowlCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > bowlRadius - p.size / 2) {
          const nx = dx / dist;
          const ny = dy / dist;
          const dot = p.vx * nx + p.vy * ny;
          p.vx -= 2 * dot * nx * 0.6;
          p.vy -= 2 * dot * ny * 0.6;
          p.x = bowlCenterX + nx * (bowlRadius - p.size / 2);
          p.y = bowlCenterY + ny * (bowlRadius - p.size / 2);
          p.life -= 50;
        }

        p.life -= deltaTime * decayRate;
        p.opacity = (p.life / p.maxLife) * 0.9;

        if (p.life <= 0 || p.opacity <= 0.05) {
          particles.splice(i, 1);
        }
      }
    },
    [speed, bowlCenterX, bowlCenterY, bowlRadius]
  );

  const drawBowl = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const { x: cx, y: cy } = bowlCenterRef.current;
      const r = bowlRadius;
      const tiltAngle = (BOWL_WALL_TILT * Math.PI) / 180;
      const rimOffset = Math.sin(tiltAngle) * 20;

      ctx.save();

      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 3;

      const rimGradient = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r);
      rimGradient.addColorStop(0, '#3D2E26');
      rimGradient.addColorStop(0.7, '#4A3B32');
      rimGradient.addColorStop(1, '#3A2B24');

      ctx.beginPath();
      ctx.ellipse(cx, cy + rimOffset * 0.3, r, r * 0.95, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#2D1F1A';
      ctx.fill();

      ctx.shadowColor = 'transparent';

      ctx.beginPath();
      ctx.ellipse(cx, cy - rimOffset * 0.5, r, r * 0.92, 0, 0, Math.PI * 2);
      ctx.fillStyle = rimGradient;
      ctx.fill();

      const innerGradient = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 0.85);
      innerGradient.addColorStop(0, '#5C4838');
      innerGradient.addColorStop(0.5, '#4A3B32');
      innerGradient.addColorStop(1, '#3D2E26');

      ctx.beginPath();
      ctx.ellipse(cx, cy - rimOffset * 0.5, r * 0.92, r * 0.82, 0, 0, Math.PI * 2);
      ctx.fillStyle = innerGradient;
      ctx.fill();

      const teaGradient = ctx.createRadialGradient(cx, cy + 5, r * 0.1, cx, cy + 5, r * 0.8);
      teaGradient.addColorStop(0, '#6B4423');
      teaGradient.addColorStop(0.5, '#5A3A1E');
      teaGradient.addColorStop(1, '#4A2E18');

      ctx.beginPath();
      ctx.ellipse(cx, cy + 5, r * 0.8, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fillStyle = teaGradient;
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(cx, cy - rimOffset * 0.5, r, r * 0.92, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#2A1F18';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();
    },
    [bowlRadius]
  );

  const drawParticles = useCallback(
    (ctx: CanvasRenderingContext2D, particleList: Particle[]) => {
      ctx.save();

      const { x: cx, y: cy } = bowlCenterRef.current;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 5, bowlRadius * 0.8, bowlRadius * 0.7, 0, 0, Math.PI * 2);
      ctx.clip();

      for (const p of particleList) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, p.opacity))})`;
        ctx.fill();
      }

      ctx.restore();
    },
    [bowlRadius]
  );

  const drawDifferenceMask = useCallback(
    (ctx: CanvasRenderingContext2D, particlesA: Particle[], particlesB: Particle[]) => {
      const gridSize = 20;
      const { x: cx, y: cy } = bowlCenterRef.current;
      const r = bowlRadius * 0.75;

      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#FF3333';

      const densityA = new Map<string, number>();
      const densityB = new Map<string, number>();

      for (const p of particlesA) {
        const gx = Math.floor((p.x - cx + r) / gridSize);
        const gy = Math.floor((p.y - cy + r) / gridSize);
        const key = `${gx},${gy}`;
        densityA.set(key, (densityA.get(key) || 0) + 1);
      }

      for (const p of particlesB) {
        const gx = Math.floor((p.x - cx + r) / gridSize);
        const gy = Math.floor((p.y - cy + r) / gridSize);
        const key = `${gx},${gy}`;
        densityB.set(key, (densityB.get(key) || 0) + 1);
      }

      const allKeys = new Set([...densityA.keys(), ...densityB.keys()]);

      for (const key of allKeys) {
        const a = densityA.get(key) || 0;
        const b = densityB.get(key) || 0;
        const diff = Math.abs(a - b);

        if (diff >= 3) {
          const [gx, gy] = key.split(',').map(Number);
          const x = cx - r + gx * gridSize;
          const y = cy - r + gy * gridSize;

          const dx = x - cx;
          const dy = y - cy;
          if (Math.sqrt(dx * dx + dy * dy) < r) {
            ctx.fillRect(x, y, gridSize, gridSize);
          }
        }
      }

      ctx.restore();
    },
    [bowlRadius]
  );

  const render = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const deltaTime = lastFrameTimeRef.current ? timestamp - lastFrameTimeRef.current : 16;
      lastFrameTimeRef.current = timestamp;

      if (isPlaying && playbackData && playbackData.length > 0) {
        if (playbackIndexRef.current === 0) {
          playbackStartTimeRef.current = timestamp;
        }

        const elapsed = (timestamp - playbackStartTimeRef.current) * playbackSpeed;

        while (
          playbackIndexRef.current < playbackData.length &&
          playbackData[playbackIndexRef.current].timestamp <= elapsed
        ) {
          const point = playbackData[playbackIndexRef.current];
          const x = bowlCenterX + point.x;
          const y = bowlCenterY + point.y;

          let vx = 0;
          let vy = 0;
          if (playbackIndexRef.current > 0) {
            const prev = playbackData[playbackIndexRef.current - 1];
            const dt = point.timestamp - prev.timestamp;
            if (dt > 0) {
              vx = ((point.x - prev.x) / dt) * 16;
              vy = ((point.y - prev.y) / dt) * 16;
            }
          }

          spawnParticles(x, y, vx, vy, point.force, point.speed);
          playbackIndexRef.current++;
        }

        if (playbackIndexRef.current >= playbackData.length) {
          playbackIndexRef.current = 0;
          playbackStartTimeRef.current = timestamp;
        }
      }

      updateParticles(deltaTime);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawBowl(ctx);
      drawParticles(ctx, particlesRef.current);

      if (compareMode && compareParticles) {
        drawDifferenceMask(ctx, particlesRef.current, compareParticles);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    },
    [
      isPlaying,
      playbackData,
      playbackSpeed,
      bowlCenterX,
      bowlCenterY,
      spawnParticles,
      updateParticles,
      drawBowl,
      drawParticles,
      compareMode,
      compareParticles,
      drawDifferenceMask,
    ]
  );

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  useEffect(() => {
    if (isPlaying) {
      playbackIndexRef.current = 0;
    }
  }, [isPlaying, playbackData]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPlaying) return;
    const { x, y } = getCanvasCoords(e);
    if (!isInsideBowl(x, y)) return;

    isDraggingRef.current = true;
    lastPositionRef.current = { x, y, time: performance.now() };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || isPlaying) return;

    const { x, y } = getCanvasCoords(e);
    if (!isInsideBowl(x, y)) return;

    const now = performance.now();
    const last = lastPositionRef.current;

    if (last) {
      const dt = now - last.time;
      if (dt > 10) {
        const vx = (x - last.x) / dt * 16;
        const vy = (y - last.y) / dt * 16;
        const moveSpeed = Math.min(10, Math.sqrt(vx * vx + vy * vy) / 3);

        spawnParticles(x, y, vx, vy, force, Math.max(speed, moveSpeed * 0.5));

        if (isRecording && onTrajectoryPoint) {
          onTrajectoryPoint({
            x: x - bowlCenterX,
            y: y - bowlCenterY,
            timestamp: dt,
            force,
            speed: Math.max(speed, moveSpeed * 0.5),
          });
        }

        lastPositionRef.current = { x, y, time: now };
      }
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    lastPositionRef.current = null;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    lastPositionRef.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      style={{
        width: canvasSize,
        height: canvasSize,
        cursor: isPlaying ? 'default' : 'grab',
        display: 'block',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
});

export default TeaBowl;
