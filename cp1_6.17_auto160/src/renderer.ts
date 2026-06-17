import { levelData, CELL_SIZE, COLS, ROWS, CANVAS_W, CANVAS_H } from './levelData';
import { getActiveWave, getWaveColor } from './waveSimulator';
import { getEnemies, getEnemyConeData } from './enemyController';

export interface RenderState {
  playerX: number;
  playerY: number;
  breathRadius: number;
  mouseX: number;
  mouseY: number;
  mouseOnEnemy: number | null;
  levelComplete: boolean;
  portalVisible: boolean;
  fireCount: number;
  enemyCount: number;
  frequency: number;
  now: number;
}

let ctx: CanvasRenderingContext2D | null = null;

export function initRenderer(canvas: HTMLCanvasElement): void {
  ctx = canvas.getContext('2d')!;
}

function drawBackground(): void {
  if (!ctx) return;
  ctx.fillStyle = '#1A1A2E';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function drawWalls(): void {
  if (!ctx) return;
  const map = levelData.map;

  for (let gy = 0; gy < ROWS; gy++) {
    for (let gx = 0; gx < COLS; gx++) {
      if (map[gy][gx] === 1) {
        const wx = gx * CELL_SIZE;
        const wy = gy * CELL_SIZE;

        const gradient = ctx.createLinearGradient(wx, wy + CELL_SIZE, wx, wy);
        gradient.addColorStop(0, 'rgba(100, 120, 180, 0.15)');
        gradient.addColorStop(1, 'rgba(100, 120, 180, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(wx, wy, CELL_SIZE, CELL_SIZE);

        ctx.fillStyle = '#2D2D44';
        ctx.fillRect(wx + 1, wy + 1, CELL_SIZE - 2, CELL_SIZE - 2);

        ctx.strokeStyle = '#4A4A6A';
        ctx.lineWidth = 2;
        ctx.strokeRect(wx + 1, wy + 1, CELL_SIZE - 2, CELL_SIZE - 2);
      }
    }
  }
}

function drawPlayer(state: RenderState): void {
  if (!ctx) return;
  ctx.beginPath();
  ctx.arc(state.playerX, state.playerY, state.breathRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(state.playerX, state.playerY, state.breathRadius + 3, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawAimLine(state: RenderState): void {
  if (!ctx) return;
  const dx = state.mouseX - state.playerX;
  const dy = state.mouseY - state.playerY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;
  const ndx = dx / len;
  const ndy = dy / len;

  ctx.beginPath();
  ctx.moveTo(state.playerX + ndx * 10, state.playerY + ndy * 10);
  ctx.lineTo(state.playerX + ndx * 30, state.playerY + ndy * 30);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawWave(state: RenderState): void {
  if (!ctx) return;
  const wave = getActiveWave();
  if (!wave || !wave.alive) return;

  const color = getWaveColor(wave.frequency);

  if (wave.trail.length > 0) {
    for (let i = 0; i < wave.trail.length; i++) {
      const t = wave.trail[i];
      const alpha = ((i + 1) / wave.trail.length) * 0.4;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color.replace('rgb', 'rgba').replace(')', `,${alpha})`);
      ctx.fill();
    }
  }

  if (wave.trail.length > 0) {
    const lastTrail = wave.trail[wave.trail.length - 1];
    const grad = ctx.createLinearGradient(lastTrail.x, lastTrail.y, wave.x, wave.y);
    const baseColor = color.replace('rgb', 'rgba');
    grad.addColorStop(0, baseColor.replace(')', ',0.1)'));
    grad.addColorStop(1, baseColor.replace(')', ',0.6)'));
    ctx.beginPath();
    ctx.moveTo(lastTrail.x, lastTrail.y);
    ctx.lineTo(wave.x, wave.y);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(wave.x, wave.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(wave.x, wave.y, 8, 0, Math.PI * 2);
  ctx.strokeStyle = color.replace('rgb', 'rgba').replace(')', ',0.3)');
  ctx.lineWidth = 1;
  ctx.stroke();

  wave.reflectionAnims.forEach(anim => {
    const elapsed = state.now - anim.startTime;
    const progress = elapsed / 100;
    if (progress >= 1) return;
    const alpha = 1 - progress;
    const radius = 12 * progress;
    ctx.beginPath();
    ctx.arc(anim.x, anim.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = color.replace('rgb', 'rgba').replace(')', `,${alpha * 0.8})`);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

function drawEnemy(enemy: ReturnType<typeof getEnemies>[0], state: RenderState): void {
  if (!ctx) return;
  if (!enemy.alive) return;

  let scale = 1;
  if (enemy.dying) {
    const elapsed = state.now - enemy.dyingStartTime;
    const progress = Math.min(elapsed / 500, 1);
    scale = 1 - progress;
    if (scale <= 0) return;
  }

  const size = 20 * scale;
  const halfSize = size / 2;
  const angle = getEnemyAngle(enemy.facing);

  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.moveTo(halfSize, 0);
  ctx.lineTo(-halfSize, -halfSize * 0.7);
  ctx.lineTo(-halfSize, halfSize * 0.7);
  ctx.closePath();

  if (enemy.dying) {
    ctx.fillStyle = `rgba(255, 80, 80, ${scale})`;
  } else if (enemy.alerted) {
    ctx.fillStyle = '#FF4444';
  } else {
    ctx.fillStyle = '#CC3333';
  }
  ctx.fill();
  ctx.strokeStyle = '#FF6666';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();

  if (state.mouseOnEnemy === enemy.id && !enemy.dying) {
    drawDetectionCone(enemy);
  }
}

function getEnemyAngle(facing: string): number {
  switch (facing) {
    case 'right': return 0;
    case 'down': return Math.PI / 2;
    case 'left': return Math.PI;
    case 'up': return -Math.PI / 2;
    default: return 0;
  }
}

function drawDetectionCone(enemy: ReturnType<typeof getEnemies>[0]): void {
  if (!ctx) return;
  const angle = getEnemyAngle(enemy.facing);
  const coneAngle = Math.PI / 2;
  const radius = 150;

  ctx.beginPath();
  ctx.moveTo(enemy.x, enemy.y);
  ctx.arc(enemy.x, enemy.y, radius, angle - coneAngle / 2, angle + coneAngle / 2);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 107, 107, 0.2)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 107, 107, 0.35)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

function drawPortal(state: RenderState): void {
  if (!ctx || !state.levelComplete) return;

  const cycle = (state.now % 800) / 800;
  const alpha = 0.4 + Math.sin(cycle * Math.PI * 2) * 0.4;
  const radius = 14 + Math.sin(cycle * Math.PI * 2) * 3;

  ctx.beginPath();
  ctx.arc(state.playerX, state.playerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(0, 255, 100, ${alpha * 0.3})`;
  ctx.fill();
  ctx.strokeStyle = `rgba(0, 255, 100, ${alpha})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(state.playerX, state.playerY, radius * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(100, 255, 150, ${alpha * 0.5})`;
  ctx.fill();
}

export function update(state: RenderState): void {
  if (!ctx) return;

  drawBackground();
  drawWalls();
  drawPortal(state);
  drawAimLine(state);

  const enemies = getEnemies();
  enemies.forEach(e => drawEnemy(e, state));

  drawPlayer(state);
  drawWave(state);

  updateSidePanel(state);
}

function updateSidePanel(state: RenderState): void {
  const fireCountEl = document.getElementById('fire-count');
  const enemyCountEl = document.getElementById('enemy-count');
  const freqValueEl = document.getElementById('freq-value');

  if (fireCountEl) fireCountEl.textContent = String(state.fireCount);
  if (enemyCountEl) enemyCountEl.textContent = String(state.enemyCount);
  if (freqValueEl) freqValueEl.textContent = state.frequency.toFixed(1);
}
