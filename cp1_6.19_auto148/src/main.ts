import { ShipState, createShip, updateShip } from './ship';
import {
  Reef,
  WaveZone,
  generateReefs,
  generateWaveZones,
  updateReefs,
  updateWaveZones
} from './obstacle';
import {
  RendererState,
  createRendererState,
  renderScene,
  drawIdleOverlay,
  drawSinkingOverlay,
  getHealthColor
} from './renderer';

type GameState = 'idle' | 'playing' | 'gameover';

interface GameRecord {
  distance: number;
  health: number;
  timestamp: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const STORAGE_KEY = 'pirate_ship_records';
const MAX_RECORDS = 5;

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
const distanceDisplay = document.getElementById('distanceDisplay') as HTMLElement;
const healthFill = document.getElementById('healthFill') as HTMLElement;
const collisionCountEl = document.getElementById('collisionCount') as HTMLElement;
const historyList = document.getElementById('historyList') as HTMLElement;

let gameState: GameState = 'idle';
let ship: ShipState = createShip();
let reefs: Reef[] = [];
let waves: WaveZone[] = [];
let rendererState: RendererState = createRendererState();
let distance = 0;
let lastTime = 0;
let animationId: number | null = null;
let gameOverRecorded = false;

function loadRecords(): GameRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data.slice(0, MAX_RECORDS);
    return [];
  } catch {
    return [];
  }
}

function saveRecord(record: GameRecord): void {
  const records = loadRecords();
  records.push(record);
  records.sort((a, b) => b.distance - a.distance);
  const topRecords = records.slice(0, MAX_RECORDS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(topRecords));
}

function renderHistory(): void {
  const records = loadRecords();
  if (records.length === 0) {
    historyList.innerHTML = '<div class="history-empty">暂无航行记录</div>';
    return;
  }

  historyList.innerHTML = records
    .map(
      (r, i) => `
        <div class="history-item">
          <span class="history-rank">#${i + 1}</span>
          <div class="history-info">
            <span class="history-distance">${Math.floor(r.distance)}米</span>
            <span class="history-health">生命: ${r.health}</span>
          </div>
        </div>
      `
    )
    .join('');
}

function updateUI(): void {
  distanceDisplay.textContent = `已航行：${Math.floor(distance)}米`;
  healthFill.style.width = `${Math.max(0, ship.health)}%`;
  healthFill.style.background = getHealthColor(ship.health);

  if (ship.collisionCount > 0 || gameState === 'playing') {
    collisionCountEl.style.display = 'block';
    collisionCountEl.textContent = `碰撞次数：${ship.collisionCount}`;
  } else {
    collisionCountEl.style.display = 'none';
  }
}

function initGame(): void {
  const reefCount = Math.floor(Math.random() * 11) + 20;
  const waveCount = Math.floor(Math.random() * 4) + 5;

  reefs = generateReefs(reefCount);
  waves = generateWaveZones(waveCount);
  ship = createShip();
  rendererState = createRendererState();
  distance = 0;
  gameOverRecorded = false;
  updateUI();
}

function startGame(): void {
  initGame();
  gameState = 'playing';
  startBtn.textContent = '重新起航';
  lastTime = performance.now();
  if (animationId === null) {
    loop(lastTime);
  }
}

function gameLoop(timestamp: number): void {
  const dt = Math.min(0.05, (timestamp - lastTime) / 1000);
  lastTime = timestamp;

  if (gameState === 'playing') {
    const reefsUpdated = updateReefs(reefs, dt);
    const wavesUpdated = updateWaveZones(waves, dt);
    const result = updateShip(ship, reefsUpdated, wavesUpdated, dt);

    reefs = reefsUpdated;
    waves = wavesUpdated;
    ship = result.ship;
    distance += result.distanceDelta;

    if (ship.health <= 0 && !ship.isSinking) {
      gameState = 'gameover';
    }

    if (gameState === 'gameover' && !gameOverRecorded) {
      saveRecord({
        distance: Math.floor(distance),
        health: 0,
        timestamp: Date.now()
      });
      gameOverRecorded = true;
      renderHistory();
    }
  }

  rendererState = renderScene(ctx, ship, reefs, waves, rendererState, dt);

  if (gameState === 'idle') {
    drawIdleOverlay(ctx);
  } else if (gameState === 'gameover') {
    const sinkTime = ship.sinkTimer;
    if (sinkTime >= 1.5) {
      drawSinkingOverlay(ctx, sinkTime - 1.5);
    }
  }

  updateUI();
}

function loop(timestamp: number): void {
  gameLoop(timestamp);
  animationId = requestAnimationFrame(loop);
}

startBtn.addEventListener('click', () => {
  if (gameState === 'playing' || gameState === 'gameover') {
    if (gameState === 'gameover' && ship.health <= 0 && !gameOverRecorded) {
      saveRecord({
        distance: Math.floor(distance),
        health: Math.max(0, ship.health),
        timestamp: Date.now()
      });
      gameOverRecorded = true;
      renderHistory();
    }
    startGame();
  } else {
    startGame();
  }
});

renderHistory();
renderScene(ctx, ship, reefs, waves, rendererState, 0);
drawIdleOverlay(ctx);
animationId = requestAnimationFrame(loop);
