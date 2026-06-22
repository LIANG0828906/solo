import { createInitialGameState, updateScene, addGravityField } from './scene';
import { render } from './renderer';
import { checkLevelComplete, isLastLevel } from './levels';
import type { GameState } from './types';

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 700;

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let state: GameState;
let lastTime = 0;
let buttonRect: { x: number; y: number; w: number; h: number } | null = null;
let isDragging = false;
let dragCooldown = 0;
const DRAG_COOLDOWN_MS = 120;

function init(): void {
  canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }
  const context = canvas.getContext('2d');
  if (!context) {
    console.error('Failed to get 2D context');
    return;
  }
  ctx = context;

  state = createInitialGameState(1);
  bindEvents();
  requestAnimationFrame(gameLoop);
}

function bindEvents(): void {
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('mouseleave', handleMouseUp);

  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
}

function getCanvasPos(clientX: number, clientY: number): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

function isInLevelCompleteButton(x: number, y: number): boolean {
  if (!buttonRect || !state.levelComplete) return false;
  return (
    x >= buttonRect.x &&
    x <= buttonRect.x + buttonRect.w &&
    y >= buttonRect.y &&
    y <= buttonRect.y + buttonRect.h
  );
}

function goToNextLevel(): void {
  if (isLastLevel(state.currentLevel)) {
    state = createInitialGameState(1);
  } else {
    state = createInitialGameState(state.currentLevel + 1);
  }
}

function handleMouseDown(e: MouseEvent): void {
  const pos = getCanvasPos(e.clientX, e.clientY);
  if (isInLevelCompleteButton(pos.x, pos.y)) {
    goToNextLevel();
    return;
  }
  if (state.levelComplete) return;
  isDragging = true;
  dragCooldown = 0;
  addGravityField(state, pos.x, pos.y, performance.now());
}

function handleMouseMove(e: MouseEvent): void {
  if (!isDragging || state.levelComplete) return;
  const now = performance.now();
  if (now - dragCooldown < DRAG_COOLDOWN_MS) return;
  dragCooldown = now;
  const pos = getCanvasPos(e.clientX, e.clientY);
  addGravityField(state, pos.x, pos.y, now);
}

function handleMouseUp(): void {
  isDragging = false;
}

function handleTouchStart(e: TouchEvent): void {
  e.preventDefault();
  if (e.touches.length === 0) return;
  const touch = e.touches[0];
  const pos = getCanvasPos(touch.clientX, touch.clientY);
  if (isInLevelCompleteButton(pos.x, pos.y)) {
    goToNextLevel();
    return;
  }
  if (state.levelComplete) return;
  isDragging = true;
  dragCooldown = 0;
  addGravityField(state, pos.x, pos.y, performance.now());
}

function handleTouchMove(e: TouchEvent): void {
  e.preventDefault();
  if (!isDragging || state.levelComplete) return;
  if (e.touches.length === 0) return;
  const now = performance.now();
  if (now - dragCooldown < DRAG_COOLDOWN_MS) return;
  dragCooldown = now;
  const touch = e.touches[0];
  const pos = getCanvasPos(touch.clientX, touch.clientY);
  addGravityField(state, pos.x, pos.y, now);
}

function handleTouchEnd(e: TouchEvent): void {
  e.preventDefault();
  isDragging = false;
}

function gameLoop(timestamp: number): void {
  const now = performance.now();
  const deltaTime = Math.min(timestamp - lastTime, 32);
  lastTime = timestamp;

  if (!state.levelComplete) {
    updateScene(state, deltaTime, now);
    if (checkLevelComplete(state.score, state.currentLevel)) {
      state.levelComplete = true;
      state.levelCompleteAt = now;
    }
  } else if (!buttonRect) {
    const elapsed = now - state.levelCompleteAt;
    if (elapsed > 1300) {
    }
  }

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  buttonRect = render(ctx, state, now)?.buttonRect || null;

  requestAnimationFrame(gameLoop);
}

window.addEventListener('DOMContentLoaded', init);
