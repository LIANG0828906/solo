import { useEffect, useRef } from 'react';
import type { GameManager } from '../GameManager';

interface GameCanvasProps {
  gameManager: GameManager;
  width: number;
  height: number;
}

export function GameCanvas({ gameManager, width, height }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const shakeOffset = gameManager.getScreenShakeOffset();

      ctx.save();
      ctx.translate(shakeOffset.x, shakeOffset.y);

      drawBackground(ctx, width, height);
      drawStars(ctx, gameManager.getStars());
      drawSpaceStation(ctx, gameManager.getSpaceStation(), gameManager.getGameState().energyCollected >= gameManager.getGameState().energyTarget);
      drawEnergyOrbs(ctx, gameManager.getEnergyOrbs());
      drawAsteroids(ctx, gameManager.getAsteroids());
      drawParticles(ctx, gameManager.getParticles());
      drawShip(ctx, gameManager.getShip());

      ctx.restore();

      if (gameManager.getGameState().status === 'lost') {
        drawDefeatOverlay(ctx, width, height);
      }

      if (gameManager.getGameState().status === 'won') {
        drawVictoryOverlay(ctx, width, height);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [gameManager, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="block"
      style={{ touchAction: 'none' }}
    />
  );
}

function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0a0e27');
  gradient.addColorStop(1, '#1a1a3e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.max(width, height) * 0.6;
  const nebulaGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  nebulaGradient.addColorStop(0, 'rgba(100, 50, 80, 0.1)');
  nebulaGradient.addColorStop(0.5, 'rgba(60, 30, 60, 0.05)');
  nebulaGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = nebulaGradient;
  ctx.fillRect(0, 0, width, height);
}

function drawStars(ctx: CanvasRenderingContext2D, stars: Array<{ x: number; y: number; size: number; brightness: number; twinklePhase: number }>): void {
  for (const star of stars) {
    const twinkle = (Math.sin(star.twinklePhase) + 1) / 2;
    const alpha = star.brightness * (0.4 + twinkle * 0.6);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSpaceStation(ctx: CanvasRenderingContext2D, station: { position: { x: number; y: number }; radius: number; pulsePhase: number }, isComplete: boolean): void {
  const pulse = (Math.sin(station.pulsePhase * 2) + 1) / 2;
  const baseColor = isComplete ? '#FFD700' : '#00FF00';
  const glowColor = isComplete ? 'rgba(255, 215, 0, 0.3)' : 'rgba(0, 255, 0, 0.3)';

  for (let i = 3; i >= 0; i--) {
    const r = station.radius + i * 15 + pulse * 10;
    const alpha = 0.1 + (3 - i) * 0.05 + pulse * 0.1;
    ctx.strokeStyle = isComplete
      ? `rgba(255, 215, 0, ${alpha})`
      : `rgba(0, 255, 0, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(station.position.x, station.position.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const gradient = ctx.createRadialGradient(
    station.position.x, station.position.y, 0,
    station.position.x, station.position.y, station.radius
  );
  gradient.addColorStop(0, glowColor);
  gradient.addColorStop(0.7, glowColor);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(station.position.x, station.position.y, station.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = baseColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(station.position.x, station.position.y, station.radius * 0.6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.arc(station.position.x, station.position.y, station.radius * 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = baseColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(station.position.x - station.radius * 0.4, station.position.y);
  ctx.lineTo(station.position.x + station.radius * 0.4, station.position.y);
  ctx.moveTo(station.position.x, station.position.y - station.radius * 0.4);
  ctx.lineTo(station.position.x, station.position.y + station.radius * 0.4);
  ctx.stroke();
}

function drawEnergyOrbs(ctx: CanvasRenderingContext2D, orbs: Array<{ position: { x: number; y: number }; radius: number; pulsePhase: number; collected: boolean }>): void {
  for (const orb of orbs) {
    if (orb.collected) continue;

    const pulse = (Math.sin(orb.pulsePhase) + 1) / 2;
    const scale = 0.85 + pulse * 0.3;
    const r = orb.radius * scale;

    const glowGradient = ctx.createRadialGradient(
      orb.position.x, orb.position.y, 0,
      orb.position.x, orb.position.y, r * 2
    );
    glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
    glowGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.2)');
    glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(orb.position.x, orb.position.y, r * 2, 0, Math.PI * 2);
    ctx.fill();

    drawHexagon(ctx, orb.position.x, orb.position.y, r, '#FFD700');

    const innerGradient = ctx.createRadialGradient(
      orb.position.x - r * 0.3, orb.position.y - r * 0.3, 0,
      orb.position.x, orb.position.y, r
    );
    innerGradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
    innerGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.4)');
    innerGradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(orb.position.x, orb.position.y, r * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHexagon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawAsteroids(ctx: CanvasRenderingContext2D, asteroids: Array<{ position: { x: number; y: number }; radius: number; color: string; rotation: number; vertices: Array<{ x: number; y: number }> }>): void {
  for (const asteroid of asteroids) {
    ctx.save();
    ctx.translate(asteroid.position.x, asteroid.position.y);
    ctx.rotate(asteroid.rotation);

    ctx.fillStyle = asteroid.color;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    for (let i = 0; i < asteroid.vertices.length; i++) {
      const v = asteroid.vertices[i];
      if (i === 0) {
        ctx.moveTo(v.x, v.y);
      } else {
        ctx.lineTo(v.x, v.y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const highlightGradient = ctx.createRadialGradient(
      -asteroid.radius * 0.3, -asteroid.radius * 0.3, 0,
      0, 0, asteroid.radius
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    highlightGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(0, 0, asteroid.radius * 0.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Array<{ position: { x: number; y: number }; life: number; maxLife: number; color: string; size: number; type: string }>): void {
  for (const particle of particles) {
    const alpha = particle.life / particle.maxLife;

    if (particle.type === 'exhaust') {
      const gradient = ctx.createRadialGradient(
        particle.position.x, particle.position.y, 0,
        particle.position.x, particle.position.y, particle.size
      );
      gradient.addColorStop(0, `rgba(150, 200, 255, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(100, 150, 255, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'rgba(50, 100, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (particle.type === 'debris') {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (particle.type === 'celebration') {
      ctx.save();
      ctx.translate(particle.position.x, particle.position.y);
      ctx.rotate(particle.life * 0.01);

      ctx.fillStyle = particle.color;
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const outerR = particle.size;
        const innerR = particle.size * 0.4;
        ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
        const innerAngle = angle + Math.PI / 5;
        ctx.lineTo(Math.cos(innerAngle) * innerR, Math.sin(innerAngle) * innerR);
      }
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }
}

function drawShip(ctx: CanvasRenderingContext2D, ship: { position: { x: number; y: number }; angle: number; radius: number; shieldActive: boolean }): void {
  ctx.save();
  ctx.translate(ship.position.x, ship.position.y);
  ctx.rotate(ship.angle);

  if (ship.shieldActive) {
    const shieldGradient = ctx.createRadialGradient(0, 0, ship.radius * 0.8, 0, 0, ship.radius * 1.8);
    shieldGradient.addColorStop(0, 'rgba(100, 200, 255, 0.1)');
    shieldGradient.addColorStop(0.7, 'rgba(100, 200, 255, 0.3)');
    shieldGradient.addColorStop(1, 'rgba(100, 200, 255, 0.5)');
    ctx.fillStyle = shieldGradient;
    ctx.beginPath();
    ctx.arc(0, 0, ship.radius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(150, 220, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, ship.radius * 1.6, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = '#c0c0c8';
  ctx.strokeStyle = '#808090';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(ship.radius, 0);
  ctx.lineTo(-ship.radius * 0.6, -ship.radius * 0.7);
  ctx.lineTo(-ship.radius * 0.8, -ship.radius * 0.5);
  ctx.lineTo(-ship.radius * 0.5, 0);
  ctx.lineTo(-ship.radius * 0.8, ship.radius * 0.5);
  ctx.lineTo(-ship.radius * 0.6, ship.radius * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const cockpitGradient = ctx.createLinearGradient(ship.radius * 0.2, -ship.radius * 0.3, ship.radius * 0.2, ship.radius * 0.3);
  cockpitGradient.addColorStop(0, '#4a9eff');
  cockpitGradient.addColorStop(0.5, '#2070d0');
  cockpitGradient.addColorStop(1, '#104080');
  ctx.fillStyle = cockpitGradient;
  ctx.beginPath();
  ctx.ellipse(ship.radius * 0.2, 0, ship.radius * 0.35, ship.radius * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e8e8f0';
  ctx.beginPath();
  ctx.ellipse(ship.radius * 0.15, -ship.radius * 0.1, ship.radius * 0.15, ship.radius * 0.08, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#606070';
  ctx.beginPath();
  ctx.moveTo(-ship.radius * 0.7, -ship.radius * 0.5);
  ctx.lineTo(-ship.radius * 0.9, -ship.radius * 0.3);
  ctx.lineTo(-ship.radius * 0.6, -ship.radius * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-ship.radius * 0.7, ship.radius * 0.5);
  ctx.lineTo(-ship.radius * 0.9, ship.radius * 0.3);
  ctx.lineTo(-ship.radius * 0.6, ship.radius * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawDefeatOverlay(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('任务失败', width / 2, height / 2 - 30);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = '20px sans-serif';
  ctx.fillText('点击重新开始', width / 2, height / 2 + 30);
}

function drawVictoryOverlay(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('任务完成！', width / 2, height / 2 - 30);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = '20px sans-serif';
  ctx.fillText('点击重新开始', width / 2, height / 2 + 30);
}
