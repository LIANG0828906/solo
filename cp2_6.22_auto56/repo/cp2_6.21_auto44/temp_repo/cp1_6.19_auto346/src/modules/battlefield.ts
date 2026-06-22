import {
  useBattlefieldStore,
  BATTLEFIELD_WIDTH,
  BATTLEFIELD_HEIGHT,
  Unit,
} from '../store';

export function drawBattlefield(
  ctx: CanvasRenderingContext2D,
  now: number,
  selectionRect: { x1: number; y1: number; x2: number; y2: number } | null,
  mousePos: { x: number; y: number } | null
) {
  const state = useBattlefieldStore.getState();
  ctx.clearRect(0, 0, BATTLEFIELD_WIDTH, BATTLEFIELD_HEIGHT);

  ctx.fillStyle = '#0b0c10';
  ctx.fillRect(0, 0, BATTLEFIELD_WIDTH, BATTLEFIELD_HEIGHT);

  drawStarfield(ctx, now);
  drawGrid(ctx);
  drawPaths(ctx, state.units);

  state.units.forEach((u) => {
    if (u.state !== 'dead') drawUnit(ctx, u, now, state.selectedUnitIds.includes(u.id));
  });

  drawAttackFlashes(ctx, state.attackFlashes, now);
  drawParticles(ctx, state.particles, now);
  drawFloatingTexts(ctx, state.floatingTexts, now);

  if (selectionRect) drawSelectionRect(ctx, selectionRect);

  if (state.placingTeam && mousePos) {
    drawPlacementPreview(ctx, state.placingTeam, mousePos);
  }

  if (state.pendingTarget && mousePos && state.selectedUnitIds.length > 0) {
    drawTargetPreview(ctx, mousePos, state.commandType, state);
  }
}

function drawStarfield(ctx: CanvasRenderingContext2D, now: number) {
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    const seed = i * 97;
    const x = (seed * 7) % BATTLEFIELD_WIDTH;
    const y = (seed * 13) % BATTLEFIELD_HEIGHT;
    const alpha = 0.3 + 0.4 * Math.sin(now / 1000 + i);
    ctx.fillStyle = `rgba(197, 198, 199, ${alpha})`;
    const size = (i % 3 === 0) ? 1.5 : 1;
    ctx.fillRect(x, y, size, size);
  }
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = 'rgba(69, 162, 158, 0.2)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x <= BATTLEFIELD_WIDTH; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, BATTLEFIELD_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= BATTLEFIELD_HEIGHT; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(BATTLEFIELD_WIDTH, y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(69, 162, 158, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, BATTLEFIELD_WIDTH - 2, BATTLEFIELD_HEIGHT - 2);
}

function drawPaths(ctx: CanvasRenderingContext2D, units: Unit[]) {
  ctx.strokeStyle = 'rgba(197, 198, 199, 0.4)';
  ctx.lineWidth = 1;
  units.forEach((u) => {
    if (u.state === 'dead' || u.path.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(u.x, u.y);
    u.path.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.stroke();
  });
}

function drawUnit(
  ctx: CanvasRenderingContext2D,
  unit: Unit,
  now: number,
  selected: boolean
) {
  const { x, y, team } = unit;
  const color = team === 'red' ? '#ff4444' : '#4488ff';

  if (selected) {
    const pulse = 0.6 + 0.3 * Math.sin((now / 300) * Math.PI * 2);
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fillStyle = color + Math.floor(pulse * 255).toString(16).padStart(2, '0');
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.strokeStyle = color + '88';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.fillStyle = color;
  ctx.strokeStyle = '#ffffff66';
  ctx.lineWidth = 1;

  if (team === 'red') {
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x - 9, y + 7);
    ctx.lineTo(x + 9, y + 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  drawHpBar(ctx, x, y - 16, unit.hp, unit.maxHp);
}

function drawHpBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  hp: number,
  maxHp: number
) {
  const width = 20;
  const height = 3;
  const ratio = Math.max(0, hp / maxHp);
  const color = ratio > 0.75 ? '#4caf50' : ratio > 0.25 ? '#ffeb3b' : '#f44336';
  ctx.fillStyle = '#00000088';
  ctx.fillRect(x - width / 2, y, width, height);
  ctx.fillStyle = color;
  ctx.fillRect(x - width / 2, y, width * ratio, height);
}

function drawAttackFlashes(
  ctx: CanvasRenderingContext2D,
  flashes: { fromX: number; fromY: number; toX: number; toY: number; startTime: number; duration: number }[],
  now: number
) {
  flashes.forEach((f) => {
    const t = now - f.startTime;
    if (t > f.duration) return;
    const alpha = 1 - t / f.duration;
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(f.fromX, f.fromY);
    ctx.lineTo(f.toX, f.toY);
    ctx.stroke();
  });
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: { x: number; y: number; vx: number; vy: number; color: string; startTime: number; duration: number }[],
  now: number
) {
  particles.forEach((p) => {
    const t = now - p.startTime;
    if (t > p.duration) return;
    const progress = t / p.duration;
    const alpha = 1 - progress;
    const px = p.x + p.vx * (t / 1000);
    const py = p.y + p.vy * (t / 1000);
    ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    ctx.fillRect(px - 3, py - 3, 6, 6);
  });
}

function drawFloatingTexts(
  ctx: CanvasRenderingContext2D,
  texts: { x: number; y: number; text: string; color: string; startTime: number; duration: number }[],
  now: number
) {
  ctx.font = '12px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  texts.forEach((t) => {
    const elapsed = now - t.startTime;
    if (elapsed > t.duration) return;
    const progress = elapsed / t.duration;
    const alpha = 1 - progress;
    const ty = t.y - progress * 20;
    ctx.fillStyle = t.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    ctx.fillText(t.text, t.x, ty);
  });
}

function drawSelectionRect(
  ctx: CanvasRenderingContext2D,
  rect: { x1: number; y1: number; x2: number; y2: number }
) {
  const minX = Math.min(rect.x1, rect.x2);
  const maxX = Math.max(rect.x1, rect.x2);
  const minY = Math.min(rect.y1, rect.y2);
  const maxY = Math.max(rect.y1, rect.y2);
  ctx.fillStyle = 'rgba(69, 162, 158, 0.15)';
  ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
  ctx.strokeStyle = 'rgba(69, 162, 158, 0.7)';
  ctx.lineWidth = 1;
  ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
}

function drawPlacementPreview(
  ctx: CanvasRenderingContext2D,
  team: 'red' | 'blue',
  pos: { x: number; y: number }
) {
  const color = team === 'red' ? '#ff4444' : '#4488ff';
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = color;
  if (team === 'red') {
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y - 10);
    ctx.lineTo(pos.x - 9, pos.y + 7);
    ctx.lineTo(pos.x + 9, pos.y + 7);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawTargetPreview(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  commandType: string,
  state: ReturnType<typeof useBattlefieldStore.getState>
) {
  ctx.strokeStyle = 'rgba(69, 162, 158, 0.7)';
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 1;

  if (commandType === 'surround') {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, state.surroundRadius, 0, Math.PI * 2);
    ctx.stroke();
  } else if (commandType === 'disperse') {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, state.disperseRadius, 0, Math.PI * 2);
    ctx.stroke();
  } else if (commandType === 'formation') {
    if (state.formationArc) {
      const radius = Math.max(state.formationWidth, 100);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y + radius, radius, Math.PI * 0.75, Math.PI * 0.25, false);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(pos.x - state.formationWidth / 2, pos.y);
      ctx.lineTo(pos.x + state.formationWidth / 2, pos.y);
      ctx.stroke();
    }
  }

  ctx.fillStyle = '#45a29e';
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.setLineDash([]);
}

export function getUnitAt(x: number, y: number, units: Unit[]): Unit | null {
  for (let i = units.length - 1; i >= 0; i--) {
    const u = units[i];
    if (u.state === 'dead') continue;
    const d = Math.hypot(u.x - x, u.y - y);
    if (d < 14) return u;
  }
  return null;
}
