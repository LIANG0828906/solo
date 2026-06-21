import { useRef, useEffect, useCallback } from 'react';
import { GameLoop, type GameState } from './GameLoop';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  type Obstacle,
  type Coin,
  type Powerup,
  type Particle,
} from './TrackGenerator';

const CAR_WIDTH = 40;
const CAR_HEIGHT = 60;

interface GameCanvasProps {
  onGameOver: (score: number) => void;
}

function drawRoad(ctx: CanvasRenderingContext2D, scrollOffset: number): void {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = '#222233';
  ctx.fillRect(50, 0, CANVAS_WIDTH - 100, CANVAS_HEIGHT);

  ctx.strokeStyle = '#333344';
  ctx.lineWidth = 2;
  ctx.setLineDash([30, 20]);
  ctx.lineDashOffset = -(scrollOffset % 50);
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH / 2, 0);
  ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
  ctx.stroke();

  ctx.setLineDash([30, 20]);
  ctx.lineDashOffset = -(scrollOffset % 50);
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH / 4, 0);
  ctx.lineTo(CANVAS_WIDTH / 4, CANVAS_HEIGHT);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH * 3 / 4, 0);
  ctx.lineTo(CANVAS_WIDTH * 3 / 4, CANVAS_HEIGHT);
  ctx.stroke();

  ctx.setLineDash([]);

  ctx.strokeStyle = '#444466';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(50, 0);
  ctx.lineTo(50, CANVAS_HEIGHT);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH - 50, 0);
  ctx.lineTo(CANVAS_WIDTH - 50, CANVAS_HEIGHT);
  ctx.stroke();
}

function drawObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle): void {
  if (obs.type === 'barrel') {
    ctx.fillStyle = '#cc3333';
    ctx.beginPath();
    ctx.arc(obs.x, obs.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#991111';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#991111';
    ctx.fillRect(obs.x - 8, obs.y - 2, 16, 4);
  } else if (obs.type === 'barrier') {
    ctx.fillStyle = '#ff8844';
    ctx.fillRect(obs.x - 10, obs.y - 15, 20, 30);
    ctx.fillStyle = '#cc6622';
    ctx.fillRect(obs.x - 10, obs.y - 15, 20, 4);
    ctx.fillRect(obs.x - 10, obs.y + 11, 20, 4);
    ctx.fillStyle = '#ffaa66';
    ctx.fillRect(obs.x - 6, obs.y - 5, 12, 10);
  } else {
    ctx.fillStyle = '#666688';
    ctx.beginPath();
    ctx.moveTo(obs.x, obs.y - 10);
    ctx.lineTo(obs.x + 10, obs.y + 10);
    ctx.lineTo(obs.x - 10, obs.y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#555577';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerR: number, innerR: number, points: number): void {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawCoin(ctx: CanvasRenderingContext2D, coin: Coin): void {
  if (coin.collected) return;
  ctx.fillStyle = '#ffcc00';
  drawStar(ctx, coin.x, coin.y, 12, 5, 5);
  ctx.fill();
  ctx.strokeStyle = '#cc9900';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawPowerup(ctx: CanvasRenderingContext2D, pwr: Powerup): void {
  if (pwr.collected) return;
  const x = pwr.x;
  const y = pwr.y;
  ctx.fillStyle = '#44cc44';
  ctx.beginPath();
  ctx.moveTo(x - 2, y - 10);
  ctx.lineTo(x + 6, y - 10);
  ctx.lineTo(x + 1, y - 2);
  ctx.lineTo(x + 7, y - 2);
  ctx.lineTo(x - 3, y + 10);
  ctx.lineTo(x, y + 1);
  ctx.lineTo(x - 6, y + 1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#228822';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawCar(ctx: CanvasRenderingContext2D, carX: number, carY: number): void {
  ctx.fillStyle = '#4488ff';
  ctx.fillRect(carX + 4, carY, CAR_WIDTH - 8, CAR_HEIGHT - 10);

  ctx.fillStyle = '#3366cc';
  ctx.fillRect(carX, carY + 10, 8, 20);
  ctx.fillRect(carX + CAR_WIDTH - 8, carY + 10, 8, 20);

  ctx.fillStyle = '#223355';
  ctx.fillRect(carX - 2, carY + 5, 6, 12);
  ctx.fillRect(carX + CAR_WIDTH - 4, carY + 5, 6, 12);
  ctx.fillRect(carX - 2, carY + 35, 6, 12);
  ctx.fillRect(carX + CAR_WIDTH - 4, carY + 35, 6, 12);

  ctx.fillStyle = '#88bbff';
  ctx.fillRect(carX + 8, carY + 5, CAR_WIDTH - 16, 14);

  ctx.fillStyle = '#6699dd';
  ctx.fillRect(carX + 8, carY + 5, CAR_WIDTH - 16, 3);

  ctx.fillStyle = '#ff4444';
  ctx.fillRect(carX + 6, carY + CAR_HEIGHT - 14, 8, 4);
  ctx.fillRect(carX + CAR_WIDTH - 14, carY + CAR_HEIGHT - 14, 8, 4);

  ctx.fillStyle = '#ffff88';
  ctx.fillRect(carX + 6, carY + 2, 6, 3);
  ctx.fillRect(carX + CAR_WIDTH - 12, carY + 2, 6, 3);
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  for (const p of particles) {
    if (p.life <= 0) continue;
    const alpha = Math.max(0, p.life / p.maxLife);
    const size = 6 * alpha;
    if (size < 0.5) continue;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ff8844';
    ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
  }
  ctx.globalAlpha = 1;
}

function drawHUD(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 40);

  ctx.font = '24px "Press Start 2P", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${state.score}`, 20, 22);

  ctx.textAlign = 'center';
  ctx.fillText(`TIME: ${Math.floor(state.timeElapsed)}s`, CANVAS_WIDTH / 2, 22);

  if (state.speedBoostRemaining > 0) {
    ctx.textAlign = 'right';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#44cc44';
    ctx.fillText('BOOST', CANVAS_WIDTH - 130, 16);

    ctx.fillStyle = '#224422';
    ctx.fillRect(CANVAS_WIDTH - 120, 22, 100, 8);
    ctx.fillStyle = '#44cc44';
    const boostWidth = (state.speedBoostRemaining / 3) * 100;
    ctx.fillRect(CANVAS_WIDTH - 120, 22, boostWidth, 8);
  }
}

export default function GameCanvas({ onGameOver }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<GameLoop | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const scrollOffsetRef = useRef<number>(0);
  const gameOverCalledRef = useRef<boolean>(false);

  const gameLoop = useCallback(() => {
    if (!gameLoopRef.current) {
      gameLoopRef.current = new GameLoop();
    }
    return gameLoopRef.current;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gl = gameLoop();
    gameOverCalledRef.current = false;
    lastTimeRef.current = performance.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        gl.handleKeyDown(e.key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gl.handleKeyUp(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const loop = (timestamp: number) => {
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const state = gl.update(dt);

      scrollOffsetRef.current += state.scrollSpeed * dt;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      drawRoad(ctx, scrollOffsetRef.current);

      for (const obs of state.obstacles) {
        drawObstacle(ctx, obs);
      }

      for (const coin of state.coins) {
        drawCoin(ctx, coin);
      }

      for (const pwr of state.powerups) {
        drawPowerup(ctx, pwr);
      }

      if (!state.gameOver) {
        drawCar(ctx, state.carX, state.carY);
      }

      drawParticles(ctx, state.particles);

      drawHUD(ctx, state);

      if (state.gameOver && state.explosionDone && !gameOverCalledRef.current) {
        gameOverCalledRef.current = true;
        onGameOver(gl.getFinalScore());
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameLoop, onGameOver]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        display: 'block',
        border: '2px solid #2a2a4e',
        imageRendering: 'pixelated',
      }}
    />
  );
}
