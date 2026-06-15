import { v4 as uuidv4 } from 'uuid';
import {
  Direction,
  ItemType,
  Position,
  SnakeSegment,
  Item,
  GameState,
  GRID_SIZE,
  INITIAL_SNAKE_LENGTH,
  SPEED_BUFF_DURATION,
  TRAIL_DURATION,
  BORDER_FLASH_DURATION,
  GROWTH_QUOTES,
} from './types';

export function createInitialSnake(): SnakeSegment[] {
  const startX = Math.floor(GRID_SIZE / 2);
  const startY = Math.floor(GRID_SIZE / 2);
  const snake: SnakeSegment[] = [];
  for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
    snake.push({ id: uuidv4(), x: startX - i, y: startY });
  }
  return snake;
}

export function getRandomPosition(): Position {
  return {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  };
}

export function isPositionOccupied(pos: Position, snake: SnakeSegment[], items: Item[]): boolean {
  if (snake.some((seg) => seg.x === pos.x && seg.y === pos.y)) return true;
  if (items.some((item) => item.position.x === pos.x && item.position.y === pos.y)) return true;
  return false;
}

export function getRandomItemType(): ItemType {
  const rand = Math.random();
  if (rand < 0.5) return ItemType.ENERGY;
  if (rand < 0.8) return ItemType.SPEED;
  return ItemType.SHIELD;
}

export function spawnItem(snake: SnakeSegment[], items: Item[]): Item | null {
  let attempts = 0;
  while (attempts < 100) {
    const pos = getRandomPosition();
    if (!isPositionOccupied(pos, snake, items)) {
      return {
        id: uuidv4(),
        type: getRandomItemType(),
        position: pos,
      };
    }
    attempts++;
  }
  return null;
}

export function ensureItemCount(snake: SnakeSegment[], items: Item[], targetCount: number): Item[] {
  const newItems = [...items];
  while (newItems.length < targetCount) {
    const item = spawnItem(snake, newItems);
    if (item) newItems.push(item);
    else break;
  }
  return newItems;
}

export function getNextHead(head: Position, direction: Direction): Position {
  switch (direction) {
    case Direction.UP:
      return { x: head.x, y: head.y - 1 };
    case Direction.DOWN:
      return { x: head.x, y: head.y + 1 };
    case Direction.LEFT:
      return { x: head.x - 1, y: head.y };
    case Direction.RIGHT:
      return { x: head.x + 1, y: head.y };
  }
}

export function isOutOfBounds(pos: Position): boolean {
  return pos.x < 0 || pos.x >= GRID_SIZE || pos.y < 0 || pos.y >= GRID_SIZE;
}

export function isOppositeDirection(dir1: Direction, dir2: Direction): boolean {
  return (
    (dir1 === Direction.UP && dir2 === Direction.DOWN) ||
    (dir1 === Direction.DOWN && dir2 === Direction.UP) ||
    (dir1 === Direction.LEFT && dir2 === Direction.RIGHT) ||
    (dir1 === Direction.RIGHT && dir2 === Direction.LEFT)
  );
}

export function checkSelfCollision(snake: SnakeSegment[], head: Position): SnakeSegment | null {
  for (let i = 1; i < snake.length; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) {
      return snake[i];
    }
  }
  return null;
}

export function checkItemCollision(head: Position, items: Item[]): Item | null {
  return items.find((item) => item.position.x === head.x && item.position.y === head.y) || null;
}

export function getRandomQuote(): string {
  return GROWTH_QUOTES[Math.floor(Math.random() * GROWTH_QUOTES.length)];
}

export function createInitialState(highScore: number): GameState {
  const snake = createInitialSnake();
  const items: Item[] = [];
  const populatedItems = ensureItemCount(snake, items, 3);

  return {
    snake,
    direction: Direction.RIGHT,
    nextDirection: Direction.RIGHT,
    items: populatedItems,
    trail: [],
    score: 0,
    isGameOver: false,
    isPaused: false,
    speedBuff: { active: false, endTime: 0 },
    shieldBuff: { count: 0 },
    highScore,
    borderFlash: false,
    lastBorderHitTime: 0,
    gameStartTime: Date.now(),
  };
}

export interface TickResult {
  newState: GameState;
  collisionPoint?: Position | null;
  ateItem?: Item | null;
  hitBorder?: boolean;
}

export function gameTick(state: GameState, now: number): TickResult {
  if (state.isGameOver || state.isPaused) {
    return { newState: state, collisionPoint: null, ateItem: null, hitBorder: false };
  }

  let newState: GameState = { ...state };
  let collisionPoint: Position | null = null;
  let ateItem: Item | null = null;
  let hitBorder = false;

  const speedActive = state.speedBuff.active && now < state.speedBuff.endTime;
  if (!speedActive && state.speedBuff.active) {
    newState.speedBuff = { active: false, endTime: 0 };
  }

  newState.direction = state.nextDirection;
  const head = state.snake[0];
  const nextHead = getNextHead(head, newState.direction);

  const newTrail = [...state.trail, { x: head.x, y: head.y, timestamp: now }].filter(
    (t) => now - t.timestamp < TRAIL_DURATION
  );
  newState.trail = newTrail;

  if (isOutOfBounds(nextHead)) {
    hitBorder = true;
    newState.borderFlash = true;
    newState.lastBorderHitTime = now;

    if (newState.shieldBuff.count > 0) {
      newState.shieldBuff = { count: newState.shieldBuff.count - 1 };
    } else {
      if (newState.snake.length > 1) {
        newState.snake = newState.snake.slice(0, -1);
      }
    }

    return { newState, collisionPoint: null, ateItem: null, hitBorder: true };
  }

  if (state.borderFlash && now - state.lastBorderHitTime > BORDER_FLASH_DURATION) {
    newState.borderFlash = false;
  }

  const selfCollision = checkSelfCollision(state.snake, nextHead);
  if (selfCollision) {
    collisionPoint = { x: selfCollision.x, y: selfCollision.y };
    newState.isGameOver = true;
    newState.highScore = Math.max(newState.highScore, newState.score);
    return { newState, collisionPoint, ateItem: null, hitBorder: false };
  }

  const item = checkItemCollision(nextHead, state.items);
  const newSnake: SnakeSegment[] = [{ id: uuidv4(), x: nextHead.x, y: nextHead.y }, ...state.snake];

  if (item) {
    ateItem = item;
    newState.score += 1;
    newState.items = state.items.filter((i) => i.id !== item.id);
    newState.items = ensureItemCount(newSnake, newState.items, 3);

    switch (item.type) {
      case ItemType.ENERGY:
        newSnake.push({ id: uuidv4(), x: newSnake[newSnake.length - 1].x, y: newSnake[newSnake.length - 1].y });
        break;
      case ItemType.SPEED:
        newState.speedBuff = { active: true, endTime: now + SPEED_BUFF_DURATION };
        newSnake.pop();
        break;
      case ItemType.SHIELD:
        newState.shieldBuff = { count: newState.shieldBuff.count + 1 };
        newSnake.pop();
        break;
    }
  } else {
    newSnake.pop();
  }

  newState.snake = newSnake;
  return { newState, collisionPoint, ateItem, hitBorder };
}
