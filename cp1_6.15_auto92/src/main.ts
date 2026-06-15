import { Pet } from './pet';
import { UIManager } from './ui';

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 480;
const STAT_DECREMENT_INTERVAL = 3000;

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
ctx.imageSmoothingEnabled = false;

const pet = new Pet(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 160);
const ui = new UIManager(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);

let lastTime = performance.now();
let running = true;

const syncPetColor = (): void => {
  const settings = ui.getSettings();
  pet.setPetColor(settings.petColor);
};

const gameLoop = (currentTime: number): void => {
  if (!running) return;

  const deltaTime = Math.min(currentTime - lastTime, 50);
  lastTime = currentTime;

  pet.update(deltaTime);
  ui.update(deltaTime, pet);
  syncPetColor();

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ui.render(pet);

  requestAnimationFrame(gameLoop);
};

const statTimer = setInterval(() => {
  pet.decrementStats();
}, STAT_DECREMENT_INTERVAL);

const getCanvasCoords = (e: MouseEvent | Touch): { x: number; y: number } => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
};

let isDragging = false;

canvas.addEventListener('mousedown', (e: MouseEvent) => {
  const coords = getCanvasCoords(e);
  isDragging = true;
  ui.handleClick(coords.x, coords.y, pet);
});

canvas.addEventListener('mousemove', (e: MouseEvent) => {
  if (isDragging) {
    const coords = getCanvasCoords(e);
    ui.handleDrag(coords.x, coords.y);
  }
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
  ui.handleRelease();
});

canvas.addEventListener('mouseleave', () => {
  isDragging = false;
  ui.handleRelease();
});

canvas.addEventListener('touchstart', (e: TouchEvent) => {
  e.preventDefault();
  if (e.touches.length > 0) {
    const coords = getCanvasCoords(e.touches[0]);
    isDragging = true;
    ui.handleClick(coords.x, coords.y, pet);
  }
}, { passive: false });

canvas.addEventListener('touchmove', (e: TouchEvent) => {
  e.preventDefault();
  if (isDragging && e.touches.length > 0) {
    const coords = getCanvasCoords(e.touches[0]);
    ui.handleDrag(coords.x, coords.y);
  }
}, { passive: false });

canvas.addEventListener('touchend', (e: TouchEvent) => {
  e.preventDefault();
  isDragging = false;
  ui.handleRelease();
}, { passive: false });

canvas.addEventListener('touchcancel', () => {
  isDragging = false;
  ui.handleRelease();
});

window.addEventListener('beforeunload', () => {
  running = false;
  clearInterval(statTimer);
});

syncPetColor();
requestAnimationFrame(gameLoop);
