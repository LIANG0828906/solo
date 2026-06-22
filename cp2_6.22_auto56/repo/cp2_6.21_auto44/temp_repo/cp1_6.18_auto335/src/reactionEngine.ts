import type {
  Molecule,
  GridState,
  ReactionResult,
  ReactionType,
  RateStatus,
  MoleculeColor,
} from './types';
import { GRID_SIZE, NORMAL_INTERVAL, ACCELERATED_INTERVAL, STOPPED_INTERVAL } from './types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function countMolecules(molecules: Molecule[]): { A: number; B: number; C: number } {
  return molecules.reduce(
    (acc, mol) => {
      acc[mol.color]++;
      return acc;
    },
    { A: 0, B: 0, C: 0 }
  );
}

export function calculateEquilibriumConstant(counts: {
  A: number;
  B: number;
}): number {
  if (counts.A === 0) return 0;
  return Math.pow(counts.B, 2) / counts.A;
}

export function calculateRateStatus(countC: number): {
  status: RateStatus;
  interval: number;
} {
  if (countC > 5) {
    return { status: 'stopped', interval: STOPPED_INTERVAL };
  }
  if (countC >= 2 && countC <= 4) {
    return { status: 'accelerated', interval: ACCELERATED_INTERVAL };
  }
  return { status: 'normal', interval: NORMAL_INTERVAL };
}

export function isAdjacent(x1: number, y1: number, x2: number, y2: number): boolean {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

function findAdjacentPair(molecules: Molecule[], color: MoleculeColor): [Molecule, Molecule] | null {
  const filtered = molecules.filter((m) => m.color === color && !m.isAnimating);
  for (let i = 0; i < filtered.length; i++) {
    for (let j = i + 1; j < filtered.length; j++) {
      if (isAdjacent(filtered[i].x, filtered[i].y, filtered[j].x, filtered[j].y)) {
        return [filtered[i], filtered[j]];
      }
    }
  }
  return null;
}

function findEmptyAdjacentCell(
  x: number,
  y: number,
  molecules: Molecule[]
): { x: number; y: number } | null {
  const directions = [
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
  ];

  for (const dir of directions) {
    const nx = x + dir.dx;
    const ny = y + dir.dy;
    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
      const occupied = molecules.some((m) => m.x === nx && m.y === ny);
      if (!occupied) {
        return { x: nx, y: ny };
      }
    }
  }
  return null;
}

function findEmptyCell(molecules: Molecule[]): { x: number; y: number } | null {
  const occupied = new Set(molecules.map((m) => `${m.x},${m.y}`));
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!occupied.has(`${x},${y}`)) {
        return { x, y };
      }
    }
  }
  return null;
}

export function checkForwardReaction(grid: GridState): boolean {
  const counts = countMolecules(grid.molecules);
  if (counts.A <= 10) return false;
  return findAdjacentPair(grid.molecules, 'A') !== null;
}

export function checkReverseReaction(grid: GridState): boolean {
  const counts = countMolecules(grid.molecules);
  if (counts.B <= 8) return false;
  return grid.molecules.some((m) => m.color === 'B' && !m.isAnimating);
}

export function processForwardReaction(grid: GridState): ReactionResult {
  const pair = findAdjacentPair(grid.molecules, 'A');
  if (!pair) {
    return { newGrid: grid, reactionType: 'none' };
  }

  const [a1, a2] = pair;
  const animatingMolecules = grid.molecules.map((m) =>
    m.id === a1.id || m.id === a2.id ? { ...m, isAnimating: true, animationType: 'forward' as const } : m
  );

  return {
    newGrid: { ...grid, molecules: animatingMolecules },
    reactionType: 'forward',
  };
}

export function completeForwardReaction(grid: GridState, pairIds: [string, string]): GridState {
  const [id1, id2] = pairIds;
  const mol1 = grid.molecules.find((m) => m.id === id1);
  const mol2 = grid.molecules.find((m) => m.id === id2);

  if (!mol1 || !mol2) return grid;

  const remaining = grid.molecules.filter((m) => m.id !== id1 && m.id !== id2);
  const newB: Molecule = {
    id: generateId(),
    color: 'B',
    x: mol1.x,
    y: mol1.y,
    isAnimating: false,
  };

  return { ...grid, molecules: [...remaining, newB] };
}

export function processReverseReaction(grid: GridState): ReactionResult {
  const bMolecule = grid.molecules.find((m) => m.color === 'B' && !m.isAnimating);
  if (!bMolecule) {
    return { newGrid: grid, reactionType: 'none' };
  }

  const animatingMolecules = grid.molecules.map((m) =>
    m.id === bMolecule.id ? { ...m, isAnimating: true, animationType: 'reverse' as const } : m
  );

  return {
    newGrid: { ...grid, molecules: animatingMolecules },
    reactionType: 'reverse',
  };
}

export function completeReverseReaction(grid: GridState, bId: string): GridState {
  const bMol = grid.molecules.find((m) => m.id === bId);
  if (!bMol) return grid;

  const remaining = grid.molecules.filter((m) => m.id !== bId);

  const pos1 = { x: bMol.x, y: bMol.y };
  const pos2 = findEmptyAdjacentCell(bMol.x, bMol.y, remaining) || findEmptyCell(remaining);

  if (!pos2) return grid;

  const newA1: Molecule = {
    id: generateId(),
    color: 'A',
    x: pos1.x,
    y: pos1.y,
    isAnimating: false,
  };

  const newA2: Molecule = {
    id: generateId(),
    color: 'A',
    x: pos2.x,
    y: pos2.y,
    isAnimating: false,
  };

  return { ...grid, molecules: [...remaining, newA1, newA2] };
}

export function initializeGrid(): GridState {
  const molecules: Molecule[] = [];
  const occupied = new Set<string>();

  function getRandomPos(): { x: number; y: number } {
    let x: number, y: number;
    do {
      x = Math.floor(Math.random() * GRID_SIZE);
      y = Math.floor(Math.random() * GRID_SIZE);
    } while (occupied.has(`${x},${y}`));
    occupied.add(`${x},${y}`);
    return { x, y };
  }

  const countA = Math.floor(Math.random() * 3) + 6;
  const countB = Math.floor(Math.random() * 3) + 6;
  const countC = Math.floor(Math.random() * 3) + 6;

  for (let i = 0; i < countA; i++) {
    const pos = getRandomPos();
    molecules.push({ id: generateId(), color: 'A', x: pos.x, y: pos.y });
  }

  for (let i = 0; i < countB; i++) {
    const pos = getRandomPos();
    molecules.push({ id: generateId(), color: 'B', x: pos.x, y: pos.y });
  }

  for (let i = 0; i < countC; i++) {
    const pos = getRandomPos();
    molecules.push({ id: generateId(), color: 'C', x: pos.x, y: pos.y });
  }

  return { molecules, gridSize: GRID_SIZE };
}

export function processReactionTick(
  grid: GridState,
  rateStatus: RateStatus
): ReactionResult {
  if (rateStatus === 'stopped') {
    return { newGrid: grid, reactionType: 'catalyst-poisoning', message: '催化剂中毒，反应停摆' };
  }

  if (checkForwardReaction(grid)) {
    return processForwardReaction(grid);
  }

  if (checkReverseReaction(grid)) {
    return processReverseReaction(grid);
  }

  return { newGrid: grid, reactionType: 'none' };
}
