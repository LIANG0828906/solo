import { eventBus, state, resetState, addScore, incrementCombo, resetCombo, reduceBrightness } from './gameState';

const PLAYER_RADIUS = 20;
const GLOW_LENGTH = 50;
const FRAGMENT_SIZE = 12;
const ENEMY_RADIUS_X = 25;
const ENEMY_RADIUS_Y = 18;
const PLAYER_SPEED = 260;
const ENEMY_SPEED = PLAYER_SPEED * 0.6;
const BRIGHTNESS_DECAY = 5;
const FRAGMENT_COUNT = 80;
const ENEMY_COUNT = 8;
const MIN_FRAGMENT_DISTANCE = 30;
const COMBO_TIMEOUT = 2000;
const INVINCIBLE_DURATION = 10000;
const CELL_SIZE = 60;

interface Vector2 {
  x: number;
  y: number;
}

interface Fragment {
  x: number;
  y: number;
  rotation: number;
  collected: boolean;
  collectAnim: number;
  scale: number;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  patrolAngle: number;
  patrolTimer: number;
  chasing: boolean;
  spawnX: number;
  spawnY: number;
}

interface Player {
  x: number;
  y: number;
  brightness: number;
  invincible: boolean;
  invincibleTimer: number;
  comboTimer: number;
}

class SpatialHashGrid {
  private cells: Map<string, (Fragment | Enemy | Player)[]> = new Map();
  private cellSize: number;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }

  clear(): void {
    this.cells.clear();
  }

  private key(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  insert(obj: Fragment | Enemy | Player, x: number, y: number, radius: number): void {
    const minCX = Math.floor((x - radius) / this.cellSize);
    const maxCX = Math.floor((x + radius) / this.cellSize);
    const minCY = Math.floor((y - radius) / this.cellSize);
    const maxCY = Math.floor((y + radius) / this.cellSize);
    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const k = this.key(cx, cy);
        if (!this.cells.has(k)) this.cells.set(k, []);
        this.cells.get(k)!.push(obj);
      }
    }
  }

  query(x: number, y: number, radius: number): Set<Fragment | Enemy | Player> {
    const result = new Set<Fragment | Enemy | Player>();
    const minCX = Math.floor((x - radius) / this.cellSize);
    const maxCX = Math.floor((x + radius) / this.cellSize);
    const minCY = Math.floor((y - radius) / this.cellSize);
    const maxCY = Math.floor((y + radius) / this.cellSize);
    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const k = this.key(cx, cy);
        const cell = this.cells.get(k);
        if (cell) {
          for (const obj of cell) result.add(obj);
        }
      }
    }
    return result;
  }
}

const keys: Set<string> = new Set();
let canvasWidth = 0;
let canvasHeight = 0;

let player: Player;
let fragments: Fragment[] = [];
let enemies: Enemy[] = [];
let grid: SpatialHashGrid;
let lastComboTime = 0;

function initMapEngine(cw: number, ch: number): void {
  canvasWidth = cw;
  canvasHeight = ch;
  player = {
    x: cw / 2,
    y: ch / 2,
    brightness: 100,
    invincible: true,
    invincibleTimer: INVINCIBLE_DURATION,
    comboTimer: 0,
  };
  fragments = [];
  enemies = [];
  lastComboTime = 0;
  grid = new SpatialHashGrid(CELL_SIZE);
  generateFragments();
  generateEnemies();
}

function generateFragments(): void {
  const margin = 40;
  let attempts = 0;
  while (fragments.length < FRAGMENT_COUNT && attempts < 5000) {
    attempts++;
    const x = margin + Math.random() * (canvasWidth - margin * 2);
    const y = margin + Math.random() * (canvasHeight - margin * 2);
    let tooClose = false;
    for (const f of fragments) {
      const dx = f.x - x;
      const dy = f.y - y;
      if (dx * dx + dy * dy < MIN_FRAGMENT_DISTANCE * MIN_FRAGMENT_DISTANCE) {
        tooClose = true;
        break;
      }
    }
    const dx = x - player.x;
    const dy = y - player.y;
    if (dx * dx + dy * dy < 80 * 80) tooClose = true;
    if (!tooClose) {
      fragments.push({
        x,
        y,
        rotation: Math.random() * Math.PI * 2,
        collected: false,
        collectAnim: 0,
        scale: 1,
      });
    }
  }
}

function generateEnemies(): void {
  const margin = 60;
  let attempts = 0;
  while (enemies.length < ENEMY_COUNT && attempts < 5000) {
    attempts++;
    const x = margin + Math.random() * (canvasWidth - margin * 2);
    const y = margin + Math.random() * (canvasHeight - margin * 2);
    const dx = x - player.x;
    const dy = y - player.y;
    if (dx * dx + dy * dy < 200 * 200) continue;
    let overlap = false;
    for (const e of enemies) {
      const edx = e.x - x;
      const edy = e.y - y;
      if (edx * edx + edy * edy < (ENEMY_RADIUS_X * 2 + 10) * (ENEMY_RADIUS_X * 2 + 10)) {
        overlap = true;
        break;
      }
    }
    if (!overlap) {
      const angle = Math.random() * Math.PI * 2;
      enemies.push({
        x,
        y,
        vx: Math.cos(angle) * ENEMY_SPEED,
        vy: Math.sin(angle) * ENEMY_SPEED,
        patrolAngle: angle,
        patrolTimer: 2 + Math.random() * 3,
        chasing: false,
        spawnX: x,
        spawnY: y,
      });
    }
  }
}

function updatePlayer(dt: number): void {
  let dx = 0;
  let dy = 0;
  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;
  if (dx !== 0 || dy !== 0) {
    const len = Math.sqrt(dx * dx + dy * dy);
    dx /= len;
    dy /= len;
  }
  player.x += dx * PLAYER_SPEED * dt;
  player.y += dy * PLAYER_SPEED * dt;
  player.x = Math.max(PLAYER_RADIUS, Math.min(canvasWidth - PLAYER_RADIUS, player.x));
  player.y = Math.max(PLAYER_RADIUS, Math.min(canvasHeight - PLAYER_RADIUS, player.y));

  if (player.invincible) {
    player.invincibleTimer -= dt * 1000;
    if (player.invincibleTimer <= 0) {
      player.invincible = false;
    }
  }

  if (player.comboTimer > 0) {
    player.comboTimer -= dt * 1000;
    if (player.comboTimer <= 0) {
      resetCombo();
    }
  }
}

function updateBrightness(dt: number): void {
  if (state.phase === 'playing') {
    reduceBrightness(BRIGHTNESS_DECAY * dt);
    player.brightness = state.brightness;
  }
}

function updateFragments(dt: number): void {
  for (const f of fragments) {
    if (f.collected) {
      f.collectAnim += dt;
      if (f.collectAnim < 0.15) {
        f.scale = 1 + (f.collectAnim / 0.15) * 0.5;
      } else if (f.collectAnim < 0.3) {
        f.scale = 1.5 - ((f.collectAnim - 0.15) / 0.15) * 0.5;
      } else {
        f.scale = 1;
      }
    } else {
      f.rotation += dt * 2;
    }
  }
}

function updateEnemies(dt: number): void {
  for (const e of enemies) {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const chaseRange = 220;
    const loseRange = 350;

    if (dist < chaseRange && !e.chasing) {
      e.chasing = true;
    } else if (dist > loseRange && e.chasing) {
      e.chasing = false;
      e.patrolTimer = 1 + Math.random() * 2;
      const angle = Math.random() * Math.PI * 2;
      e.vx = Math.cos(angle) * ENEMY_SPEED;
      e.vy = Math.sin(angle) * ENEMY_SPEED;
    }

    if (e.chasing) {
      const ndx = dx / dist;
      const ndy = dy / dist;
      e.vx = ndx * ENEMY_SPEED;
      e.vy = ndy * ENEMY_SPEED;
    } else {
      e.patrolTimer -= dt;
      if (e.patrolTimer <= 0) {
        e.patrolTimer = 2 + Math.random() * 3;
        const angle = Math.random() * Math.PI * 2;
        e.vx = Math.cos(angle) * ENEMY_SPEED;
        e.vy = Math.sin(angle) * ENEMY_SPEED;
      }
    }

    e.x += e.vx * dt;
    e.y += e.vy * dt;

    if (e.x < ENEMY_RADIUS_X) { e.x = ENEMY_RADIUS_X; e.vx = Math.abs(e.vx); }
    if (e.x > canvasWidth - ENEMY_RADIUS_X) { e.x = canvasWidth - ENEMY_RADIUS_X; e.vx = -Math.abs(e.vx); }
    if (e.y < ENEMY_RADIUS_Y) { e.y = ENEMY_RADIUS_Y; e.vy = Math.abs(e.vy); }
    if (e.y > canvasHeight - ENEMY_RADIUS_Y) { e.y = canvasHeight - ENEMY_RADIUS_Y; e.vy = -Math.abs(e.vy); }
  }
}

function checkCollisions(): void {
  grid.clear();
  for (const f of fragments) {
    if (!f.collected) {
      grid.insert(f, f.x, f.y, FRAGMENT_SIZE);
    }
  }
  for (const e of enemies) {
    grid.insert(e, e.x, e.y, ENEMY_RADIUS_X);
  }

  const nearbyFragments = grid.query(player.x, player.y, PLAYER_RADIUS + FRAGMENT_SIZE);
  for (const obj of nearbyFragments) {
    if (obj instanceof Object && 'collected' in obj && !(obj as Fragment).collected) {
      const f = obj as Fragment;
      const dx = player.x - f.x;
      const dy = player.y - f.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < PLAYER_RADIUS + FRAGMENT_SIZE * 0.7) {
        f.collected = true;
        f.collectAnim = 0;
        f.scale = 1;
        incrementCombo();
        player.comboTimer = COMBO_TIMEOUT;
        lastComboTime = performance.now();
        addScore(100);
        state.fragmentsCollected++;
        eventBus.emit('collected', f);
      }
    }
  }

  const nearbyEnemies = grid.query(player.x, player.y, PLAYER_RADIUS + ENEMY_RADIUS_X);
  for (const obj of nearbyEnemies) {
    if (obj instanceof Object && 'chasing' in obj) {
      const e = obj as Enemy;
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < PLAYER_RADIUS + ENEMY_RADIUS_X * 0.7) {
        if (!player.invincible) {
          reduceBrightness(15);
          player.brightness = state.brightness;
          resetCombo();
          eventBus.emit('enemyHit', e);
          const pushAngle = Math.atan2(player.y - e.y, player.x - e.x);
          player.x += Math.cos(pushAngle) * 40;
          player.y += Math.sin(pushAngle) * 40;
          player.x = Math.max(PLAYER_RADIUS, Math.min(canvasWidth - PLAYER_RADIUS, player.x));
          player.y = Math.max(PLAYER_RADIUS, Math.min(canvasHeight - PLAYER_RADIUS, player.y));
        } else {
          eventBus.emit('collided', e);
        }
      }
    }
  }
}

function renderBackground(ctx: CanvasRenderingContext2D): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  gradient.addColorStop(0, '#0B0C2A');
  gradient.addColorStop(1, '#1B1C3E');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  const gridSize = 60;
  for (let x = 0; x < canvasWidth; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();
  }
  for (let y = 0; y < canvasHeight; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }
}

function renderPlayer(ctx: CanvasRenderingContext2D): void {
  const alpha = state.brightness / 100;

  if (player.invincible) {
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 150);
    ctx.save();
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_RADIUS + 8, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 + pulse * 0.6})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  const outerGlow = ctx.createRadialGradient(
    player.x, player.y, PLAYER_RADIUS * 0.3,
    player.x, player.y, PLAYER_RADIUS + GLOW_LENGTH
  );
  outerGlow.addColorStop(0, `rgba(100, 200, 255, ${0.4 * alpha})`);
  outerGlow.addColorStop(0.5, `rgba(80, 160, 255, ${0.15 * alpha})`);
  outerGlow.addColorStop(1, 'rgba(80, 160, 255, 0)');
  ctx.beginPath();
  ctx.arc(player.x, player.y, PLAYER_RADIUS + GLOW_LENGTH, 0, Math.PI * 2);
  ctx.fillStyle = outerGlow;
  ctx.fill();

  const bodyGradient = ctx.createRadialGradient(
    player.x - 4, player.y - 4, 2,
    player.x, player.y, PLAYER_RADIUS
  );
  bodyGradient.addColorStop(0, `rgba(200, 240, 255, ${0.9 * alpha + 0.1})`);
  bodyGradient.addColorStop(0.7, `rgba(80, 180, 255, ${0.8 * alpha + 0.1})`);
  bodyGradient.addColorStop(1, `rgba(40, 100, 200, ${0.5 * alpha})`);
  ctx.beginPath();
  ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = bodyGradient;
  ctx.fill();
}

function renderFragments(ctx: CanvasRenderingContext2D): void {
  for (const f of fragments) {
    if (f.collected && f.collectAnim > 0.3) continue;
    ctx.save();
    ctx.translate(f.x, f.y);
    if (f.collected) {
      ctx.scale(f.scale, f.scale);
      ctx.globalAlpha = 1 - f.collectAnim / 0.3;
    }
    ctx.rotate(f.rotation);
    ctx.beginPath();
    const s = FRAGMENT_SIZE * 0.7;
    ctx.moveTo(0, -s);
    ctx.lineTo(s, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s, 0);
    ctx.closePath();
    if (f.collected) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    } else {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#FFFFFF';
    }
    ctx.fill();
    ctx.restore();
  }
}

function renderEnemies(ctx: CanvasRenderingContext2D): void {
  for (const e of enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);

    const glow = ctx.createRadialGradient(0, 0, ENEMY_RADIUS_X * 0.3, 0, 0, ENEMY_RADIUS_X * 1.5);
    glow.addColorStop(0, 'rgba(120, 50, 180, 0.3)');
    glow.addColorStop(1, 'rgba(120, 50, 180, 0)');
    ctx.beginPath();
    ctx.ellipse(0, 0, ENEMY_RADIUS_X * 1.5, ENEMY_RADIUS_Y * 1.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, 0, ENEMY_RADIUS_X, ENEMY_RADIUS_Y, 0, 0, Math.PI * 2);
    const enemyGrad = ctx.createRadialGradient(0, -4, 2, 0, 0, ENEMY_RADIUS_X);
    enemyGrad.addColorStop(0, 'rgba(160, 80, 220, 0.8)');
    enemyGrad.addColorStop(1, 'rgba(100, 40, 160, 0.5)');
    ctx.fillStyle = enemyGrad;
    ctx.fill();

    if (e.chasing) {
      ctx.beginPath();
      ctx.arc(-6, -4, 3, 0, Math.PI * 2);
      ctx.arc(6, -4, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
      ctx.fill();
    }

    ctx.restore();
  }
}

function updateMap(dt: number): void {
  if (state.phase !== 'playing' && state.phase !== 'tutorial') return;
  updatePlayer(dt);
  updateBrightness(dt);
  updateFragments(dt);
  updateEnemies(dt);
  checkCollisions();
}

function renderMap(ctx: CanvasRenderingContext2D): void {
  renderBackground(ctx);
  renderFragments(ctx);
  renderEnemies(ctx);
  renderPlayer(ctx);
}

function handleKeyDown(e: KeyboardEvent): void {
  keys.add(e.key.toLowerCase());
}

function handleKeyUp(e: KeyboardEvent): void {
  keys.delete(e.key.toLowerCase());
}

function resizeMapEngine(cw: number, ch: number): void {
  canvasWidth = cw;
  canvasHeight = ch;
}

export {
  initMapEngine,
  updateMap,
  renderMap,
  handleKeyDown,
  handleKeyUp,
  resizeMapEngine,
  resetState as resetMapState,
  player,
  fragments,
  enemies,
};
