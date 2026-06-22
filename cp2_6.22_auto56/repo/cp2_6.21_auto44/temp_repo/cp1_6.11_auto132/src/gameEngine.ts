export type ElementType = 'fire' | 'water' | 'earth' | 'wind';
export type PlayerId = 1 | 2;

export interface HexCoord {
  q: number;
  r: number;
}

export interface HexCell {
  coord: HexCoord;
  owner: PlayerId | null;
  element: ElementType | null;
  level: number;
}

export interface PlayerState {
  id: PlayerId;
  score: number;
  energy: number;
  maxEnergy: number;
  actionPoints: number;
  maxActionPoints: number;
  health: number;
  maxHealth: number;
  selectedElement: ElementType;
}

export interface TerritoryStats {
  fire: number;
  water: number;
  earth: number;
  wind: number;
  total: number;
}

export interface GameState {
  grid: HexCell[][];
  currentPlayer: PlayerId;
  players: { [key in PlayerId]: PlayerState };
  turn: number;
  isAnimating: boolean;
}

export interface ReactionResult {
  fusedCells: HexCoord[];
  explodedCells: HexCoord[];
  scoreChange: { [key in PlayerId]: number };
}

const GRID_SIZE = 12;

const ELEMENT_COUNTER: { [key in ElementType]: ElementType } = {
  fire: 'wind',
  wind: 'earth',
  earth: 'water',
  water: 'fire'
};

function getOpponent(player: PlayerId): PlayerId {
  return player === 1 ? 2 : 1;
}

function createCell(q: number, r: number): HexCell {
  return {
    coord: { q, r },
    owner: null,
    element: null,
    level: 0
  };
}

function createPlayerState(id: PlayerId): PlayerState {
  return {
    id,
    score: 0,
    energy: 10,
    maxEnergy: 10,
    actionPoints: 5,
    maxActionPoints: 5,
    health: 10,
    maxHealth: 10,
    selectedElement: 'fire'
  };
}

export function createInitialState(): GameState {
  const grid: HexCell[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const row: HexCell[] = [];
    for (let q = 0; q < GRID_SIZE; q++) {
      row.push(createCell(q, r));
    }
    grid.push(row);
  }

  return {
    grid,
    currentPlayer: 1,
    players: {
      1: createPlayerState(1),
      2: createPlayerState(2)
    },
    turn: 1,
    isAnimating: false
  };
}

export function getNeighbors(q: number, r: number): HexCoord[] {
  const neighbors: HexCoord[] = [];
  const directions = r % 2 === 0
    ? [
        { q: -1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: 1, r: 0 },
        { q: -1, r: 1 }, { q: 0, r: 1 }
      ]
    : [
        { q: 0, r: -1 }, { q: 1, r: -1 },
        { q: -1, r: 0 }, { q: 1, r: 0 },
        { q: 0, r: 1 }, { q: 1, r: 1 }
      ];

  for (const dir of directions) {
    const nq = q + dir.q;
    const nr = r + dir.r;
    if (nq >= 0 && nq < GRID_SIZE && nr >= 0 && nr < GRID_SIZE) {
      neighbors.push({ q: nq, r: nr });
    }
  }

  return neighbors;
}

export function canPlacePiece(state: GameState, q: number, r: number): boolean {
  if (q < 0 || q >= GRID_SIZE || r < 0 || r >= GRID_SIZE) return false;
  const cell = state.grid[r][q];
  return cell.owner === null && !state.isAnimating;
}

export function placePiece(
  state: GameState,
  q: number,
  r: number,
  element: ElementType,
  player: PlayerId
): ReactionResult {
  const result: ReactionResult = {
    fusedCells: [],
    explodedCells: [],
    scoreChange: { 1: 0, 2: 0 }
  };

  const cell = state.grid[r][q];
  cell.owner = player;
  cell.element = element;
  cell.level = 1;

  processReactions(state, q, r, result);

  return result;
}

function processReactions(
  state: GameState,
  startQ: number,
  startR: number,
  result: ReactionResult
): void {
  const cell = state.grid[startR][startQ];
  if (!cell.element || !cell.owner) return;

  const neighbors = getNeighbors(startQ, startR);

  for (const neighbor of neighbors) {
    const neighborCell = state.grid[neighbor.r][neighbor.q];

    if (neighborCell.owner === null) continue;

    if (neighborCell.owner === cell.owner && neighborCell.element === cell.element) {
      if (Math.random() < 0.5) {
        neighborCell.level = Math.min(neighborCell.level + 1, 10);
        result.fusedCells.push({ q: neighbor.q, r: neighbor.r });
      }
    } else if (neighborCell.owner !== cell.owner && neighborCell.element) {
      const counterElement = ELEMENT_COUNTER[cell.element];
      if (neighborCell.element === counterElement) {
        triggerExplosion(state, neighbor.q, neighbor.r, result, cell.owner);
      }
    }
  }
}

function triggerExplosion(
  state: GameState,
  q: number,
  r: number,
  result: ReactionResult,
  attackingPlayer: PlayerId
): void {
  const centerCell = state.grid[r][q];
  if (!centerCell.owner) return;

  const defendingPlayer = centerCell.owner;

  clearCell(state, q, r, result, defendingPlayer);
  result.explodedCells.push({ q, r });

  const neighbors = getNeighbors(q, r);
  for (const neighbor of neighbors) {
    const neighborCell = state.grid[neighbor.r][neighbor.q];
    if (neighborCell.owner !== null) {
      clearCell(state, neighbor.q, neighbor.r, result, defendingPlayer);
      result.explodedCells.push({ q: neighbor.q, r: neighbor.r });
    }
  }
}

function clearCell(
  state: GameState,
  q: number,
  r: number,
  result: ReactionResult,
  defendingPlayer: PlayerId
): void {
  const cell = state.grid[r][q];
  cell.owner = null;
  cell.element = null;
  cell.level = 0;
  result.scoreChange[defendingPlayer] -= 1;
}

export function calculateTerritoryStats(state: GameState, player: PlayerId): TerritoryStats {
  const stats: TerritoryStats = {
    fire: 0,
    water: 0,
    earth: 0,
    wind: 0,
    total: 0
  };

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let q = 0; q < GRID_SIZE; q++) {
      const cell = state.grid[r][q];
      if (cell.owner === player && cell.element) {
        const weight = 1 + (cell.level - 1) * 0.15;
        stats[cell.element] += weight;
        stats.total += weight;
      }
    }
  }

  return stats;
}

export function getDominantElement(stats: TerritoryStats): ElementType | null {
  if (stats.total === 0) return null;

  let maxElement: ElementType | null = null;
  let maxValue = 0;
  const elements: ElementType[] = ['fire', 'water', 'earth', 'wind'];

  for (const element of elements) {
    if (stats[element] > maxValue) {
      maxValue = stats[element];
      maxElement = element;
    }
  }

  if (maxValue / stats.total < 0.4) return null;

  return maxElement;
}

export function endTurn(state: GameState): void {
  const currentPlayer = state.currentPlayer;
  const opponent = getOpponent(currentPlayer);

  const stats = calculateTerritoryStats(state, currentPlayer);
  const dominant = getDominantElement(stats);

  const playerState = state.players[currentPlayer];

  if (dominant === 'fire') {
    playerState.actionPoints = Math.min(
      playerState.actionPoints + 1,
      playerState.maxActionPoints
    );
  }

  if (dominant === 'water') {
    playerState.health = Math.min(playerState.health + 1, playerState.maxHealth);
  }

  playerState.energy = Math.min(playerState.energy + 1, playerState.maxEnergy);

  state.currentPlayer = opponent;

  if (opponent === 1) {
    state.turn++;
  }
}

export function applyScoreChanges(
  state: GameState,
  scoreChange: { [key in PlayerId]: number }
): void {
  for (const playerId of [1, 2] as PlayerId[]) {
    state.players[playerId].score = Math.max(
      0,
      state.players[playerId].score + scoreChange[playerId]
    );
  }
}

export function setSelectedElement(
  state: GameState,
  player: PlayerId,
  element: ElementType
): void {
  state.players[player].selectedElement = element;
}

export function getGridSize(): number {
  return GRID_SIZE;
}
