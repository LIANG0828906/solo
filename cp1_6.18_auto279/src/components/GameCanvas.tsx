import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store';
import type { Asteroid, Ore, Meteor, Particle, Ship, Star } from '../gameLogic';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const gravityPulseRef = useRef<number>(0);
  const hoveredAsteroidRef = useRef<number | null>(null);

  const {
    canvasWidth,
    canvasHeight,
    setCanvasSize,
    tick,
    isPlaying,
  } = useGameStore();

  const drawStar = useCallback((ctx: CanvasRenderingContext2D, star: Star) => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
    ctx.fill();
  }, []);

  const drawAsteroid = useCallback((
    ctx: CanvasRenderingContext2D,
    asteroid: Asteroid,
    isHovered: boolean
  ) => {
    ctx.save();
    ctx.translate(asteroid.x, asteroid.y);
    ctx.rotate(asteroid.rotation);

    const scale = isHovered ? 1.05 : 1;
    ctx.scale(scale, scale);

    ctx.beginPath();
    const vertices = asteroid.vertices;
    for (let i = 0; i < vertices.length; i += 2) {
      const angle = vertices[i];
      const r = vertices[i + 1];
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    ctx.fillStyle = asteroid.color;
    ctx.fill();

    if (isHovered) {
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00E5FF';
      ctx.shadowBlur = 10;
      ctx.stroke();
    }

    ctx.restore();
  }, []);

  const drawShip = useCallback((
    ctx: CanvasRenderingContext2D,
    ship: Ship,
    pulseAlpha: number
  ) => {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);

    ctx.beginPath();
    ctx.arc(0, 0, ship.gravityRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 229, 255, ${pulseAlpha})`;
    ctx.fill();

    const flameFlicker = Math.sin(frameCountRef.current * 0.3) * 0.3 + 0.7;
    ctx.beginPath();
    ctx.moveTo(-8, 15);
    ctx.lineTo(0, 25 + flameFlicker * 10);
    ctx.lineTo(8, 15);
    ctx.closePath();
    
    const flameGradient = ctx.createLinearGradient(0, 15, 0, 35);
    flameGradient.addColorStop(0, '#FF8C00');
    flameGradient.addColorStop(1, 'rgba(255, 140, 0, 0)');
    ctx.fillStyle = flameGradient;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(-15, 15);
    ctx.lineTo(0, 10);
    ctx.lineTo(15, 15);
    ctx.closePath();

    ctx.fillStyle = '#00E5FF';
    ctx.fill();
    ctx.strokeStyle = '#80F0FF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(-5, 5);
    ctx.lineTo(5, 5);
    ctx.closePath();
    ctx.fillStyle = '#0A0A2E';
    ctx.fill();

    ctx.restore();
  }, []);

  const drawOre = useCallback((ctx: CanvasRenderingContext2D, ore: Ore) => {
    ctx.save();
    ctx.translate(ore.x, ore.y);
    ctx.rotate(ore.angle);

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * ore.size;
      const y = Math.sin(angle) * ore.size;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    ctx.fillStyle = ore.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (ore.isAttracted) {
      ctx.shadowColor = ore.color;
      ctx.shadowBlur = 10;
    }

    ctx.restore();
  }, []);

  const drawMeteor = useCallback((ctx: CanvasRenderingContext2D, meteor: Meteor) => {
    ctx.save();
    ctx.translate(meteor.x, meteor.y);

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, meteor.radius);
    gradient.addColorStop(0, '#FF6B6B');
    gradient.addColorStop(0.5, '#E74C3C');
    gradient.addColorStop(1, '#8B0000');

    ctx.beginPath();
    ctx.arc(0, 0, meteor.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowColor = '#E74C3C';
    ctx.shadowBlur = 15;

    const trailAngle = Math.atan2(-meteor.vy, -meteor.vx);
    const trailLength = meteor.radius * 2.5;
    
    ctx.beginPath();
    ctx.moveTo(Math.cos(trailAngle) * meteor.radius * 0.8, Math.sin(trailAngle) * meteor.radius * 0.8);
    ctx.lineTo(Math.cos(trailAngle + 0.3) * trailLength, Math.sin(trailAngle + 0.3) * trailLength);
    ctx.lineTo(Math.cos(trailAngle - 0.3) * trailLength, Math.sin(trailAngle - 0.3) * trailLength);
    ctx.closePath();
    
    const trailGradient = ctx.createLinearGradient(
      Math.cos(trailAngle) * meteor.radius * 0.8,
      Math.sin(trailAngle) * meteor.radius * 0.8,
      Math.cos(trailAngle) * trailLength,
      Math.sin(trailAngle) * trailLength
    );
    trailGradient.addColorStop(0, 'rgba(231, 76, 60, 0.8)');
    trailGradient.addColorStop(1, 'rgba(231, 76, 60, 0)');
    ctx.fillStyle = trailGradient;
    ctx.fill();

    ctx.restore();
  }, []);

  const drawParticle = useCallback((ctx: CanvasRenderingContext2D, particle: Particle) => {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = particle.life;
    ctx.fill();
    ctx.globalAlpha = 1;
  }, []);

  const drawBackground = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) * 0.7
    );
    gradient.addColorStop(0, '#1A1A3E');
    gradient.addColorStop(1, '#0A0A2E');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }, []);

  const drawGlowBorder = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const padding = 10;
    ctx.save();
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, width - padding * 2, height - padding * 2);
    ctx.restore();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const state = useGameStore.getState();
    let hovered: number | null = null;

    for (const asteroid of state.asteroids) {
      const dx = mouseX - asteroid.x;
      const dy = mouseY - asteroid.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < asteroid.size) {
        hovered = asteroid.id;
        break;
      }
    }

    hoveredAsteroidRef.current = hovered;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      setCanvasSize(width, height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', handleMouseMove);

    const gameLoop = () => {
      const state = useGameStore.getState();
      const {
        ship,
        asteroids,
        ores,
        meteors,
        particles,
        stars,
        canvasWidth,
        canvasHeight,
      } = state;

      gravityPulseRef.current += 0.05;
      const pulseAlpha = 0.1 + Math.sin(gravityPulseRef.current) * 0.1 + 0.1;

      frameCountRef.current++;

      if (state.isPlaying && !state.isGameOver) {
        tick();
      }

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      drawBackground(ctx, canvasWidth, canvasHeight);

      for (const star of stars) {
        drawStar(ctx, star);
      }

      drawGlowBorder(ctx, canvasWidth, canvasHeight);

      for (const asteroid of asteroids) {
        const isHovered = hoveredAsteroidRef.current === asteroid.id;
        drawAsteroid(ctx, asteroid, isHovered);
      }

      for (const ore of ores) {
        drawOre(ctx, ore);
      }

      for (const meteor of meteors) {
        drawMeteor(ctx, meteor);
      }

      for (const particle of particles) {
        drawParticle(ctx, particle);
      }

      if (state.isPlaying || state.isGameOver) {
        drawShip(ctx, ship, pulseAlpha);
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [
    drawBackground,
    drawStar,
    drawAsteroid,
    drawShip,
    drawOre,
    drawMeteor,
    drawParticle,
    drawGlowBorder,
    setCanvasSize,
    tick,
    isPlaying,
    handleMouseMove,
  ]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        cursor: hoveredAsteroidRef.current !== null ? 'pointer' : 'default',
      }}
    />
  );
}
