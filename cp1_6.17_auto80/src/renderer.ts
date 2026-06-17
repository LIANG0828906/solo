import { GameState, Mineral, MineralType, Shockwave, Meteor } from './types';
import { getMineralColor } from './store';
import { RECOVERY_DURATION, WARNING_DURATION } from './gameLogic';

export interface RenderParams {
  ctx: CanvasRenderingContext2D;
  gameState: GameState;
  canvasWidth: number;
  canvasHeight: number;
  currentTime: number;
}

export const render = (params: RenderParams): void => {
  const { ctx, gameState, canvasWidth, canvasHeight, currentTime } = params;

  let shakeX = 0;
  let shakeY = 0;
  if (gameState.meteorEvent.shakeFrames > 0) {
    shakeX = (Math.random() - 0.5) * 6;
    shakeY = (Math.random() - 0.5) * 6;
  }

  ctx.save();
  ctx.translate(shakeX, shakeY);

  drawBackground(ctx, canvasWidth, canvasHeight);
  drawLayerDividers(ctx, canvasWidth, canvasHeight);

  let brightness = 1;
  if (gameState.recoveryStartTime > 0) {
    const elapsed = currentTime - gameState.recoveryStartTime;
    if (elapsed < RECOVERY_DURATION) {
      brightness = 0.3 + 0.7 * (elapsed / RECOVERY_DURATION);
    }
  } else if (gameState.productionPaused) {
    brightness = 0.3;
  }

  ctx.save();
  ctx.globalAlpha = brightness;

  for (const mineral of gameState.minerals) {
    drawMineralTrail(ctx, mineral);
  }

  for (const mineral of gameState.minerals) {
    drawMineral(ctx, mineral, currentTime);
  }

  for (const sw of gameState.shockwaves) {
    drawShockwave(ctx, sw);
  }

  ctx.restore();

  if (gameState.meteorEvent.active && gameState.meteorEvent.warningPhase) {
    drawWarningBar(ctx, canvasWidth, currentTime - gameState.meteorEvent.warningStartTime);
  }

  for (const meteor of gameState.meteorEvent.meteors) {
    if (meteor.active) {
      drawMeteor(ctx, meteor, currentTime);
    }
  }

  if (gameState.productionPaused) {
    drawPauseOverlay(ctx, canvasWidth, canvasHeight, gameState.productionPausedUntil - currentTime);
  }

  ctx.restore();
};

const drawBackground = (ctx: CanvasRenderingContext2D, w: number, h: number): void => {
  const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 1.2);
  gradient.addColorStop(0, '#1A102A');
  gradient.addColorStop(1, '#0F1B3D');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  for (let i = 0; i < 80; i++) {
    const x = (i * 97.3) % w;
    const y = (i * 53.7) % h;
    const size = ((i * 13) % 3) * 0.5 + 0.5;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
};

const drawLayerDividers = (ctx: CanvasRenderingContext2D, w: number, h: number): void => {
  ctx.strokeStyle = 'rgba(123, 104, 238, 0.15)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 10]);

  ctx.beginPath();
  ctx.moveTo(0, h * 0.65);
  ctx.lineTo(w, h * 0.65);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, h * 0.4);
  ctx.lineTo(w, h * 0.4);
  ctx.stroke();

  ctx.setLineDash([]);

  ctx.font = '10px "Press Start 2P", monospace';
  ctx.fillStyle = 'rgba(123, 104, 238, 0.4)';
  ctx.fillText('表层矿脉', 10, h * 0.65 - 5);
  ctx.fillStyle = 'rgba(0, 206, 209, 0.4)';
  ctx.fillText('中层矿脉', 10, h * 0.4 - 5);
  ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
  ctx.fillText('深层矿脉', 10, h * 0.15 - 5);
};

const drawMineralTrail = (ctx: CanvasRenderingContext2D, mineral: Mineral): void => {
  const color = getMineralColor(mineral.type);
  for (const point of mineral.trail) {
    ctx.globalAlpha = point.alpha * 0.4;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, mineral.size * 0.25 * point.alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

const drawMineral = (
  ctx: CanvasRenderingContext2D,
  mineral: Mineral,
  _currentTime: number
): void => {
  const color = getMineralColor(mineral.type);
  const { x, y, size, rotation } = mineral;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  ctx.shadowColor = color;
  ctx.shadowBlur = 15;

  ctx.fillStyle = color;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;

  switch (mineral.type) {
    case MineralType.Surface:
      drawCube(ctx, size);
      break;
    case MineralType.Mid:
      drawDiamond(ctx, size);
      break;
    case MineralType.Deep:
      drawHexagon(ctx, size);
      break;
  }

  ctx.restore();
};

const drawCube = (ctx: CanvasRenderingContext2D, size: number): void => {
  const s = size * 0.7;
  ctx.beginPath();
  ctx.moveTo(-s / 2, -s / 2);
  ctx.lineTo(s / 2, -s / 2);
  ctx.lineTo(s / 2, s / 2);
  ctx.lineTo(-s / 2, s / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-s / 2, -s / 2);
  ctx.lineTo(-s / 3, -s * 0.7);
  ctx.lineTo(s * 0.7, -s * 0.7);
  ctx.lineTo(s / 2, -s / 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(s / 2, -s / 2);
  ctx.lineTo(s * 0.7, -s * 0.7);
  ctx.lineTo(s * 0.7, s * 0.3);
  ctx.lineTo(s / 2, s / 2);
  ctx.stroke();
};

const drawDiamond = (ctx: CanvasRenderingContext2D, size: number): void => {
  const s = size;
  ctx.beginPath();
  ctx.moveTo(0, -s / 2);
  ctx.lineTo(s / 2, 0);
  ctx.lineTo(0, s / 2);
  ctx.lineTo(-s / 2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -s / 2);
  ctx.lineTo(0, s / 2);
  ctx.moveTo(-s / 2, 0);
  ctx.lineTo(s / 2, 0);
  ctx.stroke();
};

const drawHexagon = (ctx: CanvasRenderingContext2D, size: number): void => {
  const s = size * 0.8;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(angle) * s / 2;
    const py = Math.sin(angle) * s / 2;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * s / 4, Math.sin(angle) * s / 4);
  }
  ctx.stroke();
};

const drawShockwave = (ctx: CanvasRenderingContext2D, sw: Shockwave): void => {
  ctx.save();
  ctx.globalAlpha = sw.alpha;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#00FF7F';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#00FF7F';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(sw.x, sw.y, sw.radius * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

const drawWarningBar = (
  ctx: CanvasRenderingContext2D,
  w: number,
  elapsed: number
): void => {
  const progress = Math.min(1, elapsed / WARNING_DURATION);
  const blink = Math.sin(elapsed / 100) > 0 ? 1 : 0.4;

  ctx.save();
  ctx.globalAlpha = blink;
  const gradient = ctx.createLinearGradient(0, 0, 0, 30);
  gradient.addColorStop(0, '#FF4500');
  gradient.addColorStop(1, '#FF6347');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, 30);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚠ 陨石风暴来袭 ⚠', w / 2, 15);

  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(0, 28, w * (1 - progress), 2);
  ctx.restore();
};

const drawMeteor = (
  ctx: CanvasRenderingContext2D,
  meteor: Meteor,
  currentTime: number
): void => {
  const { x, y, size, rotation } = meteor;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  const triangleCount = 20;
  for (let i = 0; i < triangleCount; i++) {
    const angle = (i / triangleCount) * Math.PI * 2;
    const dist = size * 0.2 + (i % 3) * size * 0.2;
    const triX = Math.cos(angle + currentTime * 0.001) * dist;
    const triY = Math.sin(angle + currentTime * 0.001) * dist;
    const triSize = size * 0.15 + (i % 4) * 3;
    const triRotation = angle + i;

    const colorProgress = i / triangleCount;
    const r = Math.floor(255);
    const g = Math.floor(100 + colorProgress * 155);
    const b = Math.floor(colorProgress * 100);

    ctx.save();
    ctx.translate(triX, triY);
    ctx.rotate(triRotation);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -triSize);
    ctx.lineTo(triSize * 0.866, triSize * 0.5);
    ctx.lineTo(-triSize * 0.866, triSize * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();

  const countdownProgress = meteor.countdown / 3000;
  ctx.save();
  ctx.strokeStyle = '#FF4500';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#FF4500';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(x, y, size + 12, -Math.PI / 2, -Math.PI / 2 + countdownProgress * Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(Math.ceil(meteor.countdown / 1000).toString(), x, y);
  ctx.restore();
};

const drawPauseOverlay = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  remainingMs: number
): void => {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 69, 0, 0.15)';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#FF4500';
  ctx.font = 'bold 16px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#FF4500';
  ctx.shadowBlur = 20;
  ctx.fillText('生产暂停', w / 2, h / 2 - 20);

  ctx.font = 'bold 20px "Press Start 2P", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${Math.ceil(remainingMs / 1000)}s`, w / 2, h / 2 + 15);
  ctx.restore();
};
