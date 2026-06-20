import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gameStore } from '../store';
import { initGame, update, fireBeam } from '../engine/particleSystem';
import { detectCollisionsAndWarnings } from '../engine/collisionDetector';
import { GameState, Debris, SatellitePart, Particle, Star, Ship } from '../engine/types';

const BEAM_LENGTH = 60;

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [scale, setScale] = useState(1);
  const stateRef = useRef<GameState>(gameStore.getState());

  useEffect(() => {
    return gameStore.subscribe((state) => {
      stateRef.current = state;
    });
  }, []);

  const handleResize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const baseWidth = 1200;
    const baseHeight = 800;

    const newScale = Math.min(containerWidth / baseWidth, 1);
    setScale(newScale);

    const canvas = canvasRef.current;
    canvas.width = baseWidth;
    canvas.height = baseHeight;
    canvas.style.width = `${baseWidth * newScale}px`;
    canvas.style.height = `${baseHeight * newScale}px`;
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    initGame();

    const handleKeyDown = (e: KeyboardEvent) => {
      gameStore.setKey(e.key, true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      gameStore.setKey(e.key, false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1200;
    const y = ((e.clientY - rect.top) / rect.height) * 800;
    gameStore.setMousePosition(x, y);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      fireBeam();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      update(dt);
      detectCollisionsAndWarnings();

      const state = stateRef.current;
      draw(ctx, state);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const draw = (ctx: CanvasRenderingContext2D, state: GameState) => {
    const { canvasWidth, canvasHeight } = state;

    drawBackground(ctx, canvasWidth, canvasHeight);
    drawStars(ctx, state.stars);
    drawGalaxy(ctx, canvasWidth / 2, canvasHeight / 2, state.galaxyAngle);
    drawSatelliteParts(ctx, state.satelliteParts);
    drawDebris(ctx, state.debrisList, state.warnings);
    drawBeam(ctx, state);
    drawShip(ctx, state.ship);
    drawParticles(ctx, state.particles);
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#0A0E27');
    gradient.addColorStop(1, '#1B1F3B');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  };

  const drawStars = (ctx: CanvasRenderingContext2D, stars: Star[]) => {
    stars.forEach((star) => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
      ctx.fill();
    });
  };

  const drawGalaxy = (ctx: CanvasRenderingContext2D, cx: number, cy: number, angle: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const gradient = ctx.createRadialGradient(0, 0, 50, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(100, 150, 255, 0.3)');
    gradient.addColorStop(0.5, 'rgba(150, 100, 255, 0.15)');
    gradient.addColorStop(1, 'rgba(50, 100, 200, 0)');

    ctx.beginPath();
    ctx.ellipse(0, 0, 350, 80, 0, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();
  };

  const drawDebris = (ctx: CanvasRenderingContext2D, debrisList: Debris[], warnings: { debrisId: string }[]) => {
    const warningIds = new Set(warnings.map((w) => w.debrisId));
    const time = Date.now() / 1000;

    debrisList.forEach((debris) => {
      if (warningIds.has(debris.id)) {
        const pulse = 0.2 + 0.6 * Math.abs(Math.sin(time * Math.PI * 2.5));
        ctx.beginPath();
        ctx.arc(debris.x, debris.y, 15, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 82, 82, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(debris.x, debris.y);
      ctx.rotate(debris.rotation);

      ctx.beginPath();
      for (let i = 0; i < debris.vertices; i++) {
        const angle = (i / debris.vertices) * Math.PI * 2;
        const r = debris.radius * (0.7 + 0.3 * Math.sin(i * 1.5));
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = debris.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.restore();
    });
  };

  const drawSatelliteParts = (ctx: CanvasRenderingContext2D, parts: SatellitePart[]) => {
    parts.forEach((part) => {
      if (part.collected) return;

      const glowIntensity = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(part.glowPhase));

      const gradient = ctx.createRadialGradient(part.x, part.y, 0, part.x, part.y, 20);
      gradient.addColorStop(0, `rgba(255, 215, 0, ${glowIntensity})`);
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(part.x, part.y, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(part.x, part.y);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * 10;
        const y = Math.sin(angle) * 10;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = '#FFD700';
      ctx.fill();
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    });
  };

  const drawShip = (ctx: CanvasRenderingContext2D, ship: Ship) => {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);

    if (ship.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    const glowGradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 25);
    glowGradient.addColorStop(0, 'rgba(33, 150, 243, 0.4)');
    glowGradient.addColorStop(1, 'rgba(33, 150, 243, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-12, -12);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-12, 12);
    ctx.closePath();

    const shipColor = ship.hitFlashTimer > 0 ? '#FF5252' : '#2196F3';
    ctx.fillStyle = shipColor;
    ctx.fill();
    ctx.strokeStyle = '#64B5F6';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(2, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();

    ctx.restore();
  };

  const drawBeam = (ctx: CanvasRenderingContext2D, state: GameState) => {
    if (!state.beamActive) return;

    const { ship, beamAngle } = state;
    const endX = ship.x + Math.cos(beamAngle) * BEAM_LENGTH;
    const endY = ship.y + Math.sin(beamAngle) * BEAM_LENGTH;

    const gradient = ctx.createLinearGradient(ship.x, ship.y, endX, endY);
    gradient.addColorStop(0, 'rgba(255, 235, 59, 1)');
    gradient.addColorStop(1, 'rgba(255, 235, 59, 0.3)');

    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'rgba(255, 255, 200, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
    particles.forEach((p) => {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        style={{
          cursor: 'crosshair',
          display: 'block',
        }}
      />
    </div>
  );
};
