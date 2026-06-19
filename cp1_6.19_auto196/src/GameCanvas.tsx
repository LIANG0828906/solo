import React, { useRef, useEffect, useCallback } from 'react';
import {
  Debris, Ship, CapturePopup, ORBIT_ZONES, CANVAS_WIDTH, CANVAS_HEIGHT,
  BEAM_LENGTH, BEAM_SPREAD, DEBRIS_COLORS, CAPTURE_SPEED, SCORE_PER_DEBRIS,
} from './types';
import {
  initializeDebris, isPointInBeam, isOutOfBounds, maybeSpawnDebris,
  allTasksCompleted, getNextPopupId,
} from './gameUtils';
import { useGameStore } from './store';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debrisRef = useRef<Debris[]>([]);
  const popupsRef = useRef<CapturePopup[]>([]);
  const shipRef = useRef<Ship>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    angle: -Math.PI / 2,
    beamLength: BEAM_LENGTH,
    beamSpread: BEAM_SPREAD,
  });
  const lastTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const transitionTimerRef = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 - 100 });

  const currentZoneIndex = useGameStore(s => s.currentZoneIndex);
  const isTransitioning = useGameStore(s => s.isTransitioning);
  const isGameOver = useGameStore(s => s.isGameOver);
  const isGameStarted = useGameStore(s => s.isGameStarted);
  const debrisCounts = useGameStore(s => s.debrisCounts);
  const addScore = useGameStore(s => s.addScore);
  const incrementDebrisCount = useGameStore(s => s.incrementDebrisCount);
  const setTransitioning = useGameStore(s => s.setTransitioning);
  const advanceZone = useGameStore(s => s.advanceZone);
  const tickTime = useGameStore(s => s.tickTime);

  const resetDebrisForZone = useCallback((zoneIndex: number) => {
    const zone = ORBIT_ZONES[zoneIndex];
    debrisRef.current = initializeDebris(zone);
    popupsRef.current = [];
  }, []);

  useEffect(() => {
    if (isGameStarted) {
      resetDebrisForZone(currentZoneIndex);
    }
  }, [isGameStarted, currentZoneIndex, resetDebrisForZone]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    };
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    mouseRef.current = {
      x: ((touch.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((touch.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    };
    e.preventDefault();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchstart', handleTouchMove, { passive: false });
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchstart', handleTouchMove);
    };
  }, [handleMouseMove, handleTouchMove]);

  useEffect(() => {
    if (!isGameStarted || isGameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    lastTimeRef.current = performance.now();

    const drawBackground = () => {
      const gradient = ctx.createRadialGradient(
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 50,
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) * 0.7
      );
      gradient.addColorStop(0, '#0B0D17');
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    };

    const drawShip = (ship: Ship) => {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-12, -10);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-12, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#60A5FA';
      ctx.beginPath();
      ctx.arc(4, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawBeam = (ship: Ship) => {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      const grad = ctx.createLinearGradient(0, 0, ship.beamLength, 0);
      grad.addColorStop(0, 'rgba(96, 165, 250, 0.35)');
      grad.addColorStop(1, 'rgba(96, 165, 250, 0.02)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(18, 0);
      const spread = ship.beamSpread / 2;
      ctx.lineTo(ship.beamLength, -Math.sin(spread) * ship.beamLength);
      ctx.lineTo(ship.beamLength, Math.sin(spread) * ship.beamLength);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const drawDebris = (d: Debris) => {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rotation);
      const scale = 1 - d.captureProgress * 0.7;
      ctx.scale(scale, scale);
      ctx.fillStyle = DEBRIS_COLORS[d.type];
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      d.vertices.forEach((v, i) => {
        if (i === 0) ctx.moveTo(v.x, v.y);
        else ctx.lineTo(v.x, v.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    const drawPopups = (dt: number) => {
      const now = performance.now();
      popupsRef.current = popupsRef.current.filter(p => {
        const elapsed = (now - (p as CapturePopup & { _start?: number })._start!) / 1000;
        if (elapsed >= 0.6) return false;
        const progress = elapsed / 0.6;
        const offset = 50 * progress;
        const opacity = 1 - progress;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = '#4ADE80';
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`+${SCORE_PER_DEBRIS}`, p.x, p.y - offset);
        ctx.restore();
        return true;
      });
      void dt;
    };

    const loop = (now: number) => {
      const rawDt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      const dt = Math.min(rawDt, 50);
      const speedFactor = dt / (1000 / 60);

      if (!isTransitioning) {
        tickTime(dt / 1000);
      }

      const ship = shipRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const targetAngle = Math.atan2(my - ship.y, mx - ship.x);
      let da = targetAngle - ship.angle;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      ship.angle += da * 0.12 * speedFactor;

      drawBackground();
      drawBeam(ship);

      const zone = ORBIT_ZONES[currentZoneIndex];
      const debris = debrisRef.current;

      for (let i = debris.length - 1; i >= 0; i--) {
        const d = debris[i];

        if (d.isBeingCaptured) {
          d.captureProgress += 0.035 * speedFactor;
          const dirX = ship.x - d.x;
          const dirY = ship.y - d.y;
          const dist = Math.sqrt(dirX * dirX + dirY * dirY);
          if (dist > 0) {
            d.x += (dirX / dist) * CAPTURE_SPEED * speedFactor;
            d.y += (dirY / dist) * CAPTURE_SPEED * speedFactor;
          }
          d.rotation += d.rotationSpeed * speedFactor;
          if (d.captureProgress >= 1 || dist < 10) {
            addScore(SCORE_PER_DEBRIS);
            incrementDebrisCount(d.type);
            const popup: CapturePopup & { _start?: number } = {
              id: getNextPopupId(),
              x: d.x,
              y: d.y,
              offsetY: 0,
              opacity: 1,
              _start: performance.now(),
            };
            popupsRef.current.push(popup);
            debris.splice(i, 1);
            continue;
          }
        } else {
          d.x += d.vx * speedFactor;
          d.y += d.vy * speedFactor;
          d.rotation += d.rotationSpeed * speedFactor;

          if (!isTransitioning && isPointInBeam(d.x, d.y, ship)) {
            d.isBeingCaptured = true;
          }

          if (isOutOfBounds(d)) {
            debris.splice(i, 1);
            continue;
          }
        }

        drawDebris(d);
      }

      const newDebris = maybeSpawnDebris(debris.length, zone);
      if (newDebris) debris.push(newDebris);

      drawShip(ship);
      drawPopups(dt);

      if (!isTransitioning && !isGameOver && allTasksCompleted(zone, debrisCounts)) {
        setTransitioning(true);
        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = window.setTimeout(() => {
          advanceZone();
        }, 1500);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    };
  }, [isGameStarted, isGameOver, currentZoneIndex, isTransitioning, debrisCounts,
      addScore, incrementDebrisCount, setTransitioning, advanceZone, tickTime]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={containerStyle}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          borderRadius: 12,
          boxShadow: '0 0 60px rgba(96, 165, 250, 0.15), inset 0 0 40px rgba(0,0,0,0.5)',
          maxWidth: '100%',
          maxHeight: '100%',
          cursor: 'crosshair',
          display: 'block',
        }}
      />
      {isTransitioning && !isGameOver && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '20px 40px',
          borderRadius: 10,
          background: 'linear-gradient(135deg, #1E3A8A 0%, #60A5FA 50%, #E0E7FF 100%)',
          color: '#FFFFFF',
          fontSize: 22,
          fontWeight: 700,
          fontFamily: '"Segoe UI", sans-serif',
          letterSpacing: 1,
          animation: 'pulse 0.5s ease-in-out infinite alternate',
          boxShadow: '0 0 40px rgba(96, 165, 250, 0.6)',
          pointerEvents: 'none',
        }}>
          正在跳跃到下一轨道...
        </div>
      )}
      <style>{`
        @keyframes pulse {
          from { opacity: 0.7; transform: translate(-50%, -50%) scale(0.98); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1.02); }
        }
      `}</style>
    </div>
  );
};
