import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  GameStateSnapshot,
  AsteroidState,
  EnemyState,
  FragmentDropState,
  ParticleState,
} from '../engine/GameEngine';

function drawStars(ctx: CanvasRenderingContext2D, snapshot: GameStateSnapshot): void {
  for (const s of snapshot.stars) {
    ctx.globalAlpha = s.opacity;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }
  ctx.globalAlpha = 1;
}

function drawPlayer(ctx: CanvasRenderingContext2D, snapshot: GameStateSnapshot): void {
  const p = snapshot.player;
  if (snapshot.gameState === 'game_over') return;
  if (p.invincible && p.invincibleBlink) {
    ctx.globalAlpha = 0.2;
  }

  ctx.save();
  ctx.translate(p.x + p.width / 2, p.y + p.height / 2);

  ctx.beginPath();
  ctx.moveTo(0, -p.height / 2);
  ctx.lineTo(-p.width / 2, p.height / 2);
  ctx.lineTo(p.width / 2, p.height / 2);
  ctx.closePath();

  ctx.fillStyle = '#4A90FF';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, -p.height / 2 + 8);
  ctx.lineTo(-6, p.height / 2 - 4);
  ctx.lineTo(6, p.height / 2 - 4);
  ctx.closePath();
  ctx.fillStyle = '#6BB5FF';
  ctx.fill();

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawBullets(ctx: CanvasRenderingContext2D, snapshot: GameStateSnapshot): void {
  ctx.fillStyle = '#FFFFFF';
  for (const b of snapshot.bullets) {
    ctx.fillRect(b.x, b.y, b.width, b.height);
  }
}

function drawAsteroid(ctx: CanvasRenderingContext2D, a: AsteroidState): void {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(a.rotation);

  ctx.beginPath();
  const segments = 12;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    let r = a.radius;

    for (const g of a.grooves) {
      const diff = Math.abs(angle - g.angle);
      const minDiff = Math.min(diff, Math.PI * 2 - diff);
      if (minDiff < 0.5) {
        r -= a.radius * g.depth * (1 - minDiff / 0.5);
      }
    }

    r = Math.max(r, a.radius * 0.5);
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  ctx.fillStyle = '#555577';
  ctx.fill();
  ctx.strokeStyle = '#444466';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: EnemyState): void {
  ctx.save();
  ctx.translate(e.x + e.width / 2, e.y + e.height / 2);
  ctx.rotate(e.wingRotation);

  ctx.strokeStyle = '#FF4444';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-e.width / 2, -e.height / 2);
  ctx.lineTo(e.width / 2, e.height / 2);
  ctx.moveTo(e.width / 2, -e.height / 2);
  ctx.lineTo(-e.width / 2, e.height / 2);
  ctx.stroke();

  ctx.fillStyle = '#FF4444';
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawFragmentDrop(ctx: CanvasRenderingContext2D, f: FragmentDropState): void {
  const floatY = Math.sin(f.floatTime * 2) * 5;

  ctx.save();
  ctx.translate(f.x, f.y + floatY);
  ctx.rotate(f.rotation);

  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 12;

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
    const px = Math.cos(angle) * f.size;
    const py = Math.sin(angle) * f.size;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  ctx.fillStyle = '#FFD700';
  ctx.fill();
  ctx.strokeStyle = '#FFA500';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: ParticleState[]): void {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawGame(ctx: CanvasRenderingContext2D, snapshot: GameStateSnapshot): void {
  ctx.fillStyle = '#0A0A1A';
  ctx.fillRect(0, 0, snapshot.canvasWidth, snapshot.canvasHeight);

  drawStars(ctx, snapshot);
  drawBullets(ctx, snapshot);

  for (const a of snapshot.asteroids) {
    drawAsteroid(ctx, a);
  }
  for (const e of snapshot.enemies) {
    drawEnemy(ctx, e);
  }
  for (const f of snapshot.fragmentDrops) {
    drawFragmentDrop(ctx, f);
  }

  drawParticles(ctx, snapshot.particles);
  drawPlayer(ctx, snapshot);
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snapshot = useGameStore((s) => s.snapshot);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !snapshot) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawGame(ctx, snapshot);
  }, [snapshot]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'block',
      }}
    />
  );
}
