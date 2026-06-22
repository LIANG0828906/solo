import { useRef, useEffect, useCallback } from 'react';
import { PhysicsEngine, type PlanetData } from './PhysicsEngine';
import {
  ResourceManager,
  RESOURCE_COLORS,
  type Asteroid,
  type ParticleEffect,
} from './ResourceManager';
import { useSimStore } from './store';

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  phase: number;
}

function generateStars(width: number, height: number): Star[] {
  const stars: Star[] = [];
  const count = Math.floor((width * height) / 3000);
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1 + Math.random(),
      brightness: 0.2 + Math.random() * 0.8,
      twinkleSpeed: 0.5 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

export default function StarMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const physicsRef = useRef(new PhysicsEngine());
  const resourceRef = useRef(new ResourceManager());
  const starsRef = useRef<Star[]>([]);
  const trailRef = useRef<{ x: number; y: number; opacity: number }[]>([]);
  const animFrameRef = useRef(0);
  const initializedRef = useRef(false);

  const planets = useSimStore((s) => s.planets);
  const selectedPlanetId = useSimStore((s) => s.selectedPlanetId);
  const shipAngle = useSimStore((s) => s.shipAngle);
  const shipSpeed = useSimStore((s) => s.shipSpeed);
  const isRunning = useSimStore((s) => s.isRunning);
  const showTrajectory = useSimStore((s) => s.showTrajectory);
  const setRunning = useSimStore((s) => s.setRunning);
  const addPlanet = useSimStore((s) => s.addPlanet);
  const selectPlanet = useSimStore((s) => s.selectPlanet);
  const collectResource = useSimStore((s) => s.collectResource);
  const setShipAngle = useSimStore((s) => s.setShipAngle);
  const setShipSpeed = useSimStore((s) => s.setShipSpeed);

  const resourceVersionRef = useRef(0);

  const getShipStartPos = useCallback(
    (width: number, height: number) => ({ x: 80, y: height / 2 }),
    []
  );

  const getShipVelocity = useCallback(() => {
    const angle = shipAngle;
    const speed = shipSpeed;
    return {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };
  }, [shipAngle, shipSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (!initializedRef.current) {
        starsRef.current = generateStars(canvas.width, canvas.height);
        const count = 50 + Math.floor(Math.random() * 31);
        resourceRef.current.generateAsteroids(canvas.width, canvas.height, count);
        const pos = getShipStartPos(canvas.width, canvas.height);
        const vel = getShipVelocity();
        physicsRef.current.setShipInitial(pos, vel);
        initializedRef.current = true;
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [getShipStartPos, getShipVelocity]);

  useEffect(() => {
    if (isRunning) {
      physicsRef.current.setPlanets(planets);
      const pos = getShipStartPos(canvasRef.current!.width, canvasRef.current!.height);
      const vel = getShipVelocity();
      physicsRef.current.setShipInitial(pos, vel);
      trailRef.current = [];
      physicsRef.current.start();
    } else {
      physicsRef.current.stop();
    }
  }, [isRunning, planets, getShipStartPos, getShipVelocity]);

  useEffect(() => {
    if (!isRunning) {
      physicsRef.current.setPlanets(planets);
      const canvas = canvasRef.current;
      if (canvas) {
        const pos = getShipStartPos(canvas.width, canvas.height);
        const vel = getShipVelocity();
        physicsRef.current.setShipInitial(pos, vel);
      }
    }
  }, [planets, shipAngle, shipSpeed, isRunning, getShipStartPos, getShipVelocity]);

  const drawBackground = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#0D0D2B');
      gradient.addColorStop(1, '#1A1A3E');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    },
    []
  );

  const drawStars = useCallback(
    (ctx: CanvasRenderingContext2D, time: number) => {
      for (const star of starsRef.current) {
        const twinkle =
          0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.phase));
        const alpha = star.brightness * twinkle;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    []
  );

  const drawAsteroids = useCallback(
    (ctx: CanvasRenderingContext2D, asteroids: Asteroid[]) => {
      for (const a of asteroids) {
        if (a.collected) continue;
        const color = RESOURCE_COLORS[a.resourceType];
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    []
  );

  const drawPlanets = useCallback(
    (ctx: CanvasRenderingContext2D, planetsList: PlanetData[]) => {
      for (const planet of planetsList) {
        const radius = 15 + planet.mass * 0.8;

        ctx.save();
        ctx.shadowColor = '#9400D3';
        ctx.shadowBlur = 20 + planet.mass * 0.5;

        const gradient = ctx.createRadialGradient(
          planet.x,
          planet.y,
          0,
          planet.x,
          planet.y,
          radius
        );
        gradient.addColorStop(0, '#9400D3');
        gradient.addColorStop(0.6, '#7B00B8');
        gradient.addColorStop(1, '#4B0082');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        if (planet.id === selectedPlanetId) {
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(planet.x, planet.y, radius + 4, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    },
    [selectedPlanetId]
  );

  const drawTrajectory = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const points = physicsRef.current.getTrajectoryPoints();
      if (points.length < 2) return;

      ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    },
    []
  );

  const drawPredictedTrajectory = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const canvas = canvasRef.current;
      if (!canvas || planets.length === 0) return;

      const pos = getShipStartPos(canvas.width, canvas.height);
      const vel = getShipVelocity();
      const predicted = physicsRef.current.predictTrajectory(pos, vel, 300);
      if (predicted.length < 2) return;

      ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(predicted[0].x, predicted[0].y);
      for (let i = 1; i < predicted.length; i++) {
        ctx.lineTo(predicted[i].x, predicted[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    },
    [planets, getShipStartPos, getShipVelocity]
  );

  const drawShip = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      const trail = trailRef.current;
      for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        const progress = i / trail.length;
        const alpha = progress * 0.8;
        const size = 1 + progress * 2;
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    []
  );

  const drawShipStart = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.stroke();

      const angle = shipAngle;
      const arrowLen = 60;
      const endX = x + Math.cos(angle) * arrowLen;
      const endY = y + Math.sin(angle) * arrowLen;

      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      const headLen = 12;
      const headAngle = 0.4;
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLen * Math.cos(angle - headAngle),
        endY - headLen * Math.sin(angle - headAngle)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLen * Math.cos(angle + headAngle),
        endY - headLen * Math.sin(angle + headAngle)
      );
      ctx.stroke();
    },
    [shipAngle]
  );

  const drawCollectionParticles = useCallback(
    (ctx: CanvasRenderingContext2D, particles: ParticleEffect[], now: number) => {
      for (const p of particles) {
        const elapsed = now - p.startTime;
        const progress = elapsed / p.duration;
        const numParticles = 8;
        for (let i = 0; i < numParticles; i++) {
          const angle = (i / numParticles) * Math.PI * 2;
          const distance = progress * 20;
          const px = p.x + Math.cos(angle) * distance;
          const py = p.y + Math.sin(angle) * distance;
          const alpha = 1 - progress;
          const scale = 1 - progress * 0.5;

          ctx.fillStyle =
            p.color.slice(0, 7) +
            Math.floor(alpha * 255)
              .toString(16)
              .padStart(2, '0');
          ctx.beginPath();
          ctx.arc(px, py, 2 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = 0;

    const loop = (timestamp: number) => {
      const dt = timestamp - lastTime;
      lastTime = timestamp;

      if (isRunning && dt > 0) {
        const physics = physicsRef.current;
        const resources = resourceRef.current;

        physics.step();

        const pos = physics.getShipPosition();
        trailRef.current.push({ x: pos.x, y: pos.y, opacity: 1 });
        if (trailRef.current.length > 20) {
          trailRef.current.shift();
        }

        const now = performance.now();
        const result = resources.checkCollection(pos.x, pos.y, now);
        if (result.collected && result.type) {
          collectResource(result.type);
          resourceVersionRef.current++;
        }
        resources.updateParticles(now);

        if (physics.isOutOfBounds(canvas.width, canvas.height)) {
          setRunning(false);
        }
      }

      const now = performance.now();

      drawBackground(ctx, canvas.width, canvas.height);
      drawStars(ctx, now / 1000);

      if (!isRunning && showTrajectory && planets.length > 0) {
        drawPredictedTrajectory(ctx);
      }

      if (showTrajectory) {
        drawTrajectory(ctx);
      }

      drawAsteroids(ctx, resourceRef.current.getAsteroids());
      drawPlanets(ctx, planets);

      if (isRunning) {
        const pos = physicsRef.current.getShipPosition();
        drawShip(ctx, pos.x, pos.y);
      } else {
        const startPos = getShipStartPos(canvas.width, canvas.height);
        drawShipStart(ctx, startPos.x, startPos.y);
      }

      drawCollectionParticles(ctx, resourceRef.current.getActiveParticles(), now);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [
    isRunning,
    planets,
    showTrajectory,
    selectedPlanetId,
    shipAngle,
    drawBackground,
    drawStars,
    drawAsteroids,
    drawPlanets,
    drawTrajectory,
    drawPredictedTrajectory,
    drawShip,
    drawShipStart,
    drawCollectionParticles,
    getShipStartPos,
    collectResource,
    setRunning,
  ]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isRunning) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let clickedPlanet = false;
      for (const planet of planets) {
        const radius = 15 + planet.mass * 0.8;
        const dx = x - planet.x;
        const dy = y - planet.y;
        if (dx * dx + dy * dy < (radius + 5) * (radius + 5)) {
          selectPlanet(planet.id);
          clickedPlanet = true;
          break;
        }
      }

      if (!clickedPlanet) {
        addPlanet(x, y);
      }
    },
    [isRunning, planets, addPlanet, selectPlanet]
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isRunning) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const startPos = getShipStartPos(canvas.width, canvas.height);
      const dx = x - startPos.x;
      const dy = y - startPos.y;
      if (dx * dx + dy * dy < 2500) {
        const onMouseMove = (ev: MouseEvent) => {
          const mx = ev.clientX - rect.left;
          const my = ev.clientY - rect.top;
          const angle = Math.atan2(my - startPos.y, mx - startPos.x);
          setShipAngle(angle);
          const dist = Math.sqrt(
            (mx - startPos.x) ** 2 + (my - startPos.y) ** 2
          );
          const speed = Math.min(Math.max(dist * 2, 20), 400);
          setShipSpeed(speed);
        };
        const onMouseUp = () => {
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      }
    },
    [isRunning, getShipStartPos, setShipAngle, setShipSpeed]
  );

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      onMouseDown={handleCanvasMouseDown}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        cursor: isRunning ? 'default' : 'crosshair',
      }}
    />
  );
}
