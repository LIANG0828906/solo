import { GameEngine, type InputState, type GameState, type LapRecord } from './GameEngine';
import { TerrainManager } from './TerrainManager';
import { CanvasRenderer } from './CanvasRenderer';

const LEADERBOARD_KEY = 'racing_leaderboard';
const MAX_LEADERBOARD_ENTRIES = 10;
const CAMERA_LERP_FACTOR = 0.1;
const SHOW_FPS = true;

let canvas: HTMLCanvasElement;
let engine: GameEngine;
let renderer: CanvasRenderer;
let terrainManager: TerrainManager;
let camera: { x: number; y: number; zoom: number };
let inputState: InputState;
let leaderboard: LapRecord[];
let previousLap: number;
let lastFrameTime: number;
let fps: number;
let fpsFrames: number;
let fpsLastTime: number;

async function init(): Promise<void> {
  canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element not found');
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  terrainManager = new TerrainManager();
  try {
    await terrainManager.loadFromAPI();
  } catch (error) {
    console.warn('Failed to load terrain from API, using defaults:', error);
  }

  engine = new GameEngine(terrainManager);
  renderer = new CanvasRenderer(canvas, terrainManager);

  camera = { x: 0, y: 0, zoom: 1 };
  inputState = { up: false, down: false, left: false, right: false };
  previousLap = 0;
  lastFrameTime = performance.now();
  fps = 0;
  fpsFrames = 0;
  fpsLastTime = performance.now();

  leaderboard = loadLeaderboardFromLocalStorage();
  loadLeaderboardFromAPI().catch((error) => {
    console.warn('Failed to load leaderboard from API:', error);
  });

  bindInputEvents();

  engine.reset();
  const initialState = engine.getState();
  camera.x = initialState.car.x;
  camera.y = initialState.car.y;

  requestAnimationFrame(gameLoop);
}

function resizeCanvas(): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function bindInputEvents(): void {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
}

function handleKeyDown(e: KeyboardEvent): void {
  switch (e.key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      inputState.up = true;
      break;
    case 's':
    case 'arrowdown':
      inputState.down = true;
      break;
    case 'a':
    case 'arrowleft':
      inputState.left = true;
      break;
    case 'd':
    case 'arrowright':
      inputState.right = true;
      break;
  }
  engine.setInput(inputState);
}

function handleKeyUp(e: KeyboardEvent): void {
  switch (e.key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      inputState.up = false;
      break;
    case 's':
    case 'arrowdown':
      inputState.down = false;
      break;
    case 'a':
    case 'arrowleft':
      inputState.left = false;
      break;
    case 'd':
    case 'arrowright':
      inputState.right = false;
      break;
  }
  engine.setInput(inputState);
}

function gameLoop(currentTime: number): void {
  const deltaTime = currentTime - lastFrameTime;
  lastFrameTime = currentTime;

  if (SHOW_FPS) {
    fpsFrames++;
    if (currentTime - fpsLastTime >= 1000) {
      fps = fpsFrames;
      fpsFrames = 0;
      fpsLastTime = currentTime;
    }
  }

  engine.update(deltaTime);

  const state = engine.getState();
  updateCamera(state);
  checkLapCompletion(state);

  renderer.render(state, leaderboard, camera, currentTime);

  if (SHOW_FPS) {
    drawFPS();
  }

  requestAnimationFrame(gameLoop);
}

function updateCamera(state: GameState): void {
  const targetX = state.car.x;
  const targetY = state.car.y;

  camera.x += (targetX - camera.x) * CAMERA_LERP_FACTOR;
  camera.y += (targetY - camera.y) * CAMERA_LERP_FACTOR;
}

function checkLapCompletion(state: GameState): void {
  if (state.lastLapRecord && state.lap > previousLap && previousLap > 0) {
    const lapRecord = state.lastLapRecord;

    const isNewRecord = checkIsNewRecord(lapRecord.time);
    addToLeaderboard(lapRecord);
    saveLeaderboardToLocalStorage();
    submitToAPI(lapRecord).catch((error) => {
      console.warn('Failed to submit leaderboard to API:', error);
    });

    if (isNewRecord) {
      triggerNewRecordAnimation();
    }
  }
  previousLap = state.lap;
}

function checkIsNewRecord(time: number): boolean {
  if (leaderboard.length === 0) return true;
  return time < leaderboard[0].time;
}

function addToLeaderboard(record: LapRecord): void {
  leaderboard.push(record);
  leaderboard.sort((a, b) => a.time - b.time);
  leaderboard = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES);
}

function loadLeaderboardFromLocalStorage(): LapRecord[] {
  try {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Failed to load leaderboard from localStorage:', error);
  }
  return [];
}

function saveLeaderboardToLocalStorage(): void {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
  } catch (error) {
    console.warn('Failed to save leaderboard to localStorage:', error);
  }
}

async function loadLeaderboardFromAPI(): Promise<void> {
  try {
    const response = await fetch('/api/leaderboard');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (Array.isArray(data)) {
      mergeLeaderboard(data as LapRecord[]);
      saveLeaderboardToLocalStorage();
    }
  } catch (error) {
    throw new Error(`Failed to load leaderboard: ${error}`);
  }
}

function mergeLeaderboard(apiRecords: LapRecord[]): void {
  const allRecords = [...leaderboard, ...apiRecords];
  const uniqueMap = new Map<string, LapRecord>();
  for (const record of allRecords) {
    uniqueMap.set(record.id, record);
  }
  leaderboard = Array.from(uniqueMap.values());
  leaderboard.sort((a, b) => a.time - b.time);
  leaderboard = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES);
}

async function submitToAPI(record: LapRecord): Promise<void> {
  try {
    const response = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        time: record.time,
        averageSpeed: record.averageSpeed,
        terrainTimes: record.terrainTimes,
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (Array.isArray(data)) {
      mergeLeaderboard(data as LapRecord[]);
      saveLeaderboardToLocalStorage();
    }
  } catch (error) {
    throw new Error(`Failed to submit leaderboard: ${error}`);
  }
}

function triggerNewRecordAnimation(): void {
  const flashElement = document.getElementById('new-record-flash');
  if (!flashElement) return;

  flashElement.classList.remove('new-record-flash');
  void flashElement.offsetWidth;
  flashElement.classList.add('new-record-flash');

  const animationDuration = 500;
  setTimeout(() => {
    flashElement.classList.remove('new-record-flash');
  }, animationDuration);
}

function drawFPS(): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(10, 10, 100, 30);
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`FPS: ${fps}`, 20, 17);
  ctx.restore();
}

init().catch((error) => {
  console.error('Failed to initialize game:', error);
});
