import { useEffect, useRef } from 'react';
import {
  useGameStore,
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  TRANSITION_DURATION,
  GEAR_WARNING_DURATION,
} from '../store/gameStore';
import { LevelEngine } from '../level/LevelEngine';
import { PlayerController } from '../level/PlayerController';

const VIRTUAL_WIDTH = MAP_WIDTH * TILE_SIZE;
const VIRTUAL_HEIGHT = MAP_HEIGHT * TILE_SIZE;

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levelEngineRef = useRef<LevelEngine | null>(null);
  const playerControllerRef = useRef<PlayerController | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastLevelRef = useRef<number>(0);
  const lastGameStateRef = useRef<string>('menu');
  const transitionStartTimeRef = useRef<number>(0);

  const state = useGameStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    levelEngineRef.current = new LevelEngine();
    playerControllerRef.current = new PlayerController(levelEngineRef.current);

    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const loop = (time: number) => {
      if (!canvas || !ctx) return;
      const dt = Math.min(50, time - lastTimeRef.current || 16.67);
      lastTimeRef.current = time;

      const store = useGameStore.getState();
      const { gameState, currentLevel, transitionProgress } = store;

      if (
        gameState !== lastGameStateRef.current ||
        (gameState === 'playing' && currentLevel !== lastLevelRef.current)
      ) {
        if (
          (gameState === 'playing' && lastGameStateRef.current !== 'playing') ||
          (gameState === 'playing' && currentLevel !== lastLevelRef.current)
        ) {
          if (levelEngineRef.current) {
            levelEngineRef.current.generateLevel(currentLevel);
          }
          lastLevelRef.current = currentLevel;
        }
        if (gameState === 'levelTransition' && lastGameStateRef.current !== 'levelTransition') {
          transitionStartTimeRef.current = time;
        }
        lastGameStateRef.current = gameState;
      }

      if (gameState === 'levelTransition') {
        const elapsed = time - transitionStartTimeRef.current;
        const progress = Math.min(1, elapsed / TRANSITION_DURATION);
        store.setTransitionProgress(progress);
        if (progress >= 1) {
          const nextLevel = currentLevel + 1;
          store.setCurrentLevel(nextLevel);
          if (levelEngineRef.current) {
            levelEngineRef.current.generateLevel(nextLevel);
          }
          lastLevelRef.current = nextLevel;
          store.setTransitionProgress(0);
          (store as any).setState({ gameState: 'playing' });
        }
      }

      if (gameState === 'playing') {
        if (levelEngineRef.current) {
          levelEngineRef.current.update(dt);
        }
        if (playerControllerRef.current) {
          playerControllerRef.current.update(dt);
        }
      }

      render(ctx, canvas);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      if (playerControllerRef.current) {
        playerControllerRef.current.destroy();
      }
      levelEngineRef.current = null;
      playerControllerRef.current = null;
    };
  }, []);

  const render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const store = useGameStore.getState();
    const { gameState, transitionProgress } = store;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scale = Math.min(canvas.width / VIRTUAL_WIDTH, canvas.height / VIRTUAL_HEIGHT);
    const offsetX = (canvas.width - VIRTUAL_WIDTH * scale) / 2;
    const offsetY = (canvas.height - VIRTUAL_HEIGHT * scale) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    drawBackground(ctx);
    drawBorders(ctx);
    drawMap(ctx, store);
    drawElevator(ctx, store);
    drawPlatforms(ctx, store);
    drawTraps(ctx, store);
    drawBatteries(ctx, store);
    drawPlayer(ctx, store);
    drawParticles(ctx, store);
    drawScreenFlash(ctx, store);

    if (gameState === 'levelTransition') {
      drawLevelTransition(ctx, transitionProgress);
    }

    ctx.restore();
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    const grad = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
    grad.addColorStop(0, '#3E2723');
    grad.addColorStop(1, '#1a0f0a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    ctx.strokeStyle = 'rgba(62, 39, 35, 0.3)';
    ctx.lineWidth = 1;
    const brickW = 40;
    const brickH = 20;
    for (let y = 0; y < VIRTUAL_HEIGHT; y += brickH) {
      const offset = (y / brickH) % 2 === 0 ? 0 : brickW / 2;
      for (let x = -brickW; x < VIRTUAL_WIDTH + brickW; x += brickW) {
        ctx.strokeRect(x + offset, y, brickW, brickH);
      }
    }
  };

  const drawBorders = (ctx: CanvasRenderingContext2D) => {
    const drawBrickRow = (y: number) => {
      const brickW = TILE_SIZE;
      const brickH = TILE_SIZE / 2;
      for (let x = 0; x < VIRTUAL_WIDTH; x += brickW) {
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x, y, brickW - 2, brickH - 2);
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(x, y, brickW - 2, 3);
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, brickW - 2, brickH - 2);
      }
    };
    drawBrickRow(0);
    drawBrickRow(VIRTUAL_HEIGHT - TILE_SIZE / 2);
  };

  const drawMap = (ctx: CanvasRenderingContext2D, store: any) => {
    const { map } = store;
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (tile === 1) {
          ctx.fillStyle = '#6D4C41';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          ctx.fillStyle = '#8D6E63';
          ctx.fillRect(px, py, TILE_SIZE, 3);

          ctx.strokeStyle = '#4E342E';
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.beginPath();
          ctx.moveTo(px, py + TILE_SIZE / 2);
          ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE / 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(px + TILE_SIZE / 2, py);
          ctx.lineTo(px + TILE_SIZE / 2, py + TILE_SIZE / 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(px + TILE_SIZE / 4, py + TILE_SIZE / 2);
          ctx.lineTo(px + TILE_SIZE / 4, py + TILE_SIZE);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(px + (TILE_SIZE * 3) / 4, py + TILE_SIZE / 2);
          ctx.lineTo(px + (TILE_SIZE * 3) / 4, py + TILE_SIZE);
          ctx.stroke();
        } else if (tile === 2) {
          ctx.fillStyle = '#5D4037';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          ctx.strokeStyle = '#8D6E63';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          ctx.beginPath();
          ctx.moveTo(px + TILE_SIZE / 2, py + 2);
          ctx.lineTo(px + TILE_SIZE / 2, py + TILE_SIZE - 2);
          ctx.stroke();

          ctx.fillStyle = '#8D6E63';
          ctx.beginPath();
          ctx.arc(px + 6, py + 6, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE - 6, py + 6, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(px + 6, py + TILE_SIZE - 6, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE - 6, py + TILE_SIZE - 6, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  };

  const drawElevator = (ctx: CanvasRenderingContext2D, store: any) => {
    const { elevatorOpen } = store;
    const ex = 1 * TILE_SIZE;
    const ey = 13 * TILE_SIZE;
    const ew = TILE_SIZE;
    const eh = TILE_SIZE * 2;

    ctx.fillStyle = '#222';
    ctx.fillRect(ex - 4, ey - 4, ew + 8, eh + 8);

    if (elevatorOpen) {
      const glowGrad = ctx.createRadialGradient(
        ex + ew / 2,
        ey + eh / 2,
        0,
        ex + ew / 2,
        ey + eh / 2,
        ew
      );
      glowGrad.addColorStop(0, 'rgba(100, 255, 100, 0.6)');
      glowGrad.addColorStop(1, 'rgba(34, 139, 34, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(ex - 10, ey - 10, ew + 20, eh + 20);

      ctx.fillStyle = '#228B22';
      ctx.fillRect(ex, ey, ew, eh);
      ctx.fillStyle = '#90EE90';
      ctx.fillRect(ex + 4, ey + 4, ew - 8, eh - 8);
    } else {
      ctx.fillStyle = '#555';
      ctx.fillRect(ex, ey, ew, eh);
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 3;
      ctx.strokeRect(ex, ey, ew, eh);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ex + ew / 2, ey);
      ctx.lineTo(ex + ew / 2, ey + eh);
      ctx.stroke();
    }
  };

  const drawPlatforms = (ctx: CanvasRenderingContext2D, store: any) => {
    const { platforms } = store;
    platforms.forEach((p: any) => {
      ctx.fillStyle = '#8B6914';
      ctx.fillRect(p.x, p.y, TILE_SIZE, TILE_SIZE / 2);

      ctx.fillStyle = '#B8860B';
      ctx.fillRect(p.x, p.y, TILE_SIZE, 3);

      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x, p.y, TILE_SIZE, TILE_SIZE / 2);

      ctx.fillStyle = '#5D4037';
      ctx.fillRect(p.x + 4, p.y + TILE_SIZE / 2 - 4, 4, 4);
      ctx.fillRect(p.x + TILE_SIZE - 8, p.y + TILE_SIZE / 2 - 4, 4, 4);
      ctx.fillRect(p.x + TILE_SIZE / 2 - 2, p.y + TILE_SIZE / 4, 4, 4);
    });
  };

  const drawTraps = (ctx: CanvasRenderingContext2D, store: any) => {
    const { traps, gearWarningPulse } = store;

    traps.forEach((trap: any) => {
      if (trap.type === 'gear') {
        drawGear(ctx, trap, gearWarningPulse);
      } else if (trap.type === 'lever') {
        drawLever(ctx, trap, store);
      } else if (trap.type === 'arm') {
        drawArm(ctx, trap);
      }
    });
  };

  const drawGear = (ctx: CanvasRenderingContext2D, trap: any, gearWarningPulse: number) => {
    const cx = trap.x;
    const cy = trap.y;
    const outerR = TILE_SIZE / 2 - 4;

    if (gearWarningPulse > 0) {
      const pulse = 1 + 0.3 * Math.sin((1 - gearWarningPulse / GEAR_WARNING_DURATION) * Math.PI * 6);
      const alpha = 0.4 * (gearWarningPulse / GEAR_WARNING_DURATION);
      ctx.fillStyle = `rgba(255, 165, 0, ${alpha})`;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR * 2 * pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(trap.rotation);

    ctx.fillStyle = '#B8860B';
    ctx.beginPath();
    const teeth = 8;
    for (let i = 0; i < teeth; i++) {
      const angle = (i / teeth) * Math.PI * 2;
      const nextAngle = ((i + 0.5) / teeth) * Math.PI * 2;
      const midAngle = ((i + 0.25) / teeth) * Math.PI * 2;
      const endAngle = ((i + 0.5) / teeth) * Math.PI * 2;

      ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
      ctx.lineTo(Math.cos(midAngle) * (outerR + 8), Math.sin(midAngle) * (outerR + 8));
      ctx.lineTo(Math.cos(endAngle) * outerR, Math.sin(endAngle) * outerR);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#8B6914';
    ctx.beginPath();
    ctx.arc(0, 0, outerR - 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.arc(0, 0, outerR - 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * (outerR - 18), Math.sin(angle) * (outerR - 18));
      ctx.lineTo(Math.cos(angle) * (outerR - 10), Math.sin(angle) * (outerR - 10));
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawLever = (ctx: CanvasRenderingContext2D, trap: any, store: any) => {
    const baseX = trap.x - 8;
    const baseY = trap.y + 8;

    ctx.fillStyle = '#8B6914';
    ctx.fillRect(baseX, baseY, 16, 10);
    ctx.fillStyle = '#B8860B';
    ctx.fillRect(baseX, baseY, 16, 2);
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 1;
    ctx.strokeRect(baseX, baseY, 16, 10);

    ctx.save();
    ctx.translate(trap.x, trap.y + 10);
    if (trap.active) {
      ctx.rotate(-Math.PI / 4);
    }
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(-2, -20, 4, 20);
    ctx.fillStyle = '#DAA520';
    ctx.beginPath();
    ctx.arc(0, -22, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (trap.active && Math.random() > 0.7) {
      store.addParticle({
        x: trap.x + (Math.random() - 0.5) * 10,
        y: trap.y - 5,
        vx: (Math.random() - 0.5) * 1,
        vy: -1 - Math.random() * 1.5,
        life: 800,
        maxLife: 800,
        type: 'steam',
        size: 4 + Math.random() * 4,
        color: 'rgba(255,255,255,',
      });
    }
  };

  const drawArm = (ctx: CanvasRenderingContext2D, trap: any) => {
    if (trap.path && trap.path.length > 1) {
      ctx.strokeStyle = 'rgba(139, 0, 0, 0.15)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(trap.path[0].x, trap.path[0].y);
      for (let i = 1; i < trap.path.length; i++) {
        ctx.lineTo(trap.path[i].x, trap.path[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.save();
    ctx.translate(trap.x, trap.y);
    ctx.rotate(trap.rotation * 0.3);

    ctx.fillStyle = '#8B0000';
    ctx.fillRect(-20, -4, 36, 8);
    ctx.fillStyle = '#5a1a1a';
    ctx.fillRect(-20, -4, 36, 2);

    ctx.fillStyle = '#A52A2A';
    ctx.beginPath();
    ctx.arc(18, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#5a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, -6);
    ctx.lineTo(28, -10);
    ctx.moveTo(20, 6);
    ctx.lineTo(28, 10);
    ctx.moveTo(24, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();

    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.arc(-18, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawBatteries = (ctx: CanvasRenderingContext2D, store: any) => {
    const { batteries } = store;
    batteries.forEach((b: any) => {
      if (b.collected) return;

      const bx = b.x - 6;
      const by = b.y - 9;

      const glowGrad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 20);
      glowGrad.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
      glowGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(bx - 10, by - 10, 32, 38);

      ctx.fillStyle = '#B8860B';
      ctx.fillRect(bx, by, 12, 18);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(bx + 1, by + 1, 10, 16);
      ctx.fillStyle = '#B8860B';
      ctx.fillRect(bx + 4, by - 3, 4, 3);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(bx + 2, by + 2, 3, 5);
    });
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, store: any) => {
    const {
      playerX,
      playerY,
      playerVX,
      facing,
      isJumping,
      invincible,
    } = store;

    ctx.save();

    if (invincible > 0 && Math.floor(invincible / 80) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    const cx = playerX + 15;
    const cy = playerY + 20;

    if (facing === 'left') {
      ctx.translate(cx, cy);
      ctx.scale(-1, 1);
      ctx.translate(-cx, -cy);
    }

    const walkFrame = playerVX !== 0 ? Math.floor(Date.now() / 150) % 2 : 0;

    const legOffset = walkFrame === 0 ? 0 : 3;
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(playerX + 5, playerY + 30, 7, 10 - legOffset);
    ctx.fillRect(playerX + 18, playerY + 30, 7, 10 + legOffset - 3);

    ctx.fillStyle = '#8B4513';
    ctx.fillRect(playerX + 3, playerY + 14, 24, 18);
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(playerX + 3, playerY + 14, 24, 3);

    ctx.fillStyle = '#DEB887';
    ctx.beginPath();
    ctx.arc(playerX + 15, playerY + 10, 9, 0, Math.PI * 2);
    ctx.fill();

    const hatOffset = isJumping ? -3 : 0;
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.ellipse(playerX + 15, playerY + 4 + hatOffset, 9, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(playerX + 8, playerY + 2 + hatOffset, 14, 3);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(playerX + 8, playerY + 2 + hatOffset, 14, 1);

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(playerX + 12, playerY + 10, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(playerX + 18, playerY + 10, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#5D4037';
    ctx.fillRect(playerX - 2, playerY + 16, 5, 12);
    ctx.fillRect(playerX + 27, playerY + 16, 5, 12);

    ctx.restore();
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, store: any) => {
    const { particles } = store;
    particles.forEach((p: any) => {
      const lifeRatio = p.life / p.maxLife;
      const size = (p.size || 4) * lifeRatio;
      const alpha = lifeRatio;

      if (p.type === 'steam') {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'spark') {
        ctx.fillStyle = p.color || '#FFD700';
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });
  };

  const drawScreenFlash = (ctx: CanvasRenderingContext2D, store: any) => {
    const { screenFlash } = store;
    if (screenFlash <= 0) return;

    const borderWidth = 40;
    const grad = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
    grad.addColorStop(0, `rgba(255, 0, 0, ${screenFlash * 0.6})`);
    grad.addColorStop(0.1, `rgba(255, 0, 0, ${screenFlash * 0.1})`);
    grad.addColorStop(0.9, `rgba(255, 0, 0, ${screenFlash * 0.1})`);
    grad.addColorStop(1, `rgba(255, 0, 0, ${screenFlash * 0.6})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    const hGrad = ctx.createLinearGradient(0, 0, VIRTUAL_WIDTH, 0);
    hGrad.addColorStop(0, `rgba(255, 0, 0, ${screenFlash * 0.6})`);
    hGrad.addColorStop(0.1, `rgba(255, 0, 0, 0)`);
    hGrad.addColorStop(0.9, `rgba(255, 0, 0, 0)`);
    hGrad.addColorStop(1, `rgba(255, 0, 0, ${screenFlash * 0.6})`);

    ctx.fillStyle = hGrad;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  };

  const drawLevelTransition = (ctx: CanvasRenderingContext2D, progress: number) => {
    const shutterHeight = VIRTUAL_HEIGHT * progress;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, shutterHeight);

    ctx.fillStyle = '#B8860B';
    const stripeCount = 5;
    const stripeHeight = shutterHeight / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      const y = i * stripeHeight;
      if (y + stripeHeight * 0.3 < shutterHeight) {
        ctx.fillRect(0, y, VIRTUAL_WIDTH, Math.min(stripeHeight * 0.3, shutterHeight - y));
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'block',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1,
      }}
    />
  );
}
