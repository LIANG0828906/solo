import type { GameState } from './types';
import { getCurrentLevel } from './levels';

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 700;
const RIPPLE_MAX_RADIUS = 120;

function drawBackground(ctx: CanvasRenderingContext2D): void {
  const gradient = ctx.createRadialGradient(
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    0,
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) * 0.7
  );
  gradient.addColorStop(0, '#1F2833');
  gradient.addColorStop(1, '#0B0C10');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawDebris(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const debris of state.debris) {
    ctx.save();
    ctx.translate(debris.x, debris.y);
    ctx.rotate(debris.rotation);

    ctx.beginPath();
    const sides = 7 + Math.floor((debris.id % 4));
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const r = debris.radius * (0.8 + ((debris.id + i) % 3) * 0.1);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    ctx.fillStyle = debris.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }
}

function drawShip(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { shipX, shipY, hatchRadius } = state;

  ctx.save();
  ctx.translate(shipX, shipY);

  ctx.beginPath();
  ctx.arc(0, 0, hatchRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(102, 252, 241, 0.25)';
  ctx.fill();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = 'rgba(102, 252, 241, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.moveTo(0, -70);
  ctx.lineTo(-40, 20);
  ctx.lineTo(-25, 25);
  ctx.lineTo(-25, 50);
  ctx.lineTo(25, 50);
  ctx.lineTo(25, 25);
  ctx.lineTo(40, 20);
  ctx.closePath();

  const shipGradient = ctx.createLinearGradient(0, -70, 0, 50);
  shipGradient.addColorStop(0, '#45A29E');
  shipGradient.addColorStop(1, '#1F2833');
  ctx.fillStyle = shipGradient;
  ctx.fill();
  ctx.strokeStyle = '#66FCF1';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-30, 50);
  ctx.lineTo(-20, 75);
  ctx.lineTo(-10, 55);
  ctx.closePath();
  ctx.fillStyle = '#FF6B6B';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(30, 50);
  ctx.lineTo(20, 75);
  ctx.lineTo(10, 55);
  ctx.closePath();
  ctx.fillStyle = '#FF6B6B';
  ctx.fill();

  ctx.restore();
}

function drawGravityFields(ctx: CanvasRenderingContext2D, state: GameState, now: number): void {
  for (const field of state.gravityFields) {
    const elapsed = now - field.createdAt;

    if (elapsed < field.rippleDuration) {
      const t = elapsed / field.rippleDuration;
      const alpha = 1 - t;
      ctx.beginPath();
      ctx.arc(field.x, field.y, field.rippleRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(102, 252, 241, ${alpha * 0.8})`;
      ctx.lineWidth = 3;
      ctx.stroke();

      if (t > 0.3) {
        ctx.beginPath();
        ctx.arc(field.x, field.y, field.rippleRadius * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(102, 252, 241, ${alpha * 0.4})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    if (elapsed < field.duration) {
      let alpha = 0.125;
      if (elapsed > field.fadeStart - field.createdAt) {
        const fadeT = (elapsed - (field.fadeStart - field.createdAt)) / 300;
        alpha = 0.125 * (1 - fadeT);
      }
      ctx.beginPath();
      ctx.arc(field.x, field.y, RIPPLE_MAX_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }
  }
}

function drawCollectFlashes(ctx: CanvasRenderingContext2D, state: GameState, now: number): void {
  for (const flash of state.collectFlashes) {
    const elapsed = now - flash.createdAt;
    const t = elapsed / flash.duration;
    const alpha = 1 - t;
    const radius = 10 + t * 40;

    ctx.save();
    ctx.translate(flash.x, flash.y);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      ctx.strokeStyle = `rgba(102, 252, 241, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(102, 252, 241, ${alpha * 0.5})`;
    ctx.fill();
    ctx.restore();
  }
}

function drawScorePanel(ctx: CanvasRenderingContext2D, state: GameState): void {
  const panelX = CANVAS_WIDTH - 140;
  const panelY = 20;
  const panelWidth = 120;
  const panelHeight = 180;

  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 12);
  ctx.fillStyle = 'rgba(31, 40, 51, 0.88)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(102, 252, 241, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = 'rgba(102, 252, 241, 0.8)';
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('关卡', panelX + panelWidth / 2, panelY + 30);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(`${state.currentLevel}`, panelX + panelWidth / 2, panelY + 55);

  ctx.fillStyle = 'rgba(102, 252, 241, 0.8)';
  ctx.font = '14px monospace';
  ctx.fillText('分数', panelX + panelWidth / 2, panelY + 85);

  const level = getCurrentLevel(state.currentLevel);
  const scoreCenterX = panelX + panelWidth / 2;
  const scoreCenterY = panelY + 110;

  ctx.save();
  ctx.translate(scoreCenterX, scoreCenterY);
  ctx.scale(state.scoreAnimation.scale, state.scoreAnimation.scale);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${state.score}`, 0, 0);
  ctx.restore();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`目标 ${level.targetScore}`, panelX + panelWidth / 2, panelY + 135);

  const barWidth = panelWidth - 30;
  const barHeight = 6;
  const barX = panelX + 15;
  const barY = panelY + 150;

  ctx.beginPath();
  ctx.roundRect(barX, barY, barWidth, barHeight, 3);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fill();

  const progress = Math.min(state.score / level.targetScore, 1);
  ctx.beginPath();
  ctx.roundRect(barX, barY, barWidth * progress, barHeight, 3);
  const barGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
  barGradient.addColorStop(0, '#45A29E');
  barGradient.addColorStop(1, '#66FCF1');
  ctx.fillStyle = barGradient;
  ctx.fill();
}

export function drawLevelCompleteOverlay(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number
): { buttonRect: { x: number; y: number; w: number; h: number } } | null {
  if (!state.levelComplete) return null;

  const elapsed = now - state.levelCompleteAt;
  const fadeT = Math.min(elapsed / 1000, 1);

  const overlayGradient = ctx.createRadialGradient(
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    0,
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) * 0.7
  );
  overlayGradient.addColorStop(0, `rgba(102, 252, 241, ${0.25 * fadeT})`);
  overlayGradient.addColorStop(1, `rgba(11, 12, 16, ${0.95 * fadeT})`);
  ctx.fillStyle = overlayGradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  let textYOffset = 40;
  let textAlpha = fadeT;
  if (elapsed < 1300 && elapsed >= 1000) {
    const animT = (elapsed - 1000) / 300;
    textYOffset = 40 * (1 - animT);
    textAlpha = fadeT;
  } else if (elapsed >= 1300) {
    textYOffset = 0;
  } else {
    textAlpha = 0;
  }

  ctx.save();
  ctx.globalAlpha = textAlpha;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('通关！', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60 + textYOffset);
  ctx.restore();

  const btnW = 160;
  const btnH = 50;
  const btnX = CANVAS_WIDTH / 2 - btnW / 2;
  const btnY = CANVAS_HEIGHT / 2 + 20 + textYOffset;

  const btnVisible = elapsed >= 1300 ? 1 : 0;
  if (btnVisible > 0) {
    ctx.save();
    ctx.globalAlpha = btnVisible * fadeT;

    const btnGradient = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH);
    btnGradient.addColorStop(0, '#45A29E');
    btnGradient.addColorStop(1, '#66FCF1');

    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 10);
    ctx.fillStyle = btnGradient;
    ctx.fill();

    ctx.fillStyle = '#0B0C10';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('下一关', btnX + btnW / 2, btnY + btnH / 2);
    ctx.restore();
  }

  return { buttonRect: { x: btnX, y: btnY, w: btnW, h: btnH } };
}

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number
): { buttonRect: { x: number; y: number; w: number; h: number } } | null {
  drawBackground(ctx);
  drawDebris(ctx, state);
  drawShip(ctx, state);
  drawGravityFields(ctx, state, now);
  drawCollectFlashes(ctx, state, now);
  drawScorePanel(ctx, state);
  return drawLevelCompleteOverlay(ctx, state, now);
}
