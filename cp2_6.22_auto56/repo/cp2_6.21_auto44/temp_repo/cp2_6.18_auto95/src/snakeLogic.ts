import type { Snake, Direction, Point } from './types';
import { CANVAS_SIZE, GRID_SIZE } from './types';
import { getGameState, setGameState } from './gameStore';

const DIRECTION_VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -GRID_SIZE },
  down: { x: 0, y: GRID_SIZE },
  left: { x: -GRID_SIZE, y: 0 },
  right: { x: GRID_SIZE, y: 0 },
};

const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export const moveSnake = (snake: Snake): Snake => {
  if (!snake.alive) return snake;

  const head = snake.body[0];
  const vector = DIRECTION_VECTORS[snake.direction];
  const newHead: Point = {
    x: head.x + vector.x,
    y: head.y + vector.y,
  };

  const newBody = [newHead, ...snake.body.slice(0, -1)];

  return { ...snake, body: newBody };
};

export const turnSnake = (snake: Snake, newDirection: Direction): Snake => {
  if (!snake.alive) return snake;
  if (newDirection === OPPOSITE_DIRECTIONS[snake.direction]) return snake;
  return { ...snake, direction: newDirection };
};

export const checkCollision = (snake: Snake, allSnakes: Snake[]): boolean => {
  if (!snake.alive) return false;

  const head = snake.body[0];

  if (head.x < 0 || head.x >= CANVAS_SIZE || head.y < 0 || head.y >= CANVAS_SIZE) {
    return true;
  }

  for (const otherSnake of allSnakes) {
    if (!otherSnake.alive) continue;

    const bodyToCheck = snake.id === otherSnake.id
      ? otherSnake.body.slice(1)
      : otherSnake.body;

    for (const segment of bodyToCheck) {
      if (head.x === segment.x && head.y === segment.y) {
        return true;
      }
    }
  }

  return false;
};

export const growSnake = (snake: Snake): Snake => {
  if (!snake.alive) return snake;

  const tail = snake.body[snake.body.length - 1];
  const newBody = [...snake.body, { ...tail }];

  return { ...snake, body: newBody };
};

export const moveAllSnakes = (): void => {
  const state = getGameState();
  const updatedSnakes = state.snakes.map((snake) => moveSnake(snake));
  setGameState({ snakes: updatedSnakes });
};

export const checkAllCollisions = (): void => {
  const state = getGameState();
  const { snakes } = state;

  const updatedSnakes = snakes.map((snake) => {
    if (!snake.alive) return snake;

    const collided = checkCollision(snake, snakes);
    if (collided) {
      return {
        ...snake,
        alive: false,
        deathOpacity: 1,
      };
    }
    return snake;
  });

  setGameState({ snakes: updatedSnakes });
};

export const handlePlayerTurn = (direction: Direction): void => {
  const state = getGameState();
  const playerSnake = state.snakes.find((s) => s.isPlayer);

  if (!playerSnake || !playerSnake.alive) return;

  const updatedSnake = turnSnake(playerSnake, direction);
  if (updatedSnake.direction !== playerSnake.direction) {
    setGameState({
      snakes: state.snakes.map((s) =>
        s.id === playerSnake.id ? updatedSnake : s
      ),
    });
  }
};

export const handleAITurns = (): void => {
  const state = getGameState();
  const now = Date.now();

  const updatedSnakes = state.snakes.map((snake) => {
    if (snake.isPlayer || !snake.alive) return snake;

    const lastTurn = snake.lastTurnTime || 0;
    const turnInterval = 2000 + Math.random() * 1000;

    if (now - lastTurn < turnInterval) return snake;

    const directions: Direction[] = ['up', 'down', 'left', 'right'];
    const availableDirections = directions.filter(
      (d) => d !== OPPOSITE_DIRECTIONS[snake.direction]
    );

    const newDirection = availableDirections[
      Math.floor(Math.random() * availableDirections.length)
    ];

    return {
      ...snake,
      direction: newDirection,
      lastTurnTime: now,
    };
  });

  setGameState({ snakes: updatedSnakes });
};
