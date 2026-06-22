import { useEffect, useRef, useCallback } from 'react';
import {
  GameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BASE_X,
  BASE_Y,
  ORE_COLORS,
  DRONE_RADIUS,
} from './store';

interface AsteroidFieldProps {
  state: GameState;
  onCanvasClick: (x: number, y: number) => void;
}

export default function AsteroidField({ state, onCanvasClick }: AsteroidFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(performance.now());

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const elapsed = (performance.now() - startTimeRef.current) / 1000;

    ctx.fillStyle = '#0B0B1A';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (const star of state.stars) {
      const twinkle = 0.5 + 0.5 * Math.sin((elapsed / star.period) * Math.PI * 2 + star.phase);
      const opacity = star.baseOpacity * (0.6 + 0.4 * twinkle);
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const asteroid of state.asteroids) {
      const { x, y, diameter, oreType, oreReserve, maxReserve, rotationAngle } = asteroid;
      const radius = diameter / 2;
      const color = ORE_COLORS[oreType];
      const reserveRatio = oreReserve / maxReserve;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotationAngle);

      ctx.globalAlpha = 0.9;
      ctx.fillStyle = color;
      ctx.beginPath();
      const sides = 8;
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        const r = radius * (0.85 + 0.15 * Math.sin(i * 3 + asteroid.id.charCodeAt(0)));
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      for (let i = 0; i < 3; i++) {
        const ca = (i / 3) * Math.PI * 2 + rotationAngle * 0.5;
        const cr = radius * 0.25;
        const cx = Math.cos(ca) * radius * 0.4;
        const cy = Math.sin(ca) * radius * 0.4;
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      if (maxReserve > 0) {
        const barWidth = diameter;
        const barHeight = 3;
        const barX = x - barWidth / 2;
        const barY = y + radius + 6;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(barX, barY, barWidth * reserveRatio, barHeight);
        ctx.globalAlpha = 1;
      }
    }

    ctx.save();
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#00FF00';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(BASE_X - 12, BASE_Y);
    ctx.lineTo(BASE_X + 12, BASE_Y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(BASE_X, BASE_Y - 12);
    ctx.lineTo(BASE_X, BASE_Y + 12);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(BASE_X, BASE_Y, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    for (const drone of state.drones) {
      if (drone.status === 'crashed') continue;

      const { x, y } = drone;
      let droneColor = '#9E9E9E';
      if (drone.status === 'idle') droneColor = '#00E5FF';
      else if (drone.status === 'flying') droneColor = '#FFD600';
      else if (drone.status === 'mining') droneColor = '#2979FF';
      else if (drone.status === 'returning') droneColor = '#FF1744';

      ctx.save();
      ctx.translate(x, y);
      let angle = 0;
      if (drone.targetX !== null && drone.targetY !== null && (drone.status === 'flying' || drone.status === 'returning')) {
        angle = Math.atan2(drone.targetY - y, drone.targetX - x);
      }
      ctx.rotate(angle);

      ctx.fillStyle = droneColor;
      ctx.shadowColor = droneColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(DRONE_RADIUS + 2, 0);
      ctx.lineTo(-DRONE_RADIUS, -DRONE_RADIUS * 0.7);
      ctx.lineTo(-DRONE_RADIUS * 0.4, 0);
      ctx.lineTo(-DRONE_RADIUS, DRONE_RADIUS * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.8;
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.rotate(-angle);
      ctx.fillText(String(drone.number), 0, 0);
      ctx.restore();

      if (drone.status === 'mining' && drone.currentAsteroidId) {
        const asteroid = state.asteroids.find((a) => a.id === drone.currentAsteroidId);
        if (asteroid) {
          ctx.save();
          ctx.strokeStyle = ORE_COLORS[asteroid.oreType];
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.6 + 0.4 * Math.sin(elapsed * 8);
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(asteroid.x, asteroid.y);
          ctx.stroke();
          ctx.restore();
        }
      }

      if (drone.cargoAmount > 0 && drone.cargoType) {
        ctx.save();
        ctx.fillStyle = ORE_COLORS[drone.cargoType];
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(x, y - DRONE_RADIUS - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const now = Date.now();
    for (const ft of state.floatingTexts) {
      const age = (now - ft.createdAt) / 1000;
      if (age >= 1) continue;
      const progress = age;
      const opacity = 1 - progress;
      const offsetY = progress * -25;
      const offsetX = Math.sin(progress * Math.PI) * (ft.id.charCodeAt(0) % 2 === 0 ? 8 : -8);
      ctx.save();
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x + offsetX, ft.y + offsetY);
      ctx.restore();
    }

    for (const ce of state.crashEffects) {
      const age = (now - ce.createdAt) / 300;
      if (age >= 1) continue;
      const pulse = 0.5 + 0.5 * Math.sin(age * Math.PI * 6);
      const scale = 1 + age * 0.5;
      const opacity = 1 - age;
      ctx.save();
      ctx.translate(ce.x, ce.y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = opacity * (0.6 + 0.4 * pulse);
      ctx.fillStyle = '#FF1744';
      ctx.shadowColor = '#FF1744';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(3, -3);
      ctx.lineTo(10, -3);
      ctx.lineTo(4, 2);
      ctx.lineTo(6, 10);
      ctx.lineTo(0, 5);
      ctx.lineTo(-6, 10);
      ctx.lineTo(-4, 2);
      ctx.lineTo(-10, -3);
      ctx.lineTo(-3, -3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }, [state]);

  useEffect(() => {
    let running = true;
    const animate = () => {
      if (!running) return;
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      running = false;
      cancelAnimationFrame(animationRef.current);
    };
  }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    onCanvasClick(x, y);
  };

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      onClick={handleClick}
      style={{
        display: 'block',
        borderRadius: '12px',
        boxShadow: '0 0 40px rgba(0, 229, 255, 0.15), 0 8px 32px rgba(0, 0, 0, 0.5)',
        cursor: 'crosshair',
        border: '1px solid rgba(0, 229, 255, 0.3)',
      }}
    />
  );
}
