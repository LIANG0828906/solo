import type { Snake, Food, Point, EatFoodEffect } from './types';
import {
  CANVAS_SIZE,
  GRID_SIZE,
  CELL_PADDING,
  FOOD_RADIUS,
  COLOR_PALETTE,
  EAT_FOOD_EFFECT_DURATION,
} from './types';
import { getGameState } from './gameStore';

let offscreenCanvas: OffscreenCanvas | null = null;
let offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;
let gridCanvas: HTMLCanvasElement | null = null;
let gridCtx: CanvasRenderingContext2D | null = null;
let lastSnakeState: string = '';
let lastFoodState: string = '';
let lastEffectState: string = '';
let scaleFactor: number = 1;

type CanvasContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const initOffscreenCanvas = (): void => {
  if (typeof OffscreenCanvas !== 'undefined') {
    offscreenCanvas = new OffscreenCanvas(CANVAS_SIZE, CANVAS_SIZE);
    offscreenCtx = offscreenCanvas.getContext('2d');
  }
};

const initGridCache = (): void => {
  gridCanvas = document.createElement('canvas');
  gridCanvas.width = CANVAS_SIZE;
  gridCanvas.height = CANVAS_SIZE;
  gridCtx = gridCanvas.getContext('2d');

  if (gridCtx) {
    gridCtx.strokeStyle = '#1A1A1A';
    gridCtx.lineWidth = 1;

    for (let x = 0; x <= CANVAS_SIZE; x += GRID_SIZE) {
      gridCtx.beginPath();
      gridCtx.moveTo(x, 0);
      gridCtx.lineTo(x, CANVAS_SIZE);
      gridCtx.stroke();
    }

    for (let y = 0; y <= CANVAS_SIZE; y += GRID_SIZE) {
      gridCtx.beginPath();
      gridCtx.moveTo(0, y);
      gridCtx.lineTo(CANVAS_SIZE, y);
      gridCtx.stroke();
    }
  }
};

export const setScaleFactor = (factor: number): void => {
  scaleFactor = factor;
};

export const initRenderer = (): void => {
  initOffscreenCanvas();
  initGridCache();
};

const drawGrid = (ctx: CanvasContext): void => {
  if (gridCanvas) {
    ctx.drawImage(gridCanvas, 0, 0);
  }
};

const drawSnake = (ctx: CanvasContext, snake: Snake): void => {
  const opacity = snake.deathOpacity ?? 1;
  ctx.globalAlpha = opacity;

  const cellSize = GRID_SIZE * scaleFactor;
  const padding = CELL_PADDING * scaleFactor;

  snake.body.forEach((segment, index) => {
    const x = segment.x * scaleFactor + padding;
    const y = segment.y * scaleFactor + padding;
    const size = cellSize - padding * 2;

    ctx.fillStyle = snake.color;

    if (index === 0) {
      ctx.shadowColor = snake.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(x, y, size, size, 4 * scaleFactor);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#FFFFFF';
      const eyeSize = 3 * scaleFactor;
      const eyeOffset = 4 * scaleFactor;

      if (snake.direction === 'up' || snake.direction === 'down') {
        ctx.beginPath();
        ctx.arc(x + size / 3, y + size / 2, eyeSize, 0, Math.PI * 2);
        ctx.arc(x + size * 2 / 3, y + size / 2, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 3, eyeSize, 0, Math.PI * 2);
        ctx.arc(x + size / 2, y + size * 2 / 3, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const alpha = 1 - (index / snake.body.length) * 0.4;
      ctx.globalAlpha = opacity * alpha;
      ctx.beginPath();
      ctx.roundRect(x, y, size, size, 2 * scaleFactor);
      ctx.fill();
      ctx.globalAlpha = opacity;
    }
  });

  ctx.globalAlpha = 1;
};

const drawFood = (ctx: CanvasContext, food: Food): void => {
  const x = food.position.x * scaleFactor + (GRID_SIZE * scaleFactor) / 2;
  const y = food.position.y * scaleFactor + (GRID_SIZE * scaleFactor) / 2;
  const radius = FOOD_RADIUS * scaleFactor * food.scale;

  ctx.save();
  ctx.shadowColor = '#00FF00';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#00FF00';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const drawEatFoodEffect = (ctx: CanvasContext, effect: EatFoodEffect): void => {
  const elapsed = Date.now() - effect.createdAt;
  const progress = Math.min(1, elapsed / EAT_FOOD_EFFECT_DURATION);

  const x = effect.position.x * scaleFactor + (GRID_SIZE * scaleFactor) / 2;
  const y = effect.position.y * scaleFactor + (GRID_SIZE * scaleFactor) / 2;

  const maxRadius = 24 * scaleFactor;
  const radius = maxRadius * progress;
  const alpha = 1 - progress;

  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.shadowColor = '#FFFFFF';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3 * scaleFactor;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  if (progress < 0.5) {
    ctx.shadowColor = effect.snakeColor;
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = (1 - progress * 2) * 0.8;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6 + progress * 2;
    const dist = radius * 0.8;
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * dist;
    const particleSize = (3 - progress * 3) * scaleFactor;

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(0, particleSize), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
};

const hasStateChanged = (snakes: Snake[], foods: Food[], effects: EatFoodEffect[]): boolean => {
  const snakeState = JSON.stringify(snakes.map(s => ({ id: s.id, body: s.body, alive: s.alive, deathOpacity: s.deathOpacity })));
  const foodState = JSON.stringify(foods.map(f => ({ id: f.id, position: f.position, scale: f.scale })));
  const effectState = JSON.stringify(effects.map(e => ({ id: e.id, createdAt: e.createdAt })));

  if (snakeState !== lastSnakeState || foodState !== lastFoodState || effectState !== lastEffectState) {
    lastSnakeState = snakeState;
    lastFoodState = foodState;
    lastEffectState = effectState;
    return true;
  }
  return false;
};

export const render = (canvas: HTMLCanvasElement | null): void => {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const state = getGameState();
  const { snakes, foods, eatFoodEffects } = state;
  const effects = eatFoodEffects || [];

  const needsRedraw = hasStateChanged(snakes, foods, effects);

  if (!needsRedraw && offscreenCanvas && effects.length === 0) {
    ctx.drawImage(offscreenCanvas, 0, 0);
    return;
  }

  const targetCtx = offscreenCtx || ctx;
  const targetCanvas = offscreenCanvas || canvas;

  if (targetCtx) {
    targetCtx.fillStyle = '#1A1A2E';
    targetCtx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);

    drawGrid(targetCtx);

    foods.forEach((food) => drawFood(targetCtx, food));

    snakes.forEach((snake) => {
      if (snake.alive || (snake.deathOpacity !== undefined && snake.deathOpacity > 0)) {
        drawSnake(targetCtx, snake);
      }
    });

    effects.forEach((effect) => drawEatFoodEffect(targetCtx, effect));

    if (offscreenCanvas) {
      ctx.drawImage(offscreenCanvas, 0, 0);
    }
  }
};

export const forceRender = (canvas: HTMLCanvasElement | null): void => {
  lastSnakeState = '';
  lastFoodState = '';
  lastEffectState = '';
  render(canvas);
};
