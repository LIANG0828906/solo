import {
  GameState,
  TerrainType,
  Position,
  GRID_WIDTH,
  GRID_HEIGHT,
  getMovableCells,
  posEq,
} from '../game/GameEngine';

const TERRAIN_COLORS: Record<TerrainType, string> = {
  [TerrainType.GRASS]: '#7ec850',
  [TerrainType.BUSH]: '#3a7d2c',
  [TerrainType.MUD]: '#8b5a2b',
  [TerrainType.RIVER]: '#3b82f6',
};

const CELL_BORDER = 'rgba(255,255,255,0.35)';

export interface RendererConfig {
  cellSize: number;
  offsetX: number;
  offsetY: number;
}

export function computeConfig(canvasWidth: number, canvasHeight: number): RendererConfig {
  const maxCellW = (canvasWidth - 40) / GRID_WIDTH;
  const maxCellH = (canvasHeight - 40) / GRID_HEIGHT;
  const cellSize = Math.floor(Math.min(maxCellW, maxCellH));
  const totalW = cellSize * GRID_WIDTH;
  const totalH = cellSize * GRID_HEIGHT;
  return {
    cellSize,
    offsetX: Math.floor((canvasWidth - totalW) / 2),
    offsetY: Math.floor((canvasHeight - totalH) / 2),
  };
}

export function cellFromPixel(
  px: number,
  py: number,
  cfg: RendererConfig
): Position | null {
  const relX = px - cfg.offsetX;
  const relY = py - cfg.offsetY;
  if (relX < 0 || relY < 0) return null;
  const x = Math.floor(relX / cfg.cellSize);
  const y = Math.floor(relY / cfg.cellSize);
  if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return null;
  return { x, y };
}

export function cellCenter(p: Position, cfg: RendererConfig): { cx: number; cy: number } {
  return {
    cx: cfg.offsetX + (p.x + 0.5) * cfg.cellSize,
    cy: cfg.offsetY + (p.y + 0.5) * cfg.cellSize,
  };
}

function drawTerrain(ctx: CanvasRenderingContext2D, state: GameState, cfg: RendererConfig) {
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const terrain = state.grid[y][x];
      const px = cfg.offsetX + x * cfg.cellSize;
      const py = cfg.offsetY + y * cfg.cellSize;
      ctx.fillStyle = TERRAIN_COLORS[terrain];
      ctx.fillRect(px, py, cfg.cellSize, cfg.cellSize);

      if (terrain === TerrainType.BUSH) {
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        const r = cfg.cellSize * 0.15;
        for (let i = 0; i < 3; i++) {
          const bx = px + cfg.cellSize * (0.2 + 0.3 * i);
          const by = py + cfg.cellSize * (0.3 + (i % 2) * 0.3);
          ctx.beginPath();
          ctx.arc(bx, by, r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (terrain === TerrainType.MUD) {
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        for (let i = 0; i < 4; i++) {
          const bx = px + cfg.cellSize * (0.2 + (i % 2) * 0.45);
          const by = py + cfg.cellSize * (0.25 + Math.floor(i / 2) * 0.4);
          ctx.beginPath();
          ctx.ellipse(bx, by, cfg.cellSize * 0.12, cfg.cellSize * 0.07, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (terrain === TerrainType.RIVER) {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          const wy = py + cfg.cellSize * (0.25 + i * 0.25);
          ctx.moveTo(px + cfg.cellSize * 0.1, wy);
          ctx.bezierCurveTo(
            px + cfg.cellSize * 0.3,
            wy - cfg.cellSize * 0.05,
            px + cfg.cellSize * 0.5,
            wy + cfg.cellSize * 0.05,
            px + cfg.cellSize * 0.9,
            wy
          );
          ctx.stroke();
        }
      } else if (terrain === TerrainType.GRASS) {
        ctx.strokeStyle = 'rgba(0,60,0,0.15)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
          const gx = px + cfg.cellSize * (0.15 + i * 0.15);
          const gy = py + cfg.cellSize * 0.75;
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(gx - cfg.cellSize * 0.03, gy - cfg.cellSize * 0.15);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(gx + cfg.cellSize * 0.03, gy - cfg.cellSize * 0.12);
          ctx.stroke();
        }
      }

      ctx.strokeStyle = CELL_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, cfg.cellSize - 1, cfg.cellSize - 1);
    }
  }
}

function drawSelectedCell(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cfg: RendererConfig,
  time: number
) {
  if (!state.selectedCell) return;
  const pulse = 0.5 + 0.5 * Math.sin(time / 300);
  const p = state.selectedCell;
  const px = cfg.offsetX + p.x * cfg.cellSize;
  const py = cfg.offsetY + p.y * cfg.cellSize;
  ctx.save();
  ctx.strokeStyle = `rgba(251, 191, 36, ${0.7 + 0.3 * pulse})`;
  ctx.lineWidth = 3 + pulse * 2;
  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = 10 + pulse * 10;
  const pad = 4;
  const radius = 8;
  const w = cfg.cellSize - pad * 2;
  const h = cfg.cellSize - pad * 2;
  ctx.beginPath();
  ctx.moveTo(px + pad + radius, py + pad);
  ctx.lineTo(px + pad + w - radius, py + pad);
  ctx.quadraticCurveTo(px + pad + w, py + pad, px + pad + w, py + pad + radius);
  ctx.lineTo(px + pad + w, py + pad + h - radius);
  ctx.quadraticCurveTo(px + pad + w, py + pad + h, px + pad + w - radius, py + pad + h);
  ctx.lineTo(px + pad + radius, py + pad + h);
  ctx.quadraticCurveTo(px + pad, py + pad + h, px + pad, py + pad + h - radius);
  ctx.lineTo(px + pad, py + pad + radius);
  ctx.quadraticCurveTo(px + pad, py + pad, px + pad + radius, py + pad);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawMovableHint(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cfg: RendererConfig,
  time: number
) {
  if (state.isGameOver || state.animatingCharacter) return;
  const movable = getMovableCells(state, state.currentTurn);
  const pulse = 0.4 + 0.3 * Math.sin(time / 500);
  ctx.save();
  for (const p of movable) {
    if (state.selectedCell && posEq(state.selectedCell, p)) continue;
    const { cx, cy } = cellCenter(p, cfg);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + pulse * 0.15})`;
    ctx.beginPath();
    ctx.arc(cx, cy, cfg.cellSize * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + pulse * 0.3})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, cfg.cellSize * 0.15 + pulse * 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCheetah(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, alpha = 1) {
  const r = size * 0.35;
  ctx.save();
  ctx.globalAlpha = alpha;
  const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  grad.addColorStop(0, '#ffb347');
  grad.addColorStop(1, '#e67e22');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(120, 60, 0, 0.8)';
  const spots = [
    { dx: -0.4, dy: -0.3, s: 0.12 },
    { dx: 0.3, dy: -0.4, s: 0.1 },
    { dx: 0.1, dy: 0.2, s: 0.14 },
    { dx: -0.2, dy: 0.4, s: 0.11 },
    { dx: 0.45, dy: 0.1, s: 0.1 },
    { dx: -0.5, dy: 0.1, s: 0.09 },
    { dx: 0.0, dy: -0.55, s: 0.08 },
  ];
  for (const sp of spots) {
    ctx.beginPath();
    ctx.arc(cx + sp.dx * r, cy + sp.dy * r, r * sp.s, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx - r * 0.28, cy - r * 0.15, r * 0.14, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.28, cy - r * 0.15, r * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx - r * 0.25, cy - r * 0.12, r * 0.07, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.31, cy - r * 0.12, r * 0.07, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2d1810';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.1, cy + r * 0.15);
  ctx.lineTo(cx + r * 0.1, cy + r * 0.15);
  ctx.lineTo(cx, cy + r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawAntelope(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, alpha = 1) {
  const r = size * 0.4;
  ctx.save();
  ctx.globalAlpha = alpha;
  const topY = cy - r;
  const blX = cx - r * 0.9;
  const blY = cy + r * 0.75;
  const brX = cx + r * 0.9;
  const brY = cy + r * 0.75;

  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(blX, blY);
  ctx.lineTo(brX, brY);
  ctx.closePath();
  const grad = ctx.createLinearGradient(cx, topY, cx, blY);
  grad.addColorStop(0, '#a0724a');
  grad.addColorStop(1, '#6b4423');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const whites = [
    { dx: -0.15, dy: 0.1, s: 0.12 },
    { dx: 0.25, dy: 0.25, s: 0.1 },
    { dx: -0.3, dy: 0.4, s: 0.09 },
    { dx: 0.05, dy: 0.5, s: 0.08 },
  ];
  for (const w of whites) {
    ctx.beginPath();
    ctx.arc(cx + w.dx * r, cy + w.dy * r, r * w.s, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#1a0a00';
  ctx.beginPath();
  ctx.arc(cx - r * 0.18, cy - r * 0.1, r * 0.08, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.18, cy - r * 0.1, r * 0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#3d2210';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.2, topY + r * 0.05);
  ctx.lineTo(cx - r * 0.35, topY - r * 0.25);
  ctx.moveTo(cx + r * 0.2, topY + r * 0.05);
  ctx.lineTo(cx + r * 0.35, topY - r * 0.25);
  ctx.stroke();
  ctx.restore();
}

function drawFruit(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, time: number) {
  const r = size * 0.13;
  const pulse = 1 + 0.1 * Math.sin(time / 250);
  ctx.save();
  ctx.shadowColor = '#ff4444';
  ctx.shadowBlur = 8 + pulse * 4;
  const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r * pulse);
  grad.addColorStop(0, '#ff7777');
  grad.addColorStop(0.6, '#ff2222');
  grad.addColorStop(1, '#cc0000');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2d5a1d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * pulse);
  ctx.quadraticCurveTo(cx + r * 0.2, cy - r * pulse - r * 0.3, cx + r * 0.3, cy - r * pulse - r * 0.2);
  ctx.stroke();
  ctx.restore();
}

function drawCharacters(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cfg: RendererConfig,
  time: number
) {
  const movable = getMovableCells(state, state.currentTurn);

  let cheetahRenderPos = state.cheetahPos;
  let antelopeRenderPos = state.antelopePos;

  if (state.animatingCharacter && state.fromPosition && state.toPosition) {
    const t = easeInOutCubic(state.animationProgress);
    const lerpX = state.fromPosition.x + (state.toPosition.x - state.fromPosition.x) * t;
    const lerpY = state.fromPosition.y + (state.toPosition.y - state.fromPosition.y) * t;
    const lerpPos = { x: lerpX, y: lerpY };
    if (state.animatingCharacter === 'cheetah') {
      cheetahRenderPos = lerpPos;
    } else {
      antelopeRenderPos = lerpPos;
    }
  }

  ctx.save();
  for (const a of state.afterimages) {
    const { cx, cy } = cellCenter(a.pos, cfg);
    if (a.type === 'cheetah') {
      drawCheetah(ctx, cx, cy, cfg.cellSize, a.opacity * 0.5);
    } else {
      drawAntelope(ctx, cx, cy, cfg.cellSize, a.opacity * 0.5);
    }
  }
  ctx.restore();

  const turnHighlight = state.isGameOver ? null : state.currentTurn;

  const { cx: acx, cy: acy } = cellCenterFloat(antelopeRenderPos, cfg);
  if (turnHighlight === 'antelope') {
    drawTurnGlow(ctx, acx, acy, cfg.cellSize, time, '#10b981');
  }
  drawAntelope(ctx, acx, acy, cfg.cellSize);

  const { cx: ccx, cy: ccy } = cellCenterFloat(cheetahRenderPos, cfg);
  if (turnHighlight === 'cheetah') {
    drawTurnGlow(ctx, ccx, ccy, cfg.cellSize, time, '#f97316');
  }
  drawCheetah(ctx, ccx, ccy, cfg.cellSize);

  if (!state.isGameOver && !state.animatingCharacter) {
    const curPos = state.currentTurn === 'cheetah' ? state.cheetahPos : state.antelopePos;
    for (const m of movable) {
      if (posEq(m, curPos)) continue;
      const { cx, cy } = cellCenter(m, cfg);
      drawArrowHint(ctx, curPos, m, cfg, time);
    }
  }
}

function drawTurnGlow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  time: number,
  color: string
) {
  const pulse = 0.5 + 0.5 * Math.sin(time / 400);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.3 + pulse * 0.4;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.48 + pulse * 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawArrowHint(
  ctx: CanvasRenderingContext2D,
  from: Position,
  to: Position,
  cfg: RendererConfig,
  time: number
) {
  const { cx: fx, cy: fy } = cellCenter(from, cfg);
  const { cx: tx, cy: ty } = cellCenter(to, cfg);
  const t = 0.5 + 0.5 * Math.sin(time / 400);
  const dx = tx - fx;
  const dy = ty - fy;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.1) return;
  const ux = dx / len;
  const uy = dy / len;
  const startT = 0.3;
  const endT = 0.7;
  const sx = fx + dx * startT + ux * t * 4;
  const sy = fy + dy * startT + uy * t * 4;
  const ex = fx + dx * endT + ux * t * 4;
  const ey = fy + dy * endT + uy * t * 4;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  const ah = cfg.cellSize * 0.08;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - ux * ah - uy * ah * 0.7, ey - uy * ah + ux * ah * 0.7);
  ctx.lineTo(ex - ux * ah + uy * ah * 0.7, ey - uy * ah - ux * ah * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function cellCenterFloat(p: { x: number; y: number }, cfg: RendererConfig) {
  return {
    cx: cfg.offsetX + (p.x + 0.5) * cfg.cellSize,
    cy: cfg.offsetY + (p.y + 0.5) * cfg.cellSize,
  };
}

function drawFruits(ctx: CanvasRenderingContext2D, state: GameState, cfg: RendererConfig, time: number) {
  for (const f of state.fruits) {
    const { cx, cy } = cellCenter(f, cfg);
    drawFruit(ctx, cx, cy, cfg.cellSize, time);
  }
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cfg: RendererConfig,
  time: number
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  drawTerrain(ctx, state, cfg);
  drawSelectedCell(ctx, state, cfg, time);
  drawMovableHint(ctx, state, cfg, time);
  drawFruits(ctx, state, cfg, time);
  drawCharacters(ctx, state, cfg, time);
}
