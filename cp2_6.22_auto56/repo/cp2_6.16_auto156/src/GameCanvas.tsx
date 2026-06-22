import React, { useRef, useEffect, useCallback } from 'react';
import { useGameState } from './useGameState';
import { Asteroid } from './AsteroidField';

function renderStarfield(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  shipX: number,
  shipY: number,
  stars: { x: number; y: number; size: number; twinklePhase: number; twinkleSpeed: number; layer: number }[],
  time: number
) {
  const parallaxFactors = [0.02, 0.05, 0.1];
  const cx = w / 2;
  const cy = h / 2;

  for (const star of stars) {
    const pf = parallaxFactors[star.layer] || 0.02;
    const sx = star.x - (shipX - cx) * pf;
    const sy = star.y - (shipY - cy) * pf;

    if (sx < -10 || sx > w + 10 || sy < -10 || sy > h + 10) continue;

    const twinkle = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinklePhase));
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function renderAsteroid(ctx: CanvasRenderingContext2D, a: Asteroid, time: number) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(a.rotation);

  const baseColor = a.mineralType === 'rare' ? '#9B59B6' : '#7B7B7B';
  const darkColor = a.mineralType === 'rare' ? '#7D3C98' : '#5A5A5A';

  for (const layer of a.layers) {
    const lr = a.radius * layer.radiusFactor;
    ctx.beginPath();
    ctx.arc(layer.offsetX * a.radius, layer.offsetY * a.radius, lr, 0, Math.PI * 2);
    ctx.fillStyle = darkColor;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.moveTo(a.vertices[0].x, a.vertices[0].y);
  for (let i = 1; i < a.vertices.length; i++) {
    ctx.lineTo(a.vertices[i].x, a.vertices[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = baseColor;
  ctx.fill();
  ctx.strokeStyle = a.mineralType === 'rare' ? '#BB8FCE' : '#999999';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();

  if (a.isNear) {
    const t = Math.sin(a.highlightPhase) * 0.5 + 0.5;
    const r = Math.round(255);
    const g = Math.round(255 - t * 55);
    const b = Math.round(255 - t * 155);
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rotation);
    ctx.beginPath();
    ctx.moveTo(a.vertices[0].x, a.vertices[0].y);
    for (let i = 1; i < a.vertices.length; i++) {
      ctx.lineTo(a.vertices[i].x, a.vertices[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(${r},${g},${b},${0.4 + t * 0.4})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

function renderShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  invulnerable: boolean,
  time: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  if (invulnerable && Math.sin(time * 20) > 0) {
    ctx.globalAlpha = 0.5;
  }

  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-12, -10);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-12, 10);
  ctx.closePath();

  const grad = ctx.createLinearGradient(-12, 0, 18, 0);
  grad.addColorStop(0, '#667788');
  grad.addColorStop(1, '#C5C6C7');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#E0E0E0';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(2, 0, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#66FCF1';
  ctx.fill();

  ctx.restore();
  ctx.globalAlpha = 1;
}

function renderMiningLaser(
  ctx: CanvasRenderingContext2D,
  shipX: number,
  shipY: number,
  shipAngle: number,
  targetX: number,
  targetY: number,
  progress: number
) {
  const startX = shipX + Math.cos(shipAngle) * 18;
  const startY = shipY + Math.sin(shipAngle) * 18;

  ctx.save();

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(targetX, targetY);
  ctx.strokeStyle = 'rgba(0, 255, 100, 0.3)';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(targetX, targetY);
  ctx.strokeStyle = `rgba(0, 255, 100, ${0.5 + progress * 0.5})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(targetX, targetY);
  ctx.strokeStyle = '#00FF64';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: { x: number; y: number; life: number; maxLife: number; size: number; r: number; g: number; b: number }[]
) {
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function renderScreenFlash(ctx: CanvasRenderingContext2D, w: number, h: number, timer: number) {
  if (timer <= 0) return;
  const alpha = Math.min(1, timer / 0.1) * 0.3;
  ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
  ctx.fillRect(0, 0, w, h);
}

function render(
  ctx: CanvasRenderingContext2D,
  state: ReturnType<typeof useGameState.getState>,
  time: number
) {
  const { canvasWidth: w, canvasHeight: h } = state;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#0B0C10');
  bgGrad.addColorStop(1, '#1F2833');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  renderStarfield(ctx, w, h, state.shipX, state.shipY, state.stars, time);

  for (const a of state.asteroids) {
    renderAsteroid(ctx, a, time);
  }

  renderParticles(ctx, state.explosionParticles);

  if (state.isMining && state.miningTargetId) {
    const target = state.asteroids.find((a) => a.id === state.miningTargetId);
    if (target) {
      renderMiningLaser(
        ctx,
        state.shipX,
        state.shipY,
        state.shipAngle,
        target.x,
        target.y,
        state.miningProgress / 0.5
      );
    }
  }

  renderParticles(ctx, state.trailParticles);

  renderShip(ctx, state.shipX, state.shipY, state.shipAngle, state.invulnerableTimer > 0, time);

  renderScreenFlash(ctx, w, h, state.screenFlashTimer);
}

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const gameTimeRef = useRef<number>(0);

  const gameLoop = useCallback(() => {
    const now = performance.now();
    const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = now;
    gameTimeRef.current += dt;

    useGameState.getState().update(dt);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        render(ctx, useGameState.getState(), gameTimeRef.current);
      }
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      useGameState.getState().setCanvasSize(window.innerWidth, window.innerHeight);
    };
    resize();
    window.addEventListener('resize', resize);

    useGameState.getState().startGame();

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameLoop]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      useGameState.getState().keyPressed(e.key.toLowerCase());
    };
    const onKeyUp = (e: KeyboardEvent) => {
      useGameState.getState().keyReleased(e.key.toLowerCase());
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', position: 'absolute', top: 0, left: 0 }}
    />
  );
};

export default GameCanvas;
