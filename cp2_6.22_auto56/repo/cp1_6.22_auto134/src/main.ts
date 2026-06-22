import { Game } from './game';
import { Renderer } from './renderer';
import { GamePhase } from './types';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const game = new Game();
const renderer = new Renderer(canvas, game);

renderer.resize();
window.addEventListener('resize', () => renderer.resize());

let lastTime = 0;
let dragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartCanvasX = 0;
let dragStartCanvasY = 0;
const SWIPE_THRESHOLD = 20;

function getEventPos(e: TouchEvent | MouseEvent): { clientX: number; clientY: number } {
  if ('touches' in e) {
    const touch = e.touches[0] || e.changedTouches[0];
    return { clientX: touch.clientX, clientY: touch.clientY };
  }
  return { clientX: (e as MouseEvent).clientX, clientY: (e as MouseEvent).clientY };
}

function handleStart(e: TouchEvent | MouseEvent): void {
  e.preventDefault();
  const pos = getEventPos(e);
  const canvasPos = renderer.screenToCanvas(pos.clientX, pos.clientY);

  if (game.phase === GamePhase.GameOver) {
    if (renderer.isRestartButtonHit(canvasPos.x, canvasPos.y)) {
      game.reset();
    }
    return;
  }

  if (game.energy >= 1 && renderer.isBurstButtonHit(canvasPos.x, canvasPos.y)) {
    game.activateBurst();
    return;
  }

  const cell = renderer.getCellAt(canvasPos.x, canvasPos.y);
  if (cell) {
    dragging = true;
    dragStartX = pos.clientX;
    dragStartY = pos.clientY;
    dragStartCanvasX = canvasPos.x;
    dragStartCanvasY = canvasPos.y;
  }
}

function handleEnd(e: TouchEvent | MouseEvent): void {
  e.preventDefault();
  if (!dragging) return;
  dragging = false;

  const pos = getEventPos(e);
  const dx = pos.clientX - dragStartX;
  const dy = pos.clientY - dragStartY;

  if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

  const cell = renderer.getCellAt(dragStartCanvasX, dragStartCanvasY);
  if (!cell) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    game.handleSwipe(cell.row, cell.col, dx > 0 ? 'right' : 'left');
  } else {
    game.handleSwipe(cell.row, cell.col, dy > 0 ? 'down' : 'up');
  }
}

canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('mouseup', handleEnd);
canvas.addEventListener('touchstart', handleStart, { passive: false });
canvas.addEventListener('touchend', handleEnd, { passive: false });

canvas.addEventListener('mousemove', (e) => e.preventDefault());
canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

function gameLoop(timestamp: number): void {
  if (lastTime === 0) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  game.update(dt);
  renderer.render(dt);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
