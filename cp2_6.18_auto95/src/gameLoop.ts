import { v4 as uuidv4 } from 'uuid';
import type { Snake, Food, Point, EatFoodEffect } from './types';
import {
  CANVAS_SIZE,
  GRID_SIZE,
  MAX_FOODS,
  FRAME_INTERVAL,
  SCORE_PER_FOOD,
  DEATH_ANIMATION_DURATION,
  FOOD_SCALE_ANIMATION_DURATION,
  EAT_FOOD_EFFECT_DURATION,
} from './types';
import { getGameState, setGameState } from './gameStore';
import { moveAllSnakes, checkAllCollisions, handleAITurns, growSnake } from './snakeLogic';
import { render, forceRender } from './renderer';

let animationFrameId: number | null = null;
let lastFrameTime: number = 0;
let isRunning: boolean = false;
let canvasRef: HTMLCanvasElement | null = null;

const isPositionOccupied = (pos: Point, snakes: Snake[]): boolean => {
  for (const snake of snakes) {
    if (!snake.alive) continue;
    for (const segment of snake.body) {
      if (pos.x === segment.x && pos.y === segment.y) {
        return true;
      }
    }
  }
  return false;
};

const generateFoodPosition = (snakes: Snake[], foods: Food[]): Point | null => {
  const maxAttempts = 100;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const x = Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)) * GRID_SIZE;
    const y = Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)) * GRID_SIZE;
    const pos = { x, y };

    if (!isPositionOccupied(pos, snakes)) {
      const isOnFood = foods.some(f => f.position.x === x && f.position.y === y);
      if (!isOnFood) {
        return pos;
      }
    }
    attempts++;
  }
  return null;
};

const generateFoods = (): void => {
  const state = getGameState();
  const { snakes, foods } = state;

  if (foods.length >= MAX_FOODS) return;

  const newFoods: Food[] = [...foods];

  while (newFoods.length < MAX_FOODS) {
    const position = generateFoodPosition(snakes, newFoods);
    if (!position) break;

    const newFood: Food = {
      id: uuidv4(),
      position,
      scale: 0,
      createdAt: Date.now(),
    };
    newFoods.push(newFood);
  }

  if (newFoods.length !== foods.length) {
    setGameState({ foods: newFoods });
  }
};

const updateFoodScales = (): void => {
  const state = getGameState();
  const { foods } = state;
  const now = Date.now();

  const updatedFoods = foods.map(food => {
    const elapsed = now - food.createdAt;
    const scale = Math.min(1, elapsed / FOOD_SCALE_ANIMATION_DURATION);
    return { ...food, scale };
  });

  const hasChanges = updatedFoods.some((f, i) => f.scale !== foods[i].scale);
  if (hasChanges) {
    setGameState({ foods: updatedFoods });
  }
};

const checkFoodConsumption = (): void => {
  const state = getGameState();
  const { snakes, foods } = state;

  let updatedSnakes = [...snakes];
  let updatedFoods = [...foods];
  let hasChanges = false;
  const newEffects: EatFoodEffect[] = [];

  for (let i = updatedSnakes.length - 1; i >= 0; i--) {
    const snake = updatedSnakes[i];
    if (!snake.alive) continue;

    const head = snake.body[0];

    for (let j = updatedFoods.length - 1; j >= 0; j--) {
      const food = updatedFoods[j];

      if (head.x === food.position.x && head.y === food.position.y) {
        const grownSnake = growSnake(snake);
        updatedSnakes[i] = {
          ...grownSnake,
          score: snake.score + SCORE_PER_FOOD,
        };

        const effect: EatFoodEffect = {
          id: uuidv4(),
          position: { ...head },
          createdAt: Date.now(),
          snakeColor: snake.color,
        };
        newEffects.push(effect);

        updatedFoods.splice(j, 1);
        hasChanges = true;
        break;
      }
    }
  }

  if (hasChanges) {
    const currentEffects = state.eatFoodEffects || [];
    setGameState({
      snakes: updatedSnakes,
      foods: updatedFoods,
      eatFoodEffects: [...currentEffects, ...newEffects],
    });
  }
};

const updateEatFoodEffects = (): void => {
  const state = getGameState();
  const { eatFoodEffects } = state;
  if (!eatFoodEffects || eatFoodEffects.length === 0) return;

  const now = Date.now();
  const validEffects = eatFoodEffects.filter(
    (e) => now - e.createdAt < EAT_FOOD_EFFECT_DURATION
  );

  if (validEffects.length !== eatFoodEffects.length) {
    setGameState({ eatFoodEffects: validEffects });
  }
};

const updateDeathAnimations = (): void => {
  const state = getGameState();
  const { snakes } = state;

  const now = Date.now();
  const updatedSnakes = snakes.map(snake => {
    if (snake.alive) return snake;
    if (snake.deathOpacity !== undefined && snake.deathOpacity <= 0) return snake;

    const deathTime = snake.lastTurnTime || now;
    const elapsed = now - deathTime;
    const opacity = Math.max(0, 1 - elapsed / DEATH_ANIMATION_DURATION);

    return { ...snake, deathOpacity: opacity };
  });

  const hasChanges = updatedSnakes.some((s, i) => s.deathOpacity !== snakes[i].deathOpacity);
  if (hasChanges) {
    setGameState({ snakes: updatedSnakes });
  }
};

const checkGameEnd = (): void => {
  const state = getGameState();
  const { snakes, gameStage } = state;

  if (gameStage !== 'playing') return;

  const aliveSnakes = snakes.filter(s => s.alive);

  if (aliveSnakes.length <= 1) {
    const winnerId = aliveSnakes.length === 1 ? aliveSnakes[0].id : null;
    setGameState({
      gameStage: 'ended',
      winnerId,
    });
    stopLoop();
  }
};

const gameFrame = (timestamp: number): void => {
  if (!isRunning) return;

  const elapsed = timestamp - lastFrameTime;

  if (elapsed >= FRAME_INTERVAL - 10) {
    const logicStart = performance.now();

    handleAITurns();
    moveAllSnakes();
    checkAllCollisions();
    checkFoodConsumption();
    generateFoods();
    checkGameEnd();

    const logicEnd = performance.now();
    const logicDuration = logicEnd - logicStart;

    if (logicDuration > 5) {
      console.warn(`Logic processing took ${logicDuration.toFixed(2)}ms, exceeding 5ms limit`);
    }

    lastFrameTime = timestamp;
  }

  updateFoodScales();
  updateDeathAnimations();
  updateEatFoodEffects();
  render(canvasRef);

  animationFrameId = requestAnimationFrame(gameFrame);
};

export const startLoop = (canvas: HTMLCanvasElement | null): void => {
  if (isRunning) return;

  canvasRef = canvas;
  isRunning = true;
  lastFrameTime = performance.now();

  setGameState({ gameStage: 'playing' });

  generateFoods();
  forceRender(canvasRef);

  animationFrameId = requestAnimationFrame(gameFrame);
};

export const stopLoop = (): void => {
  isRunning = false;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

export const endGame = (): void => {
  stopLoop();
  setGameState({ gameStage: 'ended' });
};

export const resetGame = (): void => {
  stopLoop();
  const state = getGameState();
  state.resetGame();
  forceRender(canvasRef);
};

export const getAlivePlayerCount = (): number => {
  const state = getGameState();
  return state.snakes.filter(s => s.alive).length;
};

export const isGameRunning = (): boolean => {
  return isRunning;
};
