import type { GameState } from './engine';

const GRADIENT_COLORS = ['#0f0c29', '#302b63', '#24243e'];
const PLATFORM_COLOR = '#ffd700';
const SPIKE_COLOR = '#ff0044';
const PLAYER_DEFAULT_COLOR = '#ffffff';
const PLAYER_FLIP_COLOR = '#00ffff';
const SCORE_COLOR = '#ffffff';
const HIGH_SCORE_COLOR = '#ffd700';

function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, GRADIENT_COLORS[0]);
  gradient.addColorStop(0.5, GRADIENT_COLORS[1]);
  gradient.addColorStop(1, GRADIENT_COLORS[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  for (let i = 0; i < 50; i++) {
    const x = (i * 137 + width * 0.1) % width;
    const y = (i * 97) % (height * 0.7);
    const r = (i % 3) * 0.5 + 0.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlatform(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
  ctx.fillStyle = PLATFORM_COLOR;
  ctx.shadowColor = PLATFORM_COLOR;
  ctx.shadowBlur = 15;
  roundRect(ctx, x, y, width, height, 8);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawSpike(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, direction: 'up' | 'down'): void {
  ctx.fillStyle = SPIKE_COLOR;
  ctx.shadowColor = SPIKE_COLOR;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  if (direction === 'up') {
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width / 2, y);
    ctx.lineTo(x + width, y + height);
  } else {
    ctx.moveTo(x, y);
    ctx.lineTo(x + width / 2, y + height);
    ctx.lineTo(x + width, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawEnergyCore(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);

  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 16);
  gradient.addColorStop(0, '#00ff88');
  gradient.addColorStop(1, '#8800ff');
  ctx.fillStyle = gradient;
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 20;

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 * Math.PI) / 180;
    const px = Math.cos(angle) * 12;
    const py = Math.sin(angle) * 12;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotation: number,
  isFlipping: boolean,
  colorFlashTime: number,
  currentTime: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);

  const isFlashing = currentTime < colorFlashTime;
  const color = isFlipping || isFlashing ? PLAYER_FLIP_COLOR : PLAYER_DEFAULT_COLOR;

  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.fillStyle = color;
  ctx.fillRect(-4, -4, 8, 8);

  ctx.shadowBlur = 30;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(-6, -6, 12, 12);

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawUI(
  ctx: CanvasRenderingContext2D,
  score: number,
  highScore: number,
  width: number
): void {
  ctx.font = 'bold 24px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.strokeText(`分数: ${score}`, 20, 40);
  ctx.fillStyle = SCORE_COLOR;
  ctx.fillText(`分数: ${score}`, 20, 40);

  ctx.font = 'bold 20px "Segoe UI", sans-serif';
  ctx.textAlign = 'right';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.strokeText(`最高分: ${highScore}`, width - 20, 35);
  ctx.fillStyle = HIGH_SCORE_COLOR;
  ctx.fillText(`最高分: ${highScore}`, width - 20, 35);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function render(
  ctx: CanvasRenderingContext2D,
  gameState: GameState,
  width: number,
  height: number,
  currentTime: number
): void {
  ctx.save();

  if (gameState.screenShake.active) {
    const shakeOffset = 4;
    const dx = (Math.random() - 0.5) * shakeOffset * 2;
    const dy = (Math.random() - 0.5) * shakeOffset * 2;
    ctx.translate(dx, dy);
  }

  drawBackground(ctx, width, height);

  ctx.save();
  ctx.translate(-gameState.cameraX, 0);

  for (const platform of gameState.platforms) {
    if (platform.x + platform.width > gameState.cameraX - 100 && platform.x < gameState.cameraX + width + 100) {
      drawPlatform(ctx, platform.x, platform.y, platform.width, platform.height);
    }
  }

  for (const spike of gameState.spikes) {
    if (spike.x + spike.width > gameState.cameraX - 100 && spike.x < gameState.cameraX + width + 100) {
      const direction = spike.y < 200 ? 'down' : 'up';
      drawSpike(ctx, spike.x, spike.y, spike.width, spike.height, direction);
    }
  }

  for (const core of gameState.energyCores) {
    if (!core.collected && core.x > gameState.cameraX - 100 && core.x < gameState.cameraX + width + 100) {
      drawEnergyCore(ctx, core.x, core.y, core.rotation);
    }
  }

  drawPlayer(
    ctx,
    gameState.player.x,
    gameState.player.y,
    gameState.player.rotation,
    gameState.player.isFlipping,
    gameState.player.colorFlashTime,
    currentTime
  );

  ctx.restore();

  drawUI(ctx, gameState.score, gameState.highScore, width);

  ctx.restore();
}
