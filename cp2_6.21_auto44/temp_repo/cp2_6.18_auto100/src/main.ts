import { Car } from './car';
import { Arena } from './arena';
import { Renderer } from './renderer';
import type { GameState, InputState } from './types';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const renderer = new Renderer(canvas);

let car: Car;
let arena: Arena;
let gameState: GameState;
let input: InputState;

let lastTimestamp = 0;
let elapsedTime = 0;
let fpsAccumulator = 0;
let fpsFrameCount = 0;
let fpsCheckInterval = 0.5;

function initGame(): void {
  const center = renderer.getCenter();
  arena = new Arena(center);
  car = new Car(arena.state.center, arena.state.currentRadius);
  gameState = {
    running: true,
    gameOver: false,
    survivalTime: 0,
    currentFps: 60,
    lowFpsMode: false
  };
  input = {
    up: false,
    down: false,
    left: false,
    right: false,
    drift: false
  };
  elapsedTime = 0;
  fpsAccumulator = 0;
  fpsFrameCount = 0;
  lastTimestamp = performance.now();
}

function handleKeyDown(e: KeyboardEvent): void {
  if (gameState.gameOver && (e.key === 'r' || e.key === 'R')) {
    initGame();
    return;
  }
  switch (e.key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      input.up = true;
      break;
    case 's':
    case 'arrowdown':
      input.down = true;
      break;
    case 'a':
    case 'arrowleft':
      input.left = true;
      break;
    case 'd':
    case 'arrowright':
      input.right = true;
      break;
    case ' ':
      input.drift = true;
      e.preventDefault();
      break;
  }
}

function handleKeyUp(e: KeyboardEvent): void {
  switch (e.key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      input.up = false;
      break;
    case 's':
    case 'arrowdown':
      input.down = false;
      break;
    case 'a':
    case 'arrowleft':
      input.left = false;
      break;
    case 'd':
    case 'arrowright':
      input.right = false;
      break;
    case ' ':
      input.drift = false;
      break;
  }
}

function gameLoop(timestamp: number): void {
  const rawDt = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  const dt = Math.min(rawDt, 0.05);

  fpsAccumulator += rawDt;
  fpsFrameCount++;
  if (fpsAccumulator >= fpsCheckInterval) {
    gameState.currentFps = fpsFrameCount / fpsAccumulator;
    gameState.lowFpsMode = gameState.currentFps < 50;
    fpsAccumulator = 0;
    fpsFrameCount = 0;
  }

  if (!gameState.gameOver) {
    elapsedTime += dt;
    gameState.survivalTime = elapsedTime;

    arena.update(dt, elapsedTime);
    car.update(dt, input, arena.state, arena.obstacles);

    if (car.isOutsideArena(arena.state)) {
      gameState.gameOver = true;
      gameState.running = false;
    }
  }

  renderer.render(
    car.state,
    car.skidMarks,
    arena.state,
    arena.obstacles,
    gameState,
    arena.isEdgeFlashing(),
    arena.getDiameterPercentage()
  );

  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

initGame();
requestAnimationFrame(gameLoop);
