import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from './GameState';
import {
  updateStars,
  updateShip,
  applyGravity,
  updateEnergyBalls,
  updateAsteroids,
  applyRepulsionToAsteroids,
  checkCollisions,
  updateTraps,
  updateRepulsionWave,
  updatePortal,
  spawnDoubleBall,
  createTrap,
  Vec2,
} from './GameLogic';

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<Vec2>({ x: 0, y: 0 });
  const isMouseDownRef = useRef(false);
  const mouseDownTimeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animationRef = useRef<number>(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const portalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    config,
    isMobile,
    updateState,
    collectEnergy,
    incrementLevel,
    fireRepulsionWave,
    activateGravity,
    deactivateGravity,
    setPaused,
  } = useGameStore();

  const drawStar = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number, brightness: number) => {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
    ctx.fill();
  }, []);

  const drawShip = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number, opacity: number, trail: Vec2[]) => {
    ctx.save();
    ctx.globalAlpha = opacity;

    if (trail.length > 1) {
      for (let i = 0; i < trail.length - 1; i++) {
        const alpha = (i / trail.length) * 0.6;
        ctx.beginPath();
        ctx.arc(trail[i].x, trail[i].y, 3 + i * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(106, 90, 205, ${alpha})`;
        ctx.fill();
      }
    }

    ctx.translate(x, y);
    ctx.rotate(rotation);

    ctx.shadowColor = '#6A5ACD';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-12, -12);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-12, 12);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(-15, 0, 20, 0);
    gradient.addColorStop(0, '#4169E1');
    gradient.addColorStop(1, '#6A5ACD');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }, []);

  const drawGravityField = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(106, 90, 205, 0.6)');
    gradient.addColorStop(0.5, 'rgba(75, 95, 220, 0.35)');
    gradient.addColorStop(1, 'rgba(65, 105, 225, 0.1)');

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(106, 90, 205, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, []);

  const drawEnergyBall = useCallback((ctx: CanvasRenderingContext2D, ball: { x: number; y: number; isDouble: boolean; rotation: number; pulsePhase: number; trail: Vec2[] }) => {
    const radius = ball.isDouble ? 9 : 6;

    if (ball.trail.length > 1) {
      for (let i = 0; i < ball.trail.length - 1; i++) {
        const alpha = ((i + 1) / ball.trail.length) * 0.8;
        const trailRadius = radius * (i / ball.trail.length);
        ctx.beginPath();
        ctx.arc(ball.trail[i].x, ball.trail[i].y, Math.max(1, trailRadius), 0, Math.PI * 2);
        ctx.fillStyle = ball.isDouble
          ? `rgba(255, 215, 0, ${alpha})`
          : `rgba(255, 255, 0, ${alpha})`;
        ctx.fill();
      }
    }

    const pulseScale = ball.isDouble ? 1 + Math.sin(ball.pulsePhase) * 0.15 : 1;
    const r = radius * pulseScale;

    ctx.save();
    ctx.shadowColor = ball.isDouble ? '#FFD700' : '#FFFF00';
    ctx.shadowBlur = ball.isDouble ? 20 : 12;

    const gradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, r);
    if (ball.isDouble) {
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(0.3, '#FFD700');
      gradient.addColorStop(1, '#FFA500');
    } else {
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(0.4, '#FFFF00');
      gradient.addColorStop(1, '#FFD700');
    }

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.rotation);
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r * 0.3);
    ctx.lineTo(r * 0.3, r * 0.3);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }, []);

  const drawAsteroid = useCallback((ctx: CanvasRenderingContext2D, ast: { x: number; y: number; size: number; rotation: number; vertices: number[] }) => {
    ctx.save();
    ctx.translate(ast.x, ast.y);
    ctx.rotate(ast.rotation);

    ctx.shadowColor = '#2F2F2F';
    ctx.shadowBlur = 5;

    ctx.beginPath();
    const numVerts = ast.vertices.length / 2;
    for (let i = 0; i < numVerts; i++) {
      const angle = ast.vertices[i * 2];
      const r = ast.vertices[i * 2 + 1];
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, ast.size);
    gradient.addColorStop(0, '#5A5A5A');
    gradient.addColorStop(1, '#2F2F2F');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }, []);

  const drawTrap = useCallback((ctx: CanvasRenderingContext2D, trap: { x: number; y: number; flashPhase: number }) => {
    const flash = (Math.sin(trap.flashPhase) + 1) / 2;
    const radius = 15 + flash * 3;

    ctx.save();
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 20 + flash * 10;

    const gradient = ctx.createRadialGradient(trap.x, trap.y, 0, trap.x, trap.y, radius);
    gradient.addColorStop(0, '#FF0000');
    gradient.addColorStop(0.6, '#CC0000');
    gradient.addColorStop(1, '#8B0000');

    ctx.beginPath();
    ctx.arc(trap.x, trap.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(trap.x, trap.y, radius * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 100, 100, ${0.5 + flash * 0.5})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }, []);

  const drawRepulsionWave = useCallback((ctx: CanvasRenderingContext2D, wave: { x: number; y: number; radius: number; alpha: number; active: boolean }) => {
    if (!wave.active || wave.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = wave.alpha;
    ctx.shadowColor = '#FF69B4';
    ctx.shadowBlur = 15;

    for (let i = 0; i < 3; i++) {
      const r = wave.radius - i * 15;
      if (r <= 0) continue;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 105, 180, ${1 - i * 0.3})`;
      ctx.lineWidth = 4 - i;
      ctx.stroke();
    }

    ctx.restore();
  }, []);

  const drawPortal = useCallback((ctx: CanvasRenderingContext2D, portal: { x: number; y: number; radius: number; rotation: number; alpha: number; active: boolean }) => {
    if (!portal.active || portal.alpha <= 0 || portal.radius <= 0) return;

    ctx.save();
    ctx.globalAlpha = portal.alpha;
    ctx.translate(portal.x, portal.y);
    ctx.rotate(portal.rotation);

    ctx.shadowColor = '#8A2BE2';
    ctx.shadowBlur = 30;

    for (let i = 0; i < 3; i++) {
      const r = portal.radius - i * 15;
      if (r <= 0) continue;
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      gradient.addColorStop(0, 'rgba(138, 43, 226, 0.8)');
      gradient.addColorStop(0.7, 'rgba(65, 105, 225, 0.5)');
      gradient.addColorStop(1, 'rgba(0, 0, 255, 0)');

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(0, 0, portal.radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.restore();
  }, []);

  const gameLoop = useCallback((timestamp: number) => {
    const state = useGameStore.getState();
    const canvas = canvasRef.current;
    if (!canvas) {
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const dt = lastTimeRef.current === 0 ? 0.016 : Math.min(0.05, (timestamp - lastTimeRef.current) / 1000);
    lastTimeRef.current = timestamp;

    if (state.isPaused || state.gameOver) {
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const { width, height } = config;

    const newStars = updateStars(state.stars, dt, width, height);

    const newShip = updateShip(state.ship, mouseRef.current.x, mouseRef.current.y, dt, width, height);

    let newBalls = applyGravity(state.energyBalls, newShip, state.gravityRadius, state.isGravityActive, dt);
    newBalls = updateEnergyBalls(newBalls, dt, width, height);

    let newAsteroids = updateAsteroids(state.asteroids, dt, width, height);
    newAsteroids = applyRepulsionToAsteroids(newAsteroids, state.repulsionWave, dt);

    const newWave = updateRepulsionWave(state.repulsionWave, dt);
    const newTraps = updateTraps(state.traps, dt);
    const newPortal = updatePortal(state.portal, dt);

    const collisionResult = checkCollisions(newShip, newBalls, newAsteroids, newTraps, state.config);

    const collectedCount = collisionResult.collectedBalls.reduce((sum, b) => sum + (b.isDouble ? 2 : 1), 0);

    let finalBalls = collisionResult.remainingBalls;
    let spawnDouble = false;
    let newCollectedSince = state.collectedSinceUpgrade + collectedCount;

    while (newCollectedSince >= 5) {
      newCollectedSince -= 5;
      spawnDouble = true;
    }

    if (spawnDouble) {
      finalBalls = [...finalBalls, spawnDoubleBall(width, height)];
    }

    if (finalBalls.length < 8) {
      const count = Math.min(5, 10 - finalBalls.length);
      for (let i = 0; i < count; i++) {
        const newBall = {
          id: Date.now() + i,
          x: Math.random() * (width - 100) + 50,
          y: Math.random() * (height - 100) + 50,
          vx: (Math.random() - 0.5) * 40,
          vy: (Math.random() - 0.5) * 40,
          isDouble: false,
          rotation: Math.random() * Math.PI * 2,
          pulsePhase: Math.random() * Math.PI * 2,
          trail: [] as Vec2[],
          collecting: false,
        };
        finalBalls.push(newBall);
      }
    }

    const now = Date.now();
    let finalTraps = newTraps;
    if (now - state.lastTrapSpawn > state.config.trapInterval) {
      finalTraps = [...newTraps, createTrap(width, height)];
      if (finalTraps.length > 5) {
        finalTraps = finalTraps.slice(-5);
      }
    }

    let newShakeTime = state.shakeTime;
    let resetGame = false;
    let finalShip = collisionResult.ship;

    if (collisionResult.hitAsteroid) {
      newShakeTime = state.config.shakeDuration;
      if (finalShip.collisionCount >= state.config.collisionResetCount) {
        resetGame = true;
      }
    } else {
      newShakeTime = Math.max(0, newShakeTime - dt * 1000);
    }

    if (collisionResult.hitTrap) {
      collectEnergy(-3);
    }

    if (collectedCount > 0) {
      collectEnergy(collectedCount);
    }

    let shakeX = 0;
    let shakeY = 0;
    if (newShakeTime > 0) {
      const intensity = newShakeTime / state.config.shakeDuration * 8;
      shakeX = (Math.random() - 0.5) * intensity;
      shakeY = (Math.random() - 0.5) * intensity;
    }

    if (state.levelComplete && state.portal.active && !portalTimerRef.current) {
      portalTimerRef.current = setTimeout(() => {
        incrementLevel();
        portalTimerRef.current = null;
      }, 1500);
    }

    if (resetGame) {
      useGameStore.getState().resetGame();
    } else {
      updateState({
        stars: newStars,
        ship: finalShip,
        energyBalls: finalBalls,
        asteroids: newAsteroids,
        traps: finalTraps,
        repulsionWave: newWave,
        portal: newPortal,
        shakeTime: newShakeTime,
        lastTrapSpawn: now - state.lastTrapSpawn > state.config.trapInterval ? now : state.lastTrapSpawn,
        collectedSinceUpgrade: newCollectedSince,
      });
    }

    ctx.fillStyle = '#0B001A';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(shakeX, shakeY);

    for (const star of newStars) {
      drawStar(ctx, star.x, star.y, star.size, star.brightness);
    }

    for (const trap of finalTraps) {
      drawTrap(ctx, trap);
    }

    if (state.isGravityActive && state.gravityHoldTime >= 1) {
      drawGravityField(ctx, finalShip.x, finalShip.y, state.gravityRadius);
    }

    for (const ball of finalBalls) {
      drawEnergyBall(ctx, ball);
    }

    for (const ast of newAsteroids) {
      drawAsteroid(ctx, ast);
    }

    drawRepulsionWave(ctx, newWave);
    drawShip(ctx, finalShip.x, finalShip.y, finalShip.rotation, finalShip.opacity, finalShip.trail);
    drawPortal(ctx, newPortal);

    ctx.restore();

    const uiScale = isMobile ? 0.5 : 1;
    const fontSize = 24 * uiScale;
    ctx.save();
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#6A5ACD';
    ctx.shadowBlur = 10;
    ctx.fillText(`⚡ ${state.score} / ${state.targetEnergy}`, 20 * uiScale, 35 * uiScale);
    ctx.font = `${18 * uiScale}px Arial, sans-serif`;
    ctx.fillStyle = '#A0A0A0';
    ctx.shadowBlur = 0;
    ctx.fillText(`关卡 ${state.level}`, 20 * uiScale, 60 * uiScale);
    ctx.restore();

    ctx.save();
    const barWidth = 120 * uiScale;
    const barHeight = 4 * uiScale;
    const barX = 20 * uiScale;
    const barY = 70 * uiScale;
    ctx.fillStyle = 'rgba(106, 90, 205, 0.3)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#6A5ACD';
    ctx.shadowColor = '#6A5ACD';
    ctx.shadowBlur = 5;
    const progress = state.collectedSinceUpgrade / 5;
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    ctx.restore();

    if (finalShip.collisionCount > 0) {
      ctx.save();
      const heartSize = 16 * uiScale;
      for (let i = 0; i < state.config.collisionResetCount - finalShip.collisionCount; i++) {
        const hx = width - (i + 1) * (heartSize + 8) - 15;
        const hy = 25 * uiScale;
        ctx.fillStyle = '#FF69B4';
        ctx.shadowColor = '#FF69B4';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(hx + heartSize / 2, hy + heartSize * 0.3);
        ctx.bezierCurveTo(hx + heartSize / 2, hy, hx, hy, hx, hy + heartSize * 0.3);
        ctx.bezierCurveTo(hx, hy + heartSize * 0.6, hx + heartSize / 2, hy + heartSize, hx + heartSize / 2, hy + heartSize);
        ctx.bezierCurveTo(hx + heartSize / 2, hy + heartSize, hx + heartSize, hy + heartSize * 0.6, hx + heartSize, hy + heartSize * 0.3);
        ctx.bezierCurveTo(hx + heartSize, hy, hx + heartSize / 2, hy, hx + heartSize / 2, hy + heartSize * 0.3);
        ctx.fill();
      }
      ctx.restore();
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [config, isMobile, updateState, collectEnergy, incrementLevel, drawStar, drawShip, drawGravityField, drawEnergyBall, drawAsteroid, drawTrap, drawRepulsionWave, drawPortal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      useGameStore.getState().setConfig({ width: w, height: h });

      const mobile = window.innerWidth <= 768 || 'ontouchstart' in window;
      useGameStore.getState().setMobile(mobile);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isMouseDownRef.current = true;
      mouseDownTimeRef.current = Date.now();

      longPressTimerRef.current = setTimeout(() => {
        if (isMouseDownRef.current) {
          activateGravity();
          useGameStore.getState().updateState({ gravityHoldTime: 1 });
        }
      }, 1000);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button !== 0) return;

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      const state = useGameStore.getState();
      if (state.isGravityActive) {
        fireRepulsionWave();
      }

      deactivateGravity();
      isMouseDownRef.current = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
      isMouseDownRef.current = true;
      mouseDownTimeRef.current = Date.now();

      longPressTimerRef.current = setTimeout(() => {
        if (isMouseDownRef.current) {
          activateGravity();
          useGameStore.getState().updateState({ gravityHoldTime: 1 });
        }
      }, 1000);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      const state = useGameStore.getState();
      if (state.isGravityActive) {
        fireRepulsionWave();
      }

      deactivateGravity();
      isMouseDownRef.current = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activateGravity, deactivateGravity, fireRepulsionWave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const state = useGameStore.getState();
        setPaused(!state.isPaused);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setPaused]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      if (portalTimerRef.current) {
        clearTimeout(portalTimerRef.current);
      }
    };
  }, [gameLoop]);

  const { isPaused } = useGameStore();

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: 'crosshair',
        }}
      />
      {isPaused && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(11, 0, 26, 0.85)',
            color: 'white',
            fontSize: isMobile ? '24px' : '48px',
            fontWeight: 'bold',
            textShadow: '0 0 20px #6A5ACD',
          }}
        >
          游戏暂停
          <div
            style={{
              position: 'absolute',
              bottom: isMobile ? '80px' : '100px',
              fontSize: isMobile ? '14px' : '20px',
              fontWeight: 'normal',
              color: '#A0A0A0',
            }}
          >
            按 ESC 继续
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
