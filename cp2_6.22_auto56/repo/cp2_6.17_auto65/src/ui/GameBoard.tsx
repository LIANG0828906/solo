import { useRef, useEffect, useCallback, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { TABLE_CONFIG, POCKETS, BALL_RADIUS, MAX_POWER } from '../game/types';

export function GameBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number | null>(null);
  const lastIntervalTimeRef = useRef<number>(0);
  const runningFlagRef = useRef<boolean>(false);
  const [scale, setScale] = useState(1);

  const initGame = useGameStore((state) => state.initGame);

  useEffect(() => {
    initGame();
    (window as any).gameStore = useGameStore;
  }, [initGame]);

  useEffect(() => {
    function handleResize() {
      const topBarHeight = 60;
      const availableWidth = window.innerWidth - 80;
      const availableHeight = window.innerHeight - topBarHeight - 80;
      const scaleX = availableWidth / TABLE_CONFIG.width;
      const scaleY = availableHeight / TABLE_CONFIG.height;
      setScale(Math.min(scaleX, scaleY, 1));
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    runningFlagRef.current = true;

    function lightenColor(color: string, percent: number): string {
      const num = parseInt(color.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = (num >> 16) + amt;
      const G = ((num >> 8) & 0x00ff) + amt;
      const B = (num & 0x0000ff) + amt;
      return (
        '#' +
        (0x1000000 +
          (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
          (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
          (B < 255 ? (B < 1 ? 0 : B) : 255)
        )
          .toString(16)
          .slice(1)
      );
    }

    function darkenColor(color: string, percent: number): string {
      return lightenColor(color, -percent);
    }

    function drawTable() {
      const { width, height, borderWidth, pocketRadius } = TABLE_CONFIG;

      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(
        borderWidth,
        borderWidth,
        borderWidth,
        height - borderWidth
      );
      gradient.addColorStop(0, '#1a7a1a');
      gradient.addColorStop(0.5, '#228B22');
      gradient.addColorStop(1, '#1a7a1a');

      ctx.fillStyle = gradient;
      ctx.fillRect(borderWidth, borderWidth, width - 2 * borderWidth, height - 2 * borderWidth);

      ctx.fillStyle = '#2C1810';
      for (const pocket of POCKETS) {
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, pocketRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#D4AF37';
      const corners = [
        { x: borderWidth, y: borderWidth },
        { x: width - borderWidth, y: borderWidth },
        { x: borderWidth, y: height - borderWidth },
        { x: width - borderWidth, y: height - borderWidth },
      ];
      for (const corner of corners) {
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawBall(ball: { x: number; y: number; radius: number; color: string; number: number }) {
      const gradient = ctx.createRadialGradient(
        ball.x - ball.radius * 0.3,
        ball.y - ball.radius * 0.3,
        ball.radius * 0.1,
        ball.x,
        ball.y,
        ball.radius
      );

      if (ball.color === '#FFFFFF') {
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.7, '#E8E8E8');
        gradient.addColorStop(1, '#CCCCCC');
      } else if (ball.color === '#000000') {
        gradient.addColorStop(0, '#444444');
        gradient.addColorStop(0.7, '#222222');
        gradient.addColorStop(1, '#000000');
      } else {
        gradient.addColorStop(0, lightenColor(ball.color, 30));
        gradient.addColorStop(0.7, ball.color);
        gradient.addColorStop(1, darkenColor(ball.color, 30));
      }

      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      if (ball.number > 0 && ball.number <= 8) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.font = `bold ${ball.radius * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ball.number.toString(), ball.x, ball.y);
      } else if (ball.number >= 9 && ball.number <= 15) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(
          ball.x - ball.radius * 0.7,
          ball.y - ball.radius * 0.25,
          ball.radius * 1.4,
          ball.radius * 0.5
        );

        ctx.fillStyle = '#000000';
        ctx.font = `bold ${ball.radius * 0.45}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ball.number.toString(), ball.x, ball.y);
      }

      ctx.beginPath();
      ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fill();
    }

    function drawAimLine(cueBall: { x: number; y: number }, angle: number) {
      const lineLength = 200;
      const dashLength = 8;
      const gapLength = 8;

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([dashLength, gapLength]);

      const endX = cueBall.x + Math.cos(angle) * lineLength;
      const endY = cueBall.y + Math.sin(angle) * lineLength;

      ctx.beginPath();
      ctx.moveTo(cueBall.x + Math.cos(angle) * (BALL_RADIUS + 2), cueBall.y + Math.sin(angle) * (BALL_RADIUS + 2));
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.restore();
    }

    function drawCue(cueBall: { x: number; y: number }, angle: number, backOffset: number) {
      const cueLength = 200;
      const tipWidth = 2;
      const buttWidth = 8;

      const cueStartX = cueBall.x - Math.cos(angle) * (BALL_RADIUS + 5 + backOffset);
      const cueStartY = cueBall.y - Math.sin(angle) * (BALL_RADIUS + 5 + backOffset);
      const cueEndX = cueStartX - Math.cos(angle) * cueLength;
      const cueEndY = cueStartY - Math.sin(angle) * cueLength;

      const perpAngle = angle + Math.PI / 2;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(
        cueStartX + Math.cos(perpAngle) * tipWidth,
        cueStartY + Math.sin(perpAngle) * tipWidth
      );
      ctx.lineTo(
        cueEndX + Math.cos(perpAngle) * buttWidth,
        cueEndY + Math.sin(perpAngle) * buttWidth
      );
      ctx.lineTo(
        cueEndX - Math.cos(perpAngle) * buttWidth,
        cueEndY - Math.sin(perpAngle) * buttWidth
      );
      ctx.lineTo(
        cueStartX - Math.cos(perpAngle) * tipWidth,
        cueStartY - Math.sin(perpAngle) * tipWidth
      );
      ctx.closePath();

      const gradient = ctx.createLinearGradient(cueStartX, cueStartY, cueEndX, cueEndY);
      gradient.addColorStop(0, '#F5DEB3');
      gradient.addColorStop(0.3, '#D4A76A');
      gradient.addColorStop(0.7, '#B8860B');
      gradient.addColorStop(1, '#8B6914');

      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();
    }

    function drawPowerBar(cueBall: { x: number; y: number }, power: number) {
      const barWidth = 80;
      const barHeight = 10;
      const barX = cueBall.x - barWidth / 2;
      const barY = cueBall.y - 40;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

      const powerRatio = power / MAX_POWER;
      const gradient = ctx.createLinearGradient(barX, barY + barHeight, barX, barY);
      gradient.addColorStop(0, '#FF0000');
      gradient.addColorStop(1, '#FFFF00');

      ctx.fillStyle = gradient;
      ctx.fillRect(barX, barY + barHeight * (1 - powerRatio), barWidth, barHeight * powerRatio);

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    function drawParticles(particles: { x: number; y: number; size: number; opacity: number; color: string }[]) {
      for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function drawRipples(ripples: { x: number; y: number; radius: number; opacity: number }[]) {
      for (const r of ripples) {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${r.opacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    function drawTrail(trail: { x: number; y: number; opacity: number }[]) {
      for (const t of trail) {
        ctx.save();
        ctx.globalAlpha = t.opacity * 0.5;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(t.x, t.y, BALL_RADIUS * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function drawWoodBackground(width: number, height: number) {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#5D4037');
      gradient.addColorStop(0.5, '#3E2723');
      gradient.addColorStop(1, '#5D4037');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 20; i++) {
        const y = (height / 20) * i + Math.random() * 10;
        ctx.strokeStyle = `rgba(62, 39, 35, ${0.3 + Math.random() * 0.3})`;
        ctx.lineWidth = 2 + Math.random() * 3;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x < width; x += 50) {
          ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 3);
        }
        ctx.stroke();
      }
    }

    function render() {
      const state = useGameStore.getState();
      const { width, height } = TABLE_CONFIG;

      ctx.clearRect(0, 0, width, height);

      drawWoodBackground(width, height);
      drawTable();
      drawRipples(state.ripples);
      drawTrail(state.trail);

      for (const ball of state.balls) {
        if (!ball.pocketed) {
          drawBall(ball);
        }
      }

      drawParticles(state.particles);

      const cueBall = state.balls.find((b) => b.number === 0 && !b.pocketed);
      if (cueBall && state.gamePhase === 'aiming' && state.isAiming) {
        drawAimLine(cueBall, state.aimAngle);
        drawCue(cueBall, state.aimAngle, state.cueBackOffset);
        drawPowerBar(cueBall, state.power);
      } else if (cueBall && state.gamePhase === 'aiming') {
        drawCue(cueBall, state.aimAngle, 0);
      }
    }

    const gameLoop = () => {
      const now = performance.now();
      if (!lastIntervalTimeRef.current) lastIntervalTimeRef.current = now;
      const dt = Math.min((now - lastIntervalTimeRef.current) / 1000, 1 / 30);
      lastIntervalTimeRef.current = now;

      console.log('gameLoop tick, dt=', dt);

      try {
        useGameStore.getState().updateGame(dt);
      } catch (e) {
        console.error('updateGame error:', e);
      }

      try {
        render();
      } catch (e) {
        console.error('render error:', e);
      }
    };

    console.log('Starting gameLoop via setInterval...');
    runningFlagRef.current = true;
    intervalRef.current = window.setInterval(gameLoop, 16);

    return () => {
      console.log('Cleanup called, stopping interval');
      runningFlagRef.current = false;
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const getMousePosition = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const state = useGameStore.getState();
    if (state.gamePhase !== 'aiming') return;

    const pos = getMousePosition(e);
    state.startAiming();

    const cueBall = state.balls.find((b) => b.number === 0 && !b.pocketed);
    if (cueBall) {
      const angle = Math.atan2(pos.y - cueBall.y, pos.x - cueBall.x);
      state.updateAim(angle, 0);
    }
  }, [getMousePosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const state = useGameStore.getState();
    const pos = getMousePosition(e);

    const cueBall = state.balls.find((b) => b.number === 0 && !b.pocketed);
    if (!cueBall) return;

    const angle = Math.atan2(pos.y - cueBall.y, pos.x - cueBall.x);

    if (state.isAiming) {
      const dist = Math.sqrt((pos.x - cueBall.x) ** 2 + (pos.y - cueBall.y) ** 2);
      const power = Math.min(dist * 2, MAX_POWER);
      state.updateAim(angle, power);
    } else if (state.gamePhase === 'aiming') {
      state.updateAim(angle, 0);
    }
  }, [getMousePosition]);

  const handleMouseUp = useCallback(() => {
    const state = useGameStore.getState();
    if (state.isAiming && state.gamePhase === 'aiming') {
      state.shoot();
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    const state = useGameStore.getState();
    if (state.isAiming && state.gamePhase === 'aiming') {
      state.shoot();
    }
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        padding: 20,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.3s ease',
        }}
      >
        <canvas
          ref={canvasRef}
          width={TABLE_CONFIG.width}
          height={TABLE_CONFIG.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{
            cursor: 'crosshair',
            borderRadius: 8,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
            display: 'block',
          }}
        />
      </div>
    </div>
  );
}
