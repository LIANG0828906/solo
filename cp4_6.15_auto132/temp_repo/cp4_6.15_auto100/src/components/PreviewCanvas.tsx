import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';
import {
  createBullets,
  updateBullet,
  isBulletOutOfBounds,
  getBulletOpacity,
  hexToRgb,
  type Bullet,
  type BulletPattern,
} from '../utils/bulletPhysics';

interface ViewTransform {
  x: number;
  y: number;
  scale: number;
}

const PreviewCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bulletsRef = useRef<Bullet[]>([]);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const spawnTimersRef = useRef<Map<string, number>>(new Map());
  const simTimeRef = useRef<number>(0);

  const [viewTransform, setViewTransform] = useState<ViewTransform>({
    x: 0,
    y: 0,
    scale: 1,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [bulletCount, setBulletCount] = useState(0);
  const [performanceMode, setPerformanceMode] = useState(false);

  const patterns = useEditorStore((state) => state.patterns);
  const waves = useEditorStore((state) => state.waves);
  const isPlaying = useEditorStore((state) => state.isPlaying);
  const selectedPatternId = useEditorStore((state) => state.selectedPatternId);

  const getPatternById = useCallback(
    (id: string): BulletPattern | undefined => {
      return patterns.find((p) => p.id === id);
    },
    [patterns]
  );

  const getCanvasSize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return { width: 800, height: 600 };
    return {
      width: container.clientWidth,
      height: container.clientHeight,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - viewTransform.x,
      y: e.clientY - viewTransform.y,
    });
  }, [viewTransform]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setViewTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewTransform((prev) => ({
      ...prev,
      scale: Math.max(0.2, Math.min(3, prev.scale * delta)),
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = (timestamp: number) => {
      const deltaTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      const { width, height } = getCanvasSize();

      ctx.fillStyle = '#0a0e17';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(viewTransform.x + width / 2, viewTransform.y + height / 2);
      ctx.scale(viewTransform.scale, viewTransform.scale);
      ctx.translate(-width / 2, -height / 2);

      drawGrid(ctx, width, height, viewTransform.scale);
      drawCrosshair(ctx, width, height);

      if (isPlaying) {
        simTimeRef.current += deltaTime;

        waves.forEach((wave) => {
          const waveStart = wave.triggerTime;
          const waveEnd = wave.triggerTime + wave.duration;
          const currentSimTime = simTimeRef.current;

          if (currentSimTime >= waveStart && currentSimTime <= waveEnd) {
            const timerKey = wave.id;
            const lastSpawn = spawnTimersRef.current.get(timerKey) || 0;

            if (currentSimTime - lastSpawn >= wave.spawnInterval) {
              spawnTimersRef.current.set(timerKey, currentSimTime);

              const spawnX = (wave.spawnPositionX / 100) * width;
              const spawnY = height * (0.2 + Math.random() * 0.6);

              wave.patterns.forEach((patternId) => {
                const pattern = getPatternById(patternId);
                if (pattern) {
                  const newBullets = createBullets(
                    pattern,
                    { x: spawnX, y: spawnY },
                    currentSimTime,
                    0
                  );
                  bulletsRef.current = [...bulletsRef.current, ...newBullets];
                }
              });
            }
          }
        });

        if (waves.length === 0 && selectedPatternId) {
          const pattern = getPatternById(selectedPatternId);
          if (pattern) {
            const spawnInterval = 0.5;
            const timerKey = 'preview-pattern';
            const lastSpawn = spawnTimersRef.current.get(timerKey) || 0;

            if (simTimeRef.current - lastSpawn >= spawnInterval) {
              spawnTimersRef.current.set(timerKey, simTimeRef.current);
              const spawnX = width * 0.2;
              const spawnY = height * 0.5;
              const newBullets = createBullets(
                pattern,
                { x: spawnX, y: spawnY },
                simTimeRef.current,
                0
              );
              bulletsRef.current = [...bulletsRef.current, ...newBullets];
            }
          }
        }
      }

      const activePatterns = new Set<string>();
      waves.forEach((wave) => {
        wave.patterns.forEach((pid) => activePatterns.add(pid));
      });
      if (selectedPatternId) {
        activePatterns.add(selectedPatternId);
      }

      bulletsRef.current = bulletsRef.current
        .map((bullet) => {
          const pattern = getPatternById(bullet.patternId);
          const gravityEnabled = pattern?.gravityEnabled || false;
          const gravityStrength = pattern?.gravityStrength || 0.1;
          return updateBullet(bullet, deltaTime, gravityEnabled, gravityStrength);
        })
        .filter((bullet) => !isBulletOutOfBounds(bullet, width, height));

      const count = bulletsRef.current.length;
      setBulletCount(count);
      const isPerfMode = count > 500;
      setPerformanceMode(isPerfMode);

      const skipRate = isPerfMode ? Math.ceil(count / 500) : 1;

      bulletsRef.current.forEach((bullet, idx) => {
        if (isPerfMode && idx % skipRate !== 0) return;
        drawBullet(ctx, bullet, !isPerfMode, viewTransform.scale, isPerfMode);
      });

      ctx.restore();

      drawStats(ctx, width, height, count, performanceMode);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    viewTransform,
    waves,
    patterns,
    isPlaying,
    selectedPatternId,
    performanceMode,
    getCanvasSize,
    getPatternById,
  ]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: '#0a0e17',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          boxShadow: 'inset 0 0 60px rgba(0, 212, 255, 0.1)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          padding: '8px 12px',
          background: 'rgba(18, 25, 40, 0.9)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: 8,
          color: '#00d4ff',
          fontFamily: "'Oxanium', monospace",
          fontSize: 12,
          pointerEvents: 'none',
        }}
      >
        <div>子弹: {bulletCount}</div>
        <div>缩放: {(viewTransform.scale * 100).toFixed(0)}%</div>
        {performanceMode && (
          <div style={{ color: '#ff6b35' }}>性能模式</div>
        )}
      </div>
    </div>
  );
};

const drawGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number
) => {
  const gridSize = 50;
  ctx.strokeStyle = 'rgba(30, 42, 69, 0.5)';
  ctx.lineWidth = 1 / scale;

  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
};

const drawCrosshair = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const size = 30;

  ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);

  ctx.beginPath();
  ctx.moveTo(centerX - size, centerY);
  ctx.lineTo(centerX + size, centerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX, centerY - size);
  ctx.lineTo(centerX, centerY + size);
  ctx.stroke();

  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(0, 212, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
  ctx.fill();
};

const drawBullet = (
  ctx: CanvasRenderingContext2D,
  bullet: Bullet,
  useTrails: boolean,
  scale: number,
  isPerfMode: boolean = false
) => {
  const opacity = getBulletOpacity(bullet);
  const rgb = hexToRgb(bullet.color);
  const radius = 4 / scale;

  if (useTrails && !isPerfMode) {
    const trailLength = 8;
    for (let i = trailLength; i > 0; i--) {
      const t = i / trailLength;
      const trailOpacity = opacity * (1 - t) * 0.5;
      const trailX = bullet.x - bullet.vx * i * 0.5;
      const trailY = bullet.y - bullet.vy * i * 0.5;

      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${trailOpacity})`;
      ctx.beginPath();
      ctx.arc(trailX, trailY, radius * (1 - t * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
  ctx.beginPath();
  if (isPerfMode) {
    ctx.rect(bullet.x - radius, bullet.y - radius, radius * 2, radius * 2);
  } else {
    ctx.arc(bullet.x, bullet.y, radius, 0, Math.PI * 2);
  }
  ctx.fill();

  if (!isPerfMode) {
    ctx.shadowColor = bullet.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
};

const drawStats = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bulletCount: number,
  performanceMode: boolean
) => {
  void width;
  void height;
  void bulletCount;
  void performanceMode;
};

export default PreviewCanvas;
