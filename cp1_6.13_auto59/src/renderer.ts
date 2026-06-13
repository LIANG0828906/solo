import {
  GameState,
  CoreColor,
  Core,
  Shockwave,
  Ripple,
  ExplosionFragment,
  Particle,
  getCoreColors,
  getCoreHex,
} from './game';

const GRID_SIZE = 6;

interface RenderContext {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  cellSize: number;
  boardX: number;
  boardY: number;
  boardWidth: number;
  boardHeight: number;
  time: number;
}

const COLORS = getCoreColors();
const HEX = getCoreHex();

export function render(state: GameState, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) {
  const rc = buildRenderContext(state, ctx, canvas, time);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  if (state.screenShake.duration > 0) {
    const progress = state.screenShake.elapsed / state.screenShake.duration;
    const magnitude = 1 - progress;
    ctx.translate(
      state.screenShake.x * magnitude,
      state.screenShake.y * magnitude
    );
  }

  drawBoard(rc, state);
  drawRipples(rc, state);
  drawCores(rc, state);
  drawShockwaves(rc, state);
  drawFragments(rc, state);
  drawParticles(rc, state);
  drawHoverPreview(rc, state);

  ctx.restore();
}

function buildRenderContext(state: GameState, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number): RenderContext {
  const minDim = Math.min(canvas.width, canvas.height * 0.7);
  const cellSize = minDim / (GRID_SIZE + 1);
  const boardWidth = cellSize * GRID_SIZE;
  const boardHeight = cellSize * GRID_SIZE;
  const boardX = (canvas.width - boardWidth) / 2;
  const boardY = canvas.height * 0.15;

  return { ctx, canvas, cellSize, boardX, boardY, boardWidth, boardHeight, time };
}

function drawBoard(rc: RenderContext, state: GameState) {
  const { ctx, cellSize, boardX, boardY } = rc;

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const x = boardX + c * cellSize;
      const y = boardY + r * cellSize;

      ctx.save();

      const grad = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
      grad.addColorStop(0, 'rgba(255,255,255,0.06)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.02)');
      grad.addColorStop(1, 'rgba(255,255,255,0.06)');
      ctx.fillStyle = grad;
      roundRect(ctx, x + 2, y + 2, cellSize - 4, cellSize - 4, 6);
      ctx.fill();

      const highlight = ctx.createLinearGradient(x, y, x, y + cellSize * 0.4);
      highlight.addColorStop(0, 'rgba(255,255,255,0.08)');
      highlight.addColorStop(1, 'rgba(255,255,255,0.0)');
      ctx.fillStyle = highlight;
      roundRect(ctx, x + 3, y + 3, cellSize - 6, cellSize * 0.35, 4);
      ctx.fill();

      const hue = ((r + c) / (GRID_SIZE * 2)) * 60 + 200;
      ctx.strokeStyle = `hsla(${hue}, 60%, 50%, 0.25)`;
      ctx.lineWidth = 1;
      roundRect(ctx, x + 2, y + 2, cellSize - 4, cellSize - 4, 6);
      ctx.stroke();

      ctx.restore();
    }
  }
}

function drawCores(rc: RenderContext, state: GameState) {
  const { ctx, cellSize, boardX, boardY } = rc;

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const core = state.grid[r][c];
      if (!core) continue;

      const cx = boardX + c * cellSize + cellSize / 2;
      const cy = boardY + r * cellSize + cellSize / 2;
      const baseRadius = cellSize * 0.3;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(core.scale, core.scale);

      const glowPulse = 0.5 + 0.5 * Math.sin(core.glowPhase);
      const colors = COLORS[core.color];

      const glowGrad = ctx.createRadialGradient(0, 0, baseRadius * 0.5, 0, 0, baseRadius * 2);
      glowGrad.addColorStop(0, colors.glow);
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glowGrad;
      ctx.globalAlpha = 0.4 + glowPulse * 0.3;
      ctx.beginPath();
      ctx.arc(0, baseRadius * 0.3, baseRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      const coreGrad = ctx.createRadialGradient(-baseRadius * 0.2, -baseRadius * 0.2, 0, 0, 0, baseRadius);
      coreGrad.addColorStop(0, colors.light);
      coreGrad.addColorStop(0.6, colors.main);
      coreGrad.addColorStop(1, colors.dark);
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
      ctx.fill();

      const shineGrad = ctx.createRadialGradient(-baseRadius * 0.25, -baseRadius * 0.25, 0, -baseRadius * 0.1, -baseRadius * 0.1, baseRadius * 0.5);
      shineGrad.addColorStop(0, 'rgba(255,255,255,0.7)');
      shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shineGrad;
      ctx.beginPath();
      ctx.arc(-baseRadius * 0.15, -baseRadius * 0.15, baseRadius * 0.45, 0, Math.PI * 2);
      ctx.fill();

      if (!core.exploding) {
        const pulseRadius = baseRadius + 2 + Math.sin(core.glowPhase) * 2;
        ctx.strokeStyle = colors.main;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.3 + glowPulse * 0.2;
        ctx.beginPath();
        ctx.ellipse(0, baseRadius * 0.5, pulseRadius * 1.2, pulseRadius * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      ctx.restore();
    }
  }
}

function drawShockwaves(rc: RenderContext, state: GameState) {
  const { ctx, cellSize, boardX, boardY } = rc;

  for (const sw of state.shockwaves) {
    if (!sw.active) continue;

    const fromX = boardX + sw.sourceCol * cellSize;
    const fromY = boardY + sw.sourceRow * cellSize;
    const toX = boardX + sw.col * cellSize;
    const toY = boardY + sw.row * cellSize;

    let startX: number, startY: number, endX: number, endY: number;
    const halfW = cellSize * 0.25;

    switch (sw.direction) {
      case 'up':
        startX = fromX + cellSize / 2;
        startY = fromY;
        endX = toX + cellSize / 2;
        endY = toY + cellSize;
        break;
      case 'down':
        startX = fromX + cellSize / 2;
        startY = fromY + cellSize;
        endX = toX + cellSize / 2;
        endY = toY;
        break;
      case 'left':
        startX = fromX;
        startY = fromY + cellSize / 2;
        endX = toX + cellSize;
        endY = toY + cellSize / 2;
        break;
      case 'right':
        startX = fromX + cellSize;
        startY = fromY + cellSize / 2;
        endX = toX;
        endY = toY + cellSize / 2;
        break;
    }

    const currentX = startX + (endX - startX) * sw.progress;
    const currentY = startY + (endY - startY) * sw.progress;

    const colors = COLORS[sw.color];
    const grad = ctx.createLinearGradient(startX, startY, endX, endY);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(Math.max(0, sw.progress - 0.3), 'rgba(0,0,0,0)');
    grad.addColorStop(Math.min(1, sw.progress), colors.main);
    grad.addColorStop(1, colors.light);

    ctx.save();
    ctx.strokeStyle = grad;
    ctx.lineWidth = cellSize * 0.5;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.8;

    ctx.beginPath();
    if (sw.direction === 'up' || sw.direction === 'down') {
      ctx.moveTo(startX, startY);
      ctx.lineTo(currentX, currentY);
    } else {
      ctx.moveTo(startX, startY);
      ctx.lineTo(currentX, currentY);
    }
    ctx.stroke();

    ctx.globalAlpha = 0.3;
    ctx.fillStyle = colors.glow;
    ctx.beginPath();
    ctx.arc(currentX, currentY, cellSize * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function drawRipples(rc: RenderContext, state: GameState) {
  const { ctx, cellSize, boardX, boardY } = rc;

  for (const ripple of state.ripples) {
    const cx = boardX + ripple.col * cellSize + cellSize / 2;
    const cy = boardY + ripple.row * cellSize + cellSize / 2;
    const radius = cellSize * 0.15 + cellSize * 0.25 * ripple.progress;
    const alpha = 1 - ripple.progress;

    ctx.save();
    ctx.strokeStyle = ripple.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = alpha * 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawFragments(rc: RenderContext, state: GameState) {
  const { ctx, cellSize, boardX, boardY } = rc;

  for (const f of state.fragments) {
    const x = boardX + f.x * cellSize;
    const y = boardY + f.y * cellSize;
    const size = f.size * cellSize;

    ctx.save();
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.fillStyle = f.color;
    ctx.translate(x, y);
    ctx.rotate(f.vx * 2);
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.restore();
  }
}

function drawParticles(rc: RenderContext, state: GameState) {
  const { ctx, cellSize, boardX, boardY } = rc;

  for (const p of state.particles) {
    const x = boardX + p.x * cellSize;
    const y = boardY + p.y * cellSize;
    const size = p.size * cellSize;

    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawHoverPreview(rc: RenderContext, state: GameState) {
  if (!state.hoverCell || state.gameOver || state.isChainActive) return;
  if (state.coresRemaining[state.selectedColor] <= 0) return;
  if (state.remainingSteps <= 0) return;

  const { ctx, cellSize, boardX, boardY } = rc;
  const { row, col } = state.hoverCell;

  if (state.grid[row][col] !== null) return;

  const cx = boardX + col * cellSize + cellSize / 2;
  const cy = boardY + row * cellSize + cellSize / 2;
  const radius = cellSize * 0.3;
  const colors = COLORS[state.selectedColor];

  ctx.save();
  ctx.globalAlpha = 0.4;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, colors.light);
  grad.addColorStop(1, colors.main);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
