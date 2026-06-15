import type { Position, Piece, Particle } from '../types/game';
import {
  BOARD_SIZE,
  MERCURY_POOL,
  BOI_POSITIONS,
  COLORS,
} from './constants';

export const isInMercuryPool = (pos: Position): boolean => {
  return (
    pos.x >= MERCURY_POOL.x &&
    pos.x < MERCURY_POOL.x + MERCURY_POOL.width &&
    pos.y >= MERCURY_POOL.y &&
    pos.y < MERCURY_POOL.y + MERCURY_POOL.height
  );
};

export const isBoiPosition = (pos: Position): boolean => {
  return BOI_POSITIONS.some((p) => p.x === pos.x && p.y === pos.y);
};

export const isValidPosition = (pos: Position): boolean => {
  return pos.x >= 0 && pos.x < BOARD_SIZE && pos.y >= 0 && pos.y < BOARD_SIZE;
};

export const getManhattanDistance = (a: Position, b: Position): number => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};

export const getValidMoves = (
  piece: Piece,
  steps: number,
  pieces: Piece[]
): Position[] => {
  if (steps <= 0) return [];

  const moves: Position[] = [];
  const { x, y } = piece.position;
  const occupiedPositions = new Set(
    pieces
      .filter((p) => p.id !== piece.id)
      .map((p) => `${p.position.x},${p.position.y}`)
  );

  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];

  for (const dir of directions) {
    let blocked = false;
    for (let s = 1; s <= steps; s++) {
      const newX = x + dir.dx * s;
      const newY = y + dir.dy * s;
      const pos = { x: newX, y: newY };

      if (!isValidPosition(pos)) {
        blocked = true;
        break;
      }

      if (occupiedPositions.has(`${newX},${newY}`)) {
        blocked = true;
        break;
      }

      if (piece.size === 2) {
        const tailX = newX - dir.dx;
        const tailY = newY - dir.dy;
        if (s === 1) {
          continue;
        }
        if (s > 1) {
          if (
            occupiedPositions.has(`${tailX},${tailY}`) ||
            !isValidPosition({ x: tailX, y: tailY })
          ) {
            blocked = true;
            break;
          }
        }
      }

      if (!blocked) {
        moves.push(pos);
      }
    }
  }

  return moves;
};

export const createSplashParticles = (
  centerX: number,
  centerY: number
): Particle[] => {
  const particles: Particle[] = [];
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4;
    particles.push({
      id: Date.now() + i,
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      life: 500,
      maxLife: 500,
      color: COLORS.silver,
      size: 2,
    });
  }
  return particles;
};

export const createZhuFlyAnimation = () => {
  return {
    flyX: (Math.random() - 0.5) * 200,
    flyY: -100 - Math.random() * 100,
    rotation: Math.random() * 720 - 360,
  };
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};
