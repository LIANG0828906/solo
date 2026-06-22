import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { CellType, Direction, PowerUpEffectType } from '../types';

const WALL_COLOR = '#16213E';
const PATH_COLOR = '#0F3460';
const DOT_COLOR = '#E94560';
const BG_COLOR = '#1A1A2E';
const SCARED_GHOST_COLOR = '#9B59B6';

const EFFECT_COLORS: Record<PowerUpEffectType, { inner: string; outer: string }> = {
  [PowerUpEffectType.SPEED_BOOST]: { inner: 'rgba(0, 150, 255, 0.5)', outer: 'rgba(0, 150, 255, 0)' },
  [PowerUpEffectType.GHOST_FREEZE]: { inner: 'rgba(255, 255, 255, 0.5)', outer: 'rgba(200, 230, 255, 0)' },
  [PowerUpEffectType.SCORE_MULTIPLIER]: { inner: 'rgba(255, 215, 0, 0.5)', outer: 'rgba(255, 215, 0, 0)' },
};

const SHOCKWAVE_COLORS: Record<PowerUpEffectType, { mid: string; outer: string }> = {
  [PowerUpEffectType.SPEED_BOOST]: { mid: 'rgba(0, 150, 255,', outer: 'rgba(0, 100, 200,' },
  [PowerUpEffectType.GHOST_FREEZE]: { mid: 'rgba(200, 230, 255,', outer: 'rgba(150, 200, 255,' },
  [PowerUpEffectType.SCORE_MULTIPLIER]: { mid: 'rgba(255, 215, 0,', outer: 'rgba(255, 180, 0,' },
};

export const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const powerUpBlinkRef = useRef<number>(0);
  const cellSizeRef = useRef<number>(24);

  const mazeSize = useGameStore((state) => state.mazeSize);
  const update = useGameStore((state) => state.update);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const container = canvas.parentElement;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const cellSize = Math.floor(
        Math.min(containerWidth, containerHeight) / mazeSize
      );

      cellSizeRef.current = Math.max(cellSize, 8);

      const cssSize = cellSizeRef.current * mazeSize;

      canvas.width = cssSize * dpr;
      canvas.height = cssSize * dpr;
      canvas.style.width = `${cssSize}px`;
      canvas.style.height = `${cssSize}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = Math.min(timestamp - lastTimeRef.current, 50);
      lastTimeRef.current = timestamp;

      powerUpBlinkRef.current += deltaTime;

      const state = useGameStore.getState();

      if (state.status === 'playing') {
        update(deltaTime);
      }

      render(ctx, useGameStore.getState());

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    const render = (ctx: CanvasRenderingContext2D, state: any) => {
      const { maze, players, ghosts, shockwaves, powerUpEffects } = state;
      const cellSize = cellSizeRef.current;
      const totalSize = cellSize * mazeSize;

      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, totalSize, totalSize);

      for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
          const cell = maze[y][x];
          const px = x * cellSize;
          const py = y * cellSize;

          if (cell === CellType.WALL) {
            ctx.fillStyle = WALL_COLOR;
            ctx.fillRect(px, py, cellSize, cellSize);
          } else {
            ctx.fillStyle = PATH_COLOR;
            ctx.fillRect(px, py, cellSize, cellSize);

            if (cell === CellType.PATH) {
              ctx.fillStyle = DOT_COLOR;
              const dotSize = cellSize * 0.15;
              ctx.beginPath();
              ctx.arc(
                px + cellSize / 2,
                py + cellSize / 2,
                dotSize,
                0,
                Math.PI * 2
              );
              ctx.fill();
            } else if (cell === CellType.POWER_UP) {
              const key = `${x},${y}`;
              const effectType = powerUpEffects[key];
              drawPowerUp(
                ctx,
                px + cellSize / 2,
                py + cellSize / 2,
                cellSize * 0.38,
                effectType,
                powerUpBlinkRef.current
              );
            }
          }
        }
      }

      for (const sw of shockwaves) {
        const sx = sw.x * cellSize + cellSize / 2;
        const sy = sw.y * cellSize + cellSize / 2;
        const radius = sw.radius * (cellSize / 32);

        let colorMid = 'rgba(255, 215, 0,';
        let colorOuter = 'rgba(155, 89, 182,';
        if (sw.effectType && SHOCKWAVE_COLORS[sw.effectType]) {
          colorMid = SHOCKWAVE_COLORS[sw.effectType].mid;
          colorOuter = SHOCKWAVE_COLORS[sw.effectType].outer;
        }

        const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius);
        gradient.addColorStop(0, `${colorMid} 0)`);
        gradient.addColorStop(0.5, `${colorMid} ${sw.alpha * 0.7})`);
        gradient.addColorStop(1, `${colorOuter} 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const player of players) {
        if (player.lives <= 0) continue;

        const px = player.x * cellSize + cellSize / 2;
        const py = player.y * cellSize + cellSize / 2;
        const radius = cellSize * 0.4;

        if (player.activeBuffs && player.activeBuffs.length > 0) {
          for (const buff of player.activeBuffs) {
            const colors = EFFECT_COLORS[buff.type];
            if (colors) {
              const glowSize = radius * 1.6;
              const gradient = ctx.createRadialGradient(px, py, 0, px, py, glowSize);
              gradient.addColorStop(0, colors.inner);
              gradient.addColorStop(1, colors.outer);
              ctx.fillStyle = gradient;
              ctx.beginPath();
              ctx.arc(px, py, glowSize, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        if (player.isPowered) {
          const glowSize = radius * 1.3;
          const gradient = ctx.createRadialGradient(px, py, 0, px, py, glowSize);
          gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
          gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(px, py, glowSize, 0, Math.PI * 2);
          ctx.fill();
        }

        let mouthAngle = 0.2;
        if (player.direction !== Direction.NONE) {
          mouthAngle =
            0.1 + Math.abs(Math.sin(powerUpBlinkRef.current / 100)) * 0.2;
        }

        let startAngle = 0;
        let endAngle = Math.PI * 2;

        switch (player.direction) {
          case Direction.RIGHT:
            startAngle = mouthAngle * Math.PI;
            endAngle = (2 - mouthAngle) * Math.PI;
            break;
          case Direction.LEFT:
            startAngle = (1 + mouthAngle) * Math.PI;
            endAngle = (1 - mouthAngle) * Math.PI;
            break;
          case Direction.UP:
            startAngle = (1.5 + mouthAngle) * Math.PI;
            endAngle = (1.5 - mouthAngle) * Math.PI;
            break;
          case Direction.DOWN:
            startAngle = (0.5 + mouthAngle) * Math.PI;
            endAngle = (0.5 - mouthAngle) * Math.PI;
            break;
        }

        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.arc(px, py, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
      }

      for (const ghost of ghosts) {
        if (ghost.isEaten) continue;

        const gx = ghost.x * cellSize + cellSize / 2;
        const gy = ghost.y * cellSize + cellSize / 2;
        const radius = cellSize * 0.38;

        let color = ghost.color;
        if (ghost.isScared) {
          const blink = Math.sin(powerUpBlinkRef.current / 200) > 0;
          color = blink ? SCARED_GHOST_COLOR : '#6C3483';
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(gx, gy - radius * 0.2, radius, Math.PI, 0, false);
        ctx.lineTo(gx + radius, gy + radius * 0.8);

        const waveCount = 4;
        const waveWidth = (radius * 2) / waveCount;
        for (let i = 0; i < waveCount; i++) {
          const wx = gx + radius - i * waveWidth - waveWidth / 2;
          const wy =
            gy + radius * 0.8 - (i % 2 === 0 ? 0 : radius * 0.2);
          ctx.lineTo(wx, wy);
        }

        ctx.lineTo(gx - radius, gy + radius * 0.8);
        ctx.closePath();
        ctx.fill();

        if (!ghost.isScared) {
          const eyeOffset = radius * 0.3;
          const eyeY = gy - radius * 0.1;

          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(gx - eyeOffset, eyeY, radius * 0.22, 0, Math.PI * 2);
          ctx.arc(gx + eyeOffset, eyeY, radius * 0.22, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#000';
          let pupilOffsetX = 0;
          let pupilOffsetY = 0;

          switch (ghost.direction) {
            case Direction.UP:
              pupilOffsetY = -radius * 0.08;
              break;
            case Direction.DOWN:
              pupilOffsetY = radius * 0.08;
              break;
            case Direction.LEFT:
              pupilOffsetX = -radius * 0.08;
              break;
            case Direction.RIGHT:
              pupilOffsetX = radius * 0.08;
              break;
          }

          ctx.beginPath();
          ctx.arc(
            gx - eyeOffset + pupilOffsetX,
            eyeY + pupilOffsetY,
            radius * 0.1,
            0,
            Math.PI * 2
          );
          ctx.arc(
            gx + eyeOffset + pupilOffsetX,
            eyeY + pupilOffsetY,
            radius * 0.1,
            0,
            Math.PI * 2
          );
          ctx.fill();
        } else {
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(gx - radius * 0.3, gy - radius * 0.1, radius * 0.1, 0, Math.PI * 2);
          ctx.arc(gx + radius * 0.3, gy - radius * 0.1, radius * 0.1, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'white';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(gx - radius * 0.5, gy + radius * 0.3);
          for (let i = 0; i < 5; i++) {
            const wx = gx - radius * 0.5 + (i * radius) / 2.5;
            const wy =
              gy + radius * 0.3 + (i % 2 === 0 ? 0 : -radius * 0.15);
            ctx.lineTo(wx, wy);
          }
          ctx.stroke();
        }
      }
    };

    const drawPowerUp = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      size: number,
      effectType: PowerUpEffectType | undefined,
      time: number
    ) => {
      const blink = Math.sin(time / 150) > 0;
      const scale = 1 + Math.sin(time / 250) * 0.1;
      const s = size * scale;

      switch (effectType) {
        case PowerUpEffectType.SPEED_BOOST:
          drawLightning(ctx, cx, cy, s, blink ? '#0096FF' : '#87CEEB');
          break;
        case PowerUpEffectType.GHOST_FREEZE:
          drawSnowflake(ctx, cx, cy, s, blink ? '#FFFFFF' : '#B0E0E6');
          break;
        case PowerUpEffectType.SCORE_MULTIPLIER:
        default:
          ctx.fillStyle = blink ? '#FFD700' : '#FFFFFF';
          drawStar(ctx, cx, cy, s, 5);
          break;
      }
    };

    const drawLightning = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      size: number,
      color: string
    ) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.2, cy - size * 0.6);
      ctx.lineTo(cx + size * 0.3, cy - size * 0.1);
      ctx.lineTo(cx - size * 0.05, cy - size * 0.1);
      ctx.lineTo(cx + size * 0.2, cy + size * 0.6);
      ctx.lineTo(cx - size * 0.3, cy + size * 0.1);
      ctx.lineTo(cx + size * 0.05, cy + size * 0.1);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(0, 150, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const drawSnowflake = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      size: number,
      color: string
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, size * 0.18);
      ctx.lineCap = 'round';

      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const ex = cx + Math.cos(angle) * size;
        const ey = cy + Math.sin(angle) * size;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        const mx = cx + Math.cos(angle) * size * 0.55;
        const my = cy + Math.sin(angle) * size * 0.55;
        const branchSize = size * 0.3;
        const angle1 = angle + Math.PI / 4;
        const angle2 = angle - Math.PI / 4;

        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + Math.cos(angle1) * branchSize, my + Math.sin(angle1) * branchSize);
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + Math.cos(angle2) * branchSize, my + Math.sin(angle2) * branchSize);
        ctx.stroke();
      }
    };

    const drawStar = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      size: number,
      points: number
    ) => {
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? size : size * 0.45;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
      lastTimeRef.current = 0;
    };
  }, [mazeSize, update]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        imageRendering: 'pixelated',
      }}
    />
  );
};
