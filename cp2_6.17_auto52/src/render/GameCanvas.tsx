import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../store';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PADDLE_SPEED_LIMIT,
  PADDLE_Y_OFFSET,
} from '../physics/types';
import { updatePhysics } from '../physics/engine';

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsTimeRef = useRef<number>(0);
  const collisionTimesRef = useRef<number[]>([]);
  const animIdRef = useRef<number>(0);

  const balls = useGameStore((s) => s.balls);
  const paddle = useGameStore((s) => s.paddle);
  const gameOver = useGameStore((s) => s.gameOver);
  const score = useGameStore((s) => s.score);
  const lives = useGameStore((s) => s.lives);

  const setBalls = useGameStore((s) => s.setBalls);
  const setPaddle = useGameStore((s) => s.setPaddle);
  const addScore = useGameStore((s) => s.addScore);
  const loseLife = useGameStore((s) => s.loseLife);
  const setPerformance = useGameStore((s) => s.setPerformance);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#2A2A4E';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= CANVAS_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
  }, []);

  const drawBall = useCallback((ctx: CanvasRenderingContext2D, ball: typeof balls[0], now: number) => {
    const { x, y, radius, color, flashUntil, flashColor, spawning, spawnTime } = ball;

    let drawY = y;
    let drawRadius = radius;
    if (spawning) {
      const elapsed = now - spawnTime;
      const t = Math.min(elapsed / 300, 1);
      const bounce = Math.sin(t * Math.PI * 3) * (1 - t) * 20;
      drawY = y + bounce;
      drawRadius = radius * (0.5 + 0.5 * t);
    }

    ctx.save();

    const isFlashing = flashUntil > now && flashColor;

    const gradient = ctx.createRadialGradient(
      drawX(x, drawRadius, -0.33),
      drawY_offset(drawY, drawRadius, -0.33),
      drawRadius * 0.1,
      x,
      drawY,
      drawRadius
    );

    gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
    gradient.addColorStop(0.3, color);
    gradient.addColorStop(1, darkenColor(color, 0.4));

    ctx.beginPath();
    ctx.arc(x, drawY, drawRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    if (isFlashing) {
      const flashProgress = (flashUntil - now) / 100;
      ctx.globalAlpha = flashProgress * 0.7;
      const flashRadius = drawRadius * (1.5 + (1 - flashProgress) * 0.5);
      const flashGrad = ctx.createRadialGradient(x, drawY, 0, x, drawY, flashRadius);
      flashGrad.addColorStop(0, flashColor);
      flashGrad.addColorStop(0.5, flashColor);
      flashGrad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(x, drawY, flashRadius, 0, Math.PI * 2);
      ctx.fillStyle = flashGrad;
      ctx.fill();

      ctx.globalAlpha = flashProgress * 0.9;
      ctx.beginPath();
      ctx.arc(x, drawY, drawRadius * 1.1, 0, Math.PI * 2);
      ctx.strokeStyle = flashColor;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.restore();
  }, []);

  const gameLoop = useCallback(() => {
    const now = performance.now();
    const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = now;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!gameOver) {
      const p = { ...paddle };
      if (mouseRef.current !== null) {
        const targetX = mouseRef.current - p.width / 2;
        const diff = targetX - p.x;
        const maxMove = PADDLE_SPEED_LIMIT * dt;
        if (Math.abs(diff) > maxMove) {
          p.x += Math.sign(diff) * maxMove;
        } else {
          p.x = targetX;
        }
      } else {
        const keys = keysRef.current;
        if (keys.has('ArrowLeft') || keys.has('a')) {
          p.x -= PADDLE_SPEED_LIMIT * dt;
        }
        if (keys.has('ArrowRight') || keys.has('d')) {
          p.x += PADDLE_SPEED_LIMIT * dt;
        }
      }
      p.x = Math.max(0, Math.min(CANVAS_WIDTH - p.width, p.x));
      p.y = CANVAS_HEIGHT - PADDLE_Y_OFFSET;
      setPaddle(p);

      const result = updatePhysics(balls, p, dt, now);
      collisionTimesRef.current.push(result.collisionTime);
      if (collisionTimesRef.current.length > 60) {
        collisionTimesRef.current.shift();
      }

      setBalls(result.balls);
      if (result.scoreDelta > 0) addScore(result.scoreDelta);
      if (result.lifeLost) loseLife();
    }

    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#1A1A2E');
    bgGrad.addColorStop(1, '#16213E');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawGrid(ctx);

    const currentBalls = useGameStore.getState().balls;
    for (const ball of currentBalls) {
      drawBall(ctx, ball, now);
    }

    const currentPaddle = useGameStore.getState().paddle;
    ctx.save();
    ctx.shadowColor = '#E94560';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#E94560';
    ctx.beginPath();
    roundRect(ctx, currentPaddle.x, currentPaddle.y, currentPaddle.width, currentPaddle.height, 8);
    ctx.fill();
    ctx.restore();

    const grad = ctx.createLinearGradient(
      currentPaddle.x,
      currentPaddle.y,
      currentPaddle.x,
      currentPaddle.y + currentPaddle.height
    );
    grad.addColorStop(0, '#FF6B81');
    grad.addColorStop(1, '#E94560');
    ctx.fillStyle = grad;
    ctx.beginPath();
    roundRect(ctx, currentPaddle.x, currentPaddle.y, currentPaddle.width, currentPaddle.height, 8);
    ctx.fill();

    frameCountRef.current++;
    if (now - fpsTimeRef.current >= 1000) {
      const avgCollision =
        collisionTimesRef.current.length > 0
          ? collisionTimesRef.current.reduce((a, b) => a + b, 0) /
            collisionTimesRef.current.length
          : 0;
      setPerformance({
        fps: frameCountRef.current,
        particleCount: currentBalls.length,
        avgCollisionTime: Math.round(avgCollision * 100) / 100,
      });
      frameCountRef.current = 0;
      fpsTimeRef.current = now;
    }

    animIdRef.current = requestAnimationFrame(gameLoop);
  }, [balls, paddle, gameOver, setBalls, setPaddle, addScore, loseLife, setPerformance, drawGrid, drawBall]);

  useEffect(() => {
    lastTimeRef.current = performance.now();
    fpsTimeRef.current = performance.now();
    animIdRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animIdRef.current);
  }, [gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      mouseRef.current = (e.clientX - rect.left) * scaleX;
    };
    const handleMouseLeave = () => {
      mouseRef.current = null;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      mouseRef.current = (e.touches[0].clientX - rect.left) * scaleX;
      e.preventDefault();
    };
    const handleTouchEnd = () => {
      mouseRef.current = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseleave', handleMouseLeave);
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        background: '#0a0a1a',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          borderRadius: '4px',
          boxShadow: '0 0 40px rgba(233,69,96,0.15)',
        }}
      />
    </div>
  );
};

function drawX(x: number, radius: number, offset: number): number {
  return x + radius * offset;
}

function drawY_offset(y: number, radius: number, offset: number): number {
  return y + radius * offset;
}

function darkenColor(color: string, factor: number): string {
  let r: number, g: number, b: number;
  if (color.startsWith('rgb')) {
    const match = color.match(/(\d+)/g);
    if (!match) return color;
    r = parseInt(match[0]);
    g = parseInt(match[1]);
    b = parseInt(match[2]);
  } else {
    const hex = color.replace('#', '');
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  r = Math.round(r * factor);
  g = Math.round(g * factor);
  b = Math.round(b * factor);
  return `rgb(${r},${g},${b})`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export default GameCanvas;
