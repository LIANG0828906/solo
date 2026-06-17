import { eventBus } from './eventBus';
import { initRenderer, update, RenderState } from './renderer';
import { fireWave, tick as waveTick, resetWave, isWaveActive } from './waveSimulator';
import { initEnemies, tick as enemyTick, handleWaveHit, getAliveEnemyCount, getEnemies } from './enemyController';
import { levelData, CELL_SIZE, isWallPixel, CANVAS_W, CANVAS_H } from './levelData';

const PLAYER_SPEED = 3;
const PLAYER_BASE_RADIUS = 6;
const BREATH_MIN = 5.5;
const BREATH_MAX = 6.5;
const BREATH_PERIOD = 1200;
const PORTAL_RADIUS = 16;

let canvas: HTMLCanvasElement;
let playerX: number;
let playerY: number;
let mouseX = 0;
let mouseY = 0;
let keys: Set<string> = new Set();
let waveFlying = false;
let levelComplete = false;
let gameWon = false;
let fireCount = 0;
let frequency = 1.0;
let mouseOnEnemyId: number | null = null;

function resetGame(): void {
  const start = levelData.playerStart;
  playerX = (start.gridX + 0.5) * CELL_SIZE;
  playerY = (start.gridY + 0.5) * CELL_SIZE;
  waveFlying = false;
  levelComplete = false;
  gameWon = false;
  fireCount = 0;
  frequency = 1.0;
  resetWave();
  initEnemies();
  eventBus.emit('game:restart', {});
  hideVictory();
}

function handleKeyDown(e: KeyboardEvent): void {
  keys.add(e.key.toLowerCase());

  if (e.key === ' ' && !waveFlying && !levelComplete) {
    e.preventDefault();
    fireWave(playerX, playerY, mouseX, mouseY, frequency);
    waveFlying = true;
    fireCount++;
  }

  if (e.key.toLowerCase() === 'r') {
    resetGame();
  }

  if (e.key === '1') frequency = 1.0;
  if (e.key === '2') frequency = 2.0;
  if (e.key === '3') frequency = 3.0;
}

function handleKeyUp(e: KeyboardEvent): void {
  keys.delete(e.key.toLowerCase());
}

function handleMouseMove(e: MouseEvent): void {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_W / rect.width;
  const scaleY = CANVAS_H / rect.height;
  mouseX = (e.clientX - rect.left) * scaleX;
  mouseY = (e.clientY - rect.top) * scaleY;

  mouseOnEnemyId = null;
  const enemies = getEnemies();
  for (const enemy of enemies) {
    if (!enemy.alive || enemy.dying) continue;
    const dx = mouseX - enemy.x;
    const dy = mouseY - enemy.y;
    if (Math.sqrt(dx * dx + dy * dy) < 16) {
      mouseOnEnemyId = enemy.id;
      break;
    }
  }
}

function movePlayer(): void {
  if (waveFlying || levelComplete) return;

  let dx = 0;
  let dy = 0;
  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;

  if (dx === 0 && dy === 0) return;

  const len = Math.sqrt(dx * dx + dy * dy);
  dx = (dx / len) * PLAYER_SPEED;
  dy = (dy / len) * PLAYER_SPEED;

  const nx = playerX + dx;
  const ny = playerY + dy;

  if (!isWallPixel(nx, playerY)) {
    playerX = nx;
  }
  if (!isWallPixel(playerX, ny)) {
    playerY = ny;
  }
}

function checkPortalCollision(): void {
  if (!levelComplete || gameWon) return;
  const dx = playerX - playerX;
  const dy = playerY - playerY;
  if (Math.sqrt(dx * dx + dy * dy) < PORTAL_RADIUS) {
    gameWon = true;
    showVictory();
  }
}

function showVictory(): void {
  const overlay = document.getElementById('victory-overlay');
  if (overlay) {
    overlay.classList.add('show');
  }
}

function hideVictory(): void {
  const overlay = document.getElementById('victory-overlay');
  if (overlay) {
    overlay.classList.remove('show');
  }
}

function gameLoop(now: number): void {
  movePlayer();

  waveTick(now);

  if (waveFlying && !isWaveActive()) {
    waveFlying = false;
  }

  enemyTick(now);

  if (levelComplete) {
    checkPortalCollision();
  }

  const breathPhase = (now % BREATH_PERIOD) / BREATH_PERIOD;
  const breathRadius = BREATH_MIN + (BREATH_MAX - BREATH_MIN) * (0.5 + 0.5 * Math.sin(breathPhase * Math.PI * 2));

  const state: RenderState = {
    playerX,
    playerY,
    breathRadius,
    mouseX,
    mouseY,
    mouseOnEnemy: mouseOnEnemyId,
    levelComplete,
    portalVisible: levelComplete,
    fireCount,
    enemyCount: getAliveEnemyCount(),
    frequency,
    now,
  };

  update(state);

  requestAnimationFrame(gameLoop);
}

function setupEvents(): void {
  eventBus.on('wave:hit', (data: { x: number; y: number; dx: number; dy: number; frequency: number }) => {
    handleWaveHit(data.x, data.y, data.dx, data.dy);
  });

  eventBus.on('wave:complete', () => {
    waveFlying = false;
  });

  eventBus.on('level:complete', () => {
    levelComplete = true;
  });
}

function init(): void {
  canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  initRenderer(canvas);

  const start = levelData.playerStart;
  playerX = (start.gridX + 0.5) * CELL_SIZE;
  playerY = (start.gridY + 0.5) * CELL_SIZE;

  initEnemies();

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  canvas.addEventListener('mousemove', handleMouseMove);

  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      resetGame();
    });
  }

  setupEvents();

  requestAnimationFrame(gameLoop);
}

init();
