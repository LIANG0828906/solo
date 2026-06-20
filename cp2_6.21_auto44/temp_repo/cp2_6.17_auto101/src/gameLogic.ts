import { v4 as uuidv4 } from 'uuid';
import {
  Card,
  Sprite,
  GridCell,
  ElementType,
  Owner,
  GameState,
  Particle,
  GRID_SIZE,
  PLAYER_ROWS,
  ENEMY_ROWS,
  ELEMENT_COLORS,
  ELEMENT_NAMES,
} from './types';

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const createEmptyGrid = (): GridCell[][] => {
  const grid: GridCell[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: GridCell[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({ x, y, spriteId: null });
    }
    grid.push(row);
  }
  return grid;
};

export const createCard = (element?: ElementType): Card => {
  const elements: ElementType[] = ['fire', 'water', 'nature'];
  const el = element ?? elements[randomInt(0, 2)];
  return {
    id: uuidv4(),
    element: el,
    name: ELEMENT_NAMES[el],
    attack: randomInt(3, 8),
    health: randomInt(10, 20),
  };
};

export const createInitialHand = (count = 3): Card[] => {
  return Array.from({ length: count }, () => createCard());
};

export const createSprite = (
  card: Card,
  gridX: number,
  gridY: number,
  owner: Owner
): Sprite => {
  return {
    id: uuidv4(),
    element: card.element,
    owner,
    attack: card.attack,
    maxHealth: card.health,
    currentHealth: card.health,
    gridX,
    gridY,
    isAppearing: true,
    isShaking: false,
    isFading: false,
    particles: [],
  };
};

export const canPlaceSprite = (
  grid: GridCell[][],
  x: number,
  y: number,
  owner: Owner
): boolean => {
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
  if (grid[y][x].spriteId !== null) return false;
  const validRows = owner === 'player' ? PLAYER_ROWS : ENEMY_ROWS;
  return validRows.includes(y);
};

export const getManhattanDistance = (a: Sprite, b: Sprite): number => {
  return Math.abs(a.gridX - b.gridX) + Math.abs(a.gridY - b.gridY);
};

export const findNearestEnemy = (
  sprite: Sprite,
  sprites: Sprite[]
): Sprite | null => {
  const enemies = sprites.filter(
    (s) => s.owner !== sprite.owner && s.currentHealth > 0 && !s.isFading
  );
  if (enemies.length === 0) return null;

  let nearest = enemies[0];
  let minDist = getManhattanDistance(sprite, nearest);

  for (const enemy of enemies.slice(1)) {
    const dist = getManhattanDistance(sprite, enemy);
    if (dist < minDist) {
      minDist = dist;
      nearest = enemy;
    }
  }

  return nearest;
};

export const getNextMoveTowards = (
  sprite: Sprite,
  target: Sprite,
  grid: GridCell[][]
): { x: number; y: number } | null => {
  const dx = target.gridX - sprite.gridX;
  const dy = target.gridY - sprite.gridY;

  const moves: { x: number; y: number; priority: number }[] = [];

  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx !== 0) moves.push({ x: sprite.gridX + Math.sign(dx), y: sprite.gridY, priority: 1 });
    if (dy !== 0) moves.push({ x: sprite.gridX, y: sprite.gridY + Math.sign(dy), priority: 2 });
  } else {
    if (dy !== 0) moves.push({ x: sprite.gridX, y: sprite.gridY + Math.sign(dy), priority: 1 });
    if (dx !== 0) moves.push({ x: sprite.gridX + Math.sign(dx), y: sprite.gridY, priority: 2 });
  }

  for (const move of moves) {
    if (
      move.x >= 0 &&
      move.x < GRID_SIZE &&
      move.y >= 0 &&
      move.y < GRID_SIZE &&
      grid[move.y][move.x].spriteId === null
    ) {
      return { x: move.x, y: move.y };
    }
  }

  return null;
};

export const areSpritesAdjacent = (a: Sprite, b: Sprite): boolean => {
  const dx = Math.abs(a.gridX - b.gridX);
  const dy = Math.abs(a.gridY - b.gridY);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
};

const createCollisionParticles = (element: ElementType): Particle[] => {
  const color = ELEMENT_COLORS[element].primary;
  const particles: Particle[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    const speed = 2 + Math.random() * 2;
    particles.push({
      id: uuidv4(),
      x: 0,
      y: 0,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      radius: 2 + Math.random() * 2,
      life: 1,
    });
  }
  return particles;
};

export const resolveCollision = (
  a: Sprite,
  b: Sprite
): { a: Sprite; b: Sprite } => {
  const newA: Sprite = {
    ...a,
    currentHealth: Math.max(0, a.currentHealth - b.attack),
    isShaking: true,
    particles: [...a.particles, ...createCollisionParticles(a.element)],
  };
  const newB: Sprite = {
    ...b,
    currentHealth: Math.max(0, b.currentHealth - a.attack),
    isShaking: true,
    particles: [...b.particles, ...createCollisionParticles(b.element)],
  };
  return { a: newA, b: newB };
};

export const moveAllSprites = (
  sprites: Sprite[],
  grid: GridCell[][]
): { sprites: Sprite[]; grid: GridCell[][] } => {
  const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
  const spriteMap = new Map(sprites.map((s) => [s.id, { ...s }]));
  const aliveSprites = sprites.filter((s) => s.currentHealth > 0 && !s.isFading);

  const orderedSprites = [...aliveSprites].sort((a, b) => {
    if (a.owner !== b.owner) return a.owner === 'player' ? -1 : 1;
    return 0;
  });

  for (const sprite of orderedSprites) {
    const current = spriteMap.get(sprite.id)!;
    if (current.currentHealth <= 0 || current.isFading) continue;

    const nearest = findNearestEnemy(current, Array.from(spriteMap.values()));
    if (!nearest) continue;

    if (areSpritesAdjacent(current, nearest)) {
      const { a, b } = resolveCollision(current, nearest);
      spriteMap.set(current.id, a);
      spriteMap.set(nearest.id, b);
      continue;
    }

    const nextMove = getNextMoveTowards(current, nearest, newGrid);
    if (nextMove) {
      newGrid[current.gridY][current.gridX].spriteId = null;
      newGrid[nextMove.y][nextMove.x].spriteId = current.id;
      spriteMap.set(current.id, {
        ...current,
        gridX: nextMove.x,
        gridY: nextMove.y,
      });

      const updatedCurrent = spriteMap.get(current.id)!;
      const updatedNearest = spriteMap.get(nearest.id)!;
      if (areSpritesAdjacent(updatedCurrent, updatedNearest)) {
        const { a, b } = resolveCollision(updatedCurrent, updatedNearest);
        spriteMap.set(current.id, a);
        spriteMap.set(nearest.id, b);
      }
    }
  }

  for (const [id, sprite] of spriteMap) {
    if (sprite.currentHealth <= 0 && !sprite.isFading) {
      spriteMap.set(id, { ...sprite, isFading: true });
    }
  }

  const newSprites = Array.from(spriteMap.values());
  return { sprites: newSprites, grid: newGrid };
};

export const clearFadedSprites = (
  sprites: Sprite[],
  grid: GridCell[][]
): { sprites: Sprite[]; grid: GridCell[][] } => {
  const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
  const fadedIds = new Set<string>();

  for (const sprite of sprites) {
    if (sprite.isFading) {
      fadedIds.add(sprite.id);
      if (
        newGrid[sprite.gridY] &&
        newGrid[sprite.gridY][sprite.gridX] &&
        newGrid[sprite.gridY][sprite.gridX].spriteId === sprite.id
      ) {
        newGrid[sprite.gridY][sprite.gridX].spriteId = null;
      }
    }
  }

  return {
    sprites: sprites.filter((s) => !fadedIds.has(s.id)),
    grid: newGrid,
  };
};

export const resetSpriteAnimations = (sprites: Sprite[]): Sprite[] => {
  return sprites.map((s) => ({
    ...s,
    isAppearing: false,
    isShaking: false,
    particles: [],
  }));
};

export const placeCardOnBoard = (
  state: GameState,
  cardId: string,
  x: number,
  y: number
): GameState | null => {
  const card = state.hand.find((c) => c.id === cardId);
  if (!card) return null;

  if (state.playerGold < 2) return null;

  if (!canPlaceSprite(state.grid, x, y, 'player')) return null;

  const sprite = createSprite(card, x, y, 'player');

  const newGrid = state.grid.map((row) => row.map((cell) => ({ ...cell })));
  newGrid[y][x].spriteId = sprite.id;

  return {
    ...state,
    hand: state.hand.filter((c) => c.id !== cardId),
    grid: newGrid,
    sprites: [...state.sprites, sprite],
    playerGold: state.playerGold - 2,
  };
};

export const placeEnemyCards = (state: GameState): GameState => {
  let newState = { ...state };
  let goldRemaining = newState.enemyGold;

  const availableCells: { x: number; y: number }[] = [];
  for (const y of ENEMY_ROWS) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (newState.grid[y][x].spriteId === null) {
        availableCells.push({ x, y });
      }
    }
  }

  while (goldRemaining >= 2 && availableCells.length > 0) {
    const cellIndex = randomInt(0, availableCells.length - 1);
    const cell = availableCells.splice(cellIndex, 1)[0];

    const card = createCard();
    const sprite = createSprite(card, cell.x, cell.y, 'enemy');

    const newGrid = newState.grid.map((row) => row.map((c) => ({ ...c })));
    newGrid[cell.y][cell.x].spriteId = sprite.id;

    newState = {
      ...newState,
      grid: newGrid,
      sprites: [...newState.sprites, sprite],
      enemyGold: newState.enemyGold - 2,
    };
    goldRemaining -= 2;
  }

  return newState;
};

export const checkWinner = (sprites: Sprite[]): Owner | null => {
  const aliveSprites = sprites.filter((s) => s.currentHealth > 0 && !s.isFading);
  const hasPlayer = aliveSprites.some((s) => s.owner === 'player');
  const hasEnemy = aliveSprites.some((s) => s.owner === 'enemy');

  if (!hasPlayer && !hasEnemy) return null;
  if (!hasPlayer) return 'enemy';
  if (!hasEnemy) return 'player';
  return null;
};

export const drawCard = (): Card => createCard();

export const ensureHandSize = (hand: Card[], targetSize = 3): Card[] => {
  const newHand = [...hand];
  while (newHand.length < targetSize) {
    newHand.push(drawCard());
  }
  return newHand;
};

export const updateParticles = (sprites: Sprite[]): Sprite[] => {
  return sprites.map((s) => ({
    ...s,
    particles: s.particles
      .map((p) => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        life: Math.max(0, p.life - 0.05),
      }))
      .filter((p) => p.life > 0),
  }));
};
