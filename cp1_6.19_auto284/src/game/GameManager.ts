import { BattleCell, Unit, PlayerSide, TerrainType, Player, GameState, ReplayAction, Deck } from '../types';
import { getCardById } from '../data/cards';

export const BOARD_SIZE = 6;
const TURN_DURATION = 60;
const MAX_MANA = 10;

export const createInitialBoard = (terrainOverride?: TerrainType[][]): BattleCell[][] => {
  const board: BattleCell[][] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    const row: BattleCell[] = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
      row.push({
        x,
        y,
        terrain: terrainOverride?.[y]?.[x] || 'empty',
        unit: undefined
      });
    }
    board.push(row);
  }
  return board;
};

export const getNeighbors = (x: number, y: number): { x: number; y: number }[] => {
  const isOdd = y % 2 === 1;
  const offsets = isOdd
    ? [[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]]
    : [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]];

  return offsets
    .map(([dx, dy]) => ({ x: x + dx, y: y + dy }))
    .filter(n => n.x >= 0 && n.x < BOARD_SIZE && n.y >= 0 && n.y < BOARD_SIZE);
};

export const hexDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  const toCube = (x: number, y: number) => {
    const cx = x - Math.floor(y / 2);
    const cz = y;
    const cy = -cx - cz;
    return { cx, cy, cz };
  };
  const a = toCube(x1, y1);
  const b = toCube(x2, y2);
  return Math.max(Math.abs(a.cx - b.cx), Math.abs(a.cy - b.cy), Math.abs(a.cz - b.cz));
};

export interface PathResult {
  path: { x: number; y: number }[];
  distance: number;
}

export const findPath = (
  board: BattleCell[][],
  start: { x: number; y: number },
  end: { x: number; y: number },
  maxDistance: number,
  forUnitOwner: PlayerSide
): PathResult | null => {
  if (start.x === end.x && start.y === end.y) {
    return { path: [start], distance: 0 };
  }

  const isBlocked = (x: number, y: number, isEnd: boolean) => {
    const cell = board[y]?.[x];
    if (!cell) return true;
    if (cell.terrain === 'rock' || cell.terrain === 'fence') return true;
    if (isEnd) return false;
    if (cell.unit) return true;
    return false;
  };

  const visited = new Set<string>();
  const queue: Array<{ pos: { x: number; y: number }; dist: number; path: { x: number; y: number }[] }> = [
    { pos: start, dist: 0, path: [start] }
  ];
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.dist >= maxDistance) continue;

    for (const neighbor of getNeighbors(current.pos.x, current.pos.y)) {
      const key = `${neighbor.x},${neighbor.y}`;
      if (visited.has(key)) continue;

      const isTarget = neighbor.x === end.x && neighbor.y === end.y;
      if (isBlocked(neighbor.x, neighbor.y, isTarget)) {
        if (!isTarget) continue;
      }

      visited.add(key);
      const newPath = [...current.path, neighbor];
      if (isTarget) {
        return { path: newPath, distance: current.dist + 1 };
      }
      queue.push({ pos: neighbor, dist: current.dist + 1, path: newPath });
    }
  }

  return null;
};

export const findNearestEnemy = (
  board: BattleCell[][],
  unit: Unit
): { x: number; y: number; unit: Unit } | null => {
  let nearest: { x: number; y: number; unit: Unit; dist: number } | null = null;

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const cell = board[y][x];
      if (cell.unit && cell.unit.owner !== unit.owner) {
        const dist = hexDistance(unit.position.x, unit.position.y, x, y);
        if (!nearest || dist < nearest.dist) {
          nearest = { x, y, unit: cell.unit, dist };
        }
      }
    }
  }

  return nearest;
};

export const createInitialPlayer = (
  side: PlayerSide,
  deck: Deck,
  playerId: string,
  name: string
): Player => {
  const expandedDeck: string[] = [];
  deck.cards.forEach(dc => {
    for (let i = 0; i < dc.count; i++) {
      expandedDeck.push(dc.cardId);
    }
  });

  const shuffled = [...expandedDeck].sort(() => Math.random() - 0.5);
  const hand = shuffled.slice(0, 4);

  return {
    id: playerId,
    name,
    side,
    deck,
    hand,
    mana: 1,
    maxMana: 1,
    health: 30
  };
};

export const createUnitFromCard = (
  cardId: string,
  owner: PlayerSide,
  position: { x: number; y: number }
): Unit | null => {
  const card = getCardById(cardId);
  if (!card || card.type !== 'unit') return null;

  return {
    id: `unit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    cardId,
    owner,
    position: { ...position },
    currentHealth: card.health || 1,
    maxHealth: card.health ||