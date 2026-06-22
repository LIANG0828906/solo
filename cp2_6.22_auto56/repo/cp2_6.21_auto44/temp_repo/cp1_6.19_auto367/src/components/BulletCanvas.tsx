import { useEffect, useRef, useCallback } from 'react';
import {
  Bullet,
  createFanPattern,
  createSpiralPattern,
  createWavePattern,
  createRandomPattern,
} from '../modules/bulletPatterns';
import { useEditorStore, PatternType } from '../store/editorStore';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;
const BULLET_RADIUS = 3;
const CENTER_X = 400;
const CENTER_Y = 400;
const SECONDARY_X = 100;
const SECONDARY_Y = 100;
const PERF_TEST_DURATION = 10000;
const PERF_TEST_BULLETS = 1000;

interface BulletPool {
  pool: Bullet[];
  count: number;
}

function createBulletPool(size: number): BulletPool {
  const pool: Bullet[] = new Array(size);
  for (let i = 0; i < size; i++) {
    pool[i] = { x: 0, y: 0, speed: 0, angle: 0, color: '#ffffff', active: false };
  }
  return { pool, count: 0 };
}

function generateBullets(
  type: PatternType,
  originX: number,
  originY: number,
  store: ReturnType<typeof useEditorStore.getState>,
  forceCount?: number
): Bullet[] {
  const theme = store.theme;
  const speed = store.bulletSpeed;

  switch (type) {
    case 'fan': {
      const params = forceCount
        ? { ...store.fanParams, bulletCount: forceCount }
        : store.fanParams;
      return createFanPattern(originX, originY, { ...params, speed }, theme);
    }
    case 'spiral': {
      const adjustedParams = forceCount
        ? {
            rotations: 1,
            bulletsPerRotation: forceCount,
          }
        : store.spiralParams;
      return createSpiralPattern(originX, originY, { ...adjustedParams, speed }, theme);
    }
    case 'wave': {
      const params = forceCount
        ? { ...store.waveParams, bulletCount: forceCount }
        : store.waveParams;
      return createWavePattern(originX, originY, { ...params, speed }, theme);
    }
    case 'random': {
      const params = forceCount
        ? { ...store.randomParams, bulletCount: forceCount }
        : store.randomParams;
      return createRandomPattern(originX, originY, params, theme);
    }
  }
}

export default function BulletCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bulletsRef = useRef<BulletPool>(createBulletPool(3000));
  const isRunningRef = useRef(false);
  const isPausedRef = useRef(false);
  const animationFrameRef = useRef<number>(0);

  const lastFrameTimeRef = useRef(performance.now());
  const fpsFrameCountRef = useRef(0);
  const fpsLastUpdateRef = useRef(performance.now());
  const fpsCurrentRef = useRef(60);
  const fpsHistoryRef = useRef<number[]>([]);
  const fpsSumRef = useRef(0);
  const fpsMinRef = useRef(60);
  const droppedFramesRef = useRef(0);
  const perfTestSecondRef = useRef(0);
  const perfTestLastSecondRef = useRef(0);

  const updateBulletColors = useCallback(() => {
    const store = useEditorStore.getState();
    const { pool, count } = bulletsRef.current;
    const theme = store.theme;
    for (let i = 0; i < count; i++) {
      if (pool[i].active) {
        pool[i].color = theme.type === 'random'
          ? theme.colors[Math.floor(Math.random() * theme.colors.length)]
          : theme.colors[Math.floor((i / Math.max(count, 1)) * theme.colors.length) % theme.colors.length];
      }
    }
  }, []);

  const fireBullets = useCallback((forceTest = false) => {
    const store = useEditorStore.getState();
    const bulletPool = bulletsRef.current;
    const overlay = store.overlayMode;

    const mainBullets = generateBullets(
      store.patternType,
      CENTER_X,
      CENTER_Y,
      store,
      forceTest ? PERF_TEST_BULLETS : undefined
    );

    const secondaryBullets = overlay
      ? generateBullets(
          store.secondaryPatternType,
          SECONDARY_X,
          SECONDARY_Y,
          store,
          forceTest ? PERF_TEST_BULLETS : undefined
        )
      : [];

    const allBullets = [...mainBullets, ...secondaryBullets];

    while (bulletPool.pool.length < allBullets.length) {
      bulletPool.pool.push({ x: 0, y: 0, speed: 0, angle: 0, color: '#ffffff', active: false });
    }

    for (let i = 0; i < allBullets.length; i++) {
      bulletPool.pool[i].x = allBullets[i].x;
      bulletPool.pool[i].y = allBullets[i].y;
      bulletPool.pool[i].speed = allBullets[i].speed;
      bulletPool.pool[i].angle = allBullets[i].angle;
      bulletPool.pool[i].color = allBullets[i].color;
      bulletPool.pool[i].active = true;
    }
    bulletPool.count = allBullets.length;

    for (let i = allBullets.length; i < bulletPool.pool.length; i++) {
      bulletPool.pool[i].active = false;
    }
  }, []);

  const resetCanvas = useCallback(() => {
    const { pool } = bulletsRef.current;
    for (let i = 0; i < pool.length; i++) {
      pool[i].active = false;
    }
    bulletsRef.current.count = 0;
  }, []);

  const drawFPSChart = useCallback(
    (ctx: CanvasRenderingContext2D, history: number[], x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x, y, w, h);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const yy = y + (h / 4) * i;
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.lineTo(x + w, yy);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('60', x - 4, y + 10);
      ctx.fillText('30', x - 4, y + h / 2 + 3);
      ctx.fillText('0', x - 4, y + h - 2);
      ctx.textAlign = 'left';

      if (history.length < 2) return;

      const points = Math.min(history.length, 10);
      const step = w / 9;

      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < points; i++) {
        const fps = history[history.length - points + i];
        const clamped = Math.max(0, Math.min(60, fps));
        const px = x + i * step;
        const py = y + h - (clamped / 60) * h;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.fillStyle = '#00ff88';
      for (let i = 0; i < points; i++) {
        const fps = history[history.length - points + i];
        const clamped = Math.max(0, Math.min(60, fps));
        const px = x + i * step;
        const py = y + h - (clamped / 60) * h;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px sans-serif';
      ctx.fillText('FPS History', x + 6, y + 14);
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isRunningRef.current = true;
    isPausedRef.current = false;
    lastFrameTimeRef.current = performance.now();
    fpsLastUpdateRef.current = performance.now();
    fpsFrameCountRef.current = 0;
    fpsSumRef.current = 0;
    fpsMinRef.current = 60;
    droppedFramesRef.current = 0;
    fpsHistoryRef.current = [];
    perfTestSecondRef.current = 0;
    perfTestLastSecondRef.current = 0;

    const loop = (now: number) => {
      if (!isRunningRef.current) return;

      lastFrameTimeRef.current = now;

      if (!isPausedRef.current) {
        const { pool, count } = bulletsRef.current;
        let activeCount = 0;

        for (let i = 0; i < count; i++) {
          const b = pool[i];
          if (!b.active) continue;

          b.x += Math.cos(b.angle) * b.speed;
          b.y += Math.sin(b.angle) * b.speed;

          if (
            b.x < -BULLET_RADIUS ||
            b.x > CANVAS_WIDTH + BULLET_RADIUS ||
            b.y < -BULLET_RADIUS ||
            b.y > CANVAS_HEIGHT + BULLET_RADIUS
          ) {
            b.active = false;
          } else {
            activeCount++;
          }
        }

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        for (let i = 0; i < count; i++) {
          const b = pool[i];
          if (!b.active) continue;
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(b.x, b.y, BULLET_RADIUS, 0, Math.PI * 2);
          ctx.fill();
        }

        const store = useEditorStore.getState();
        if (store.performanceMonitoring || store.stats.isTesting) {
          fpsFrameCountRef.current++;
          const elapsed = now - fpsLastUpdateRef.current;
          if (elapsed >= 1000) {
            const fps = (fpsFrameCountRef.current * 1000) / elapsed;
            fpsCurrentRef.current = fps;
            fpsSumRef.current += fps;
            fpsMinRef.current = Math.min(fpsMinRef.current, fps);
            if (fps < 30) droppedFramesRef.current++;

            fpsLastUpdateRef.current = now;
            fpsFrameCountRef.current = 0;

            if (store.stats.isTesting) {
              fpsHistoryRef.current.push(fps);
              store.updateStats({
                currentFps: Math.round(fps),
                averageFps: Math.round(fpsSumRef.current / fpsHistoryRef.current.length),
                minFps: Math.round(fpsMinRef.current),
                droppedFrames: droppedFramesRef.current,
                fpsHistory: [...fpsHistoryRef.current],
              });

              if (now - store.stats.testStartTime >= PERF_TEST_DURATION) {
                store.stopPerformanceTest();
              }
            } else {
              store.updateStats({
                currentFps: Math.round(fps),
              });
            }
          }

          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(CANVAS_WIDTH - 200, 4, 196, 72);
          ctx.fillStyle = '#00ff88';
          ctx.font = '12px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`当前FPS: ${Math.round(fpsCurrentRef.current)}`, CANVAS_WIDTH - 190, 22);
          ctx.fillText(`子弹数: ${activeCount}`, CANVAS_WIDTH - 190, 40);

          if (store.stats.isTesting) {
            ctx.fillStyle = '#ffcc00';
            ctx.fillText(
              `测试中... ${Math.min(10, Math.floor((now - store.stats.testStartTime) / 1000))}/10s`,
              CANVAS_WIDTH - 190,
              58
            );
          } else {
            ctx.fillStyle = '#8b949e';
            ctx.fillText(`最低: ${Math.round(fpsMinRef.current)}  掉帧: ${droppedFramesRef.current}`, CANVAS_WIDTH - 190, 58);
          }
          ctx.textAlign = 'left';

          if (store.stats.isTesting && fpsHistoryRef.current.length >= 2) {
            drawFPSChart(ctx, fpsHistoryRef.current, CANVAS_WIDTH - 310, 84, 300, 120);
          }
        }

        if (store.overlayMode) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(8, 8, 120, 28);
          ctx.fillStyle = '#8b5cf6';
          ctx.font = 'bold 13px monospace';
          ctx.fillText(`总子弹: ${activeCount}`, 16, 28);
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      isRunningRef.current = false;
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [drawFPSChart]);

  useEffect(() => {
    (window as unknown as { __fireBullets?: (force?: boolean) => void }).__fireBullets = (force) =>
      fireBullets(force);
    (window as unknown as { __resetCanvas?: () => void }).__resetCanvas = () => resetCanvas();
    (window as unknown as { __togglePause?: () => boolean }).__togglePause = () => {
      isPausedRef.current = !isPausedRef.current;
      return isPausedRef.current;
    };
    (window as unknown as { __updateBulletColors?: () => void }).__updateBulletColors = () =>
      updateBulletColors();
  }, [fireBullets, resetCanvas, updateBulletColors]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
