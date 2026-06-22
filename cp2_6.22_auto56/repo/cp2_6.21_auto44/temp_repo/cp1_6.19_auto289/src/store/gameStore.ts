import { create } from 'zustand';
import {
  Ship,
  Cell,
  Position,
  GamePhase,
  Turn,
  ShipType,
  SHIP_CONFIGS,
  GRID_SIZE,
} from '../types';

interface GameState {
  phase: GamePhase;
  turn: Turn;
  round: number;
  playerShips: Ship[];
  aiShips: Ship[];
  playerGrid: Cell[][];
  aiGrid: Cell[][];
  playerHits: number;
  playerMisses: number;
  aiHits: number;
  aiMisses: number;
  selectedShip: ShipType | null;
  placementDirection: 'horizontal' | 'vertical';
  winner: 'player' | 'ai' | null;
  isAiThinking: boolean;
  hitAnimation: { side: 'player' | 'ai'; x: number; y: number; type: 'hit' | 'miss' } | null;
}

interface GameActions {
  selectShip: (type: ShipType | null) => void;
  toggleDirection: () => void;
  placeShip: (x: number, y: number) => void;
  removeShip: (shipId: string) => void;
  startBattle: () => void;
  playerAttack: (x: number, y: number) => boolean;
  aiAttack: (x: number, y: number) => boolean;
  setTurn: (turn: Turn) => void;
  setAiThinking: (thinking: boolean) => void;
  setHitAnimation: (anim: { side: 'player' | 'ai'; x: number; y: number; type: 'hit' | 'miss' } | null) => void;
  incrementRound: () => void;
  resetGame: () => void;
  canStartBattle: () => boolean;
}

function createEmptyGrid(): Cell[][] {
  const grid: Cell[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({ x, y, hasShip: false, isHit: false, isMiss: false });
    }
    grid.push(row);
  }
  return grid;
}

function createInitialShips(): Ship[] {
  return SHIP_CONFIGS.map((config, index) => ({
    id: `ship-${index}`,
    type: config.type,
    name: config.name,
    emoji: config.emoji,
    length: config.length,
    color: config.color,
    positions: [],
    hits: new Array(config.length).fill(false),
    isPlaced: false,
    isSunk: false,
  }));
}

function placeShipOnGrid(
  grid: Cell[][],
  shipId: string,
  positions: Position[]
): Cell[][] {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  positions.forEach(pos => {
    newGrid[pos.y][pos.x].hasShip = true;
    newGrid[pos.y][pos.x].shipId = shipId;
  });
  return newGrid;
}

function isValidPosition(
  grid: Cell[][],
  x: number,
  y: number,
  length: number,
  direction: 'horizontal' | 'vertical'
): boolean {
  for (let i = 0; i < length; i++) {
    const posX = direction === 'horizontal' ? x + i : x;
    const posY = direction === 'vertical' ? y + i : y;
    if (posX >= GRID_SIZE || posY >= GRID_SIZE) return false;
    if (grid[posY][posX].hasShip) return false;
  }
  return true;
}

function getPositions(
  x: number,
  y: number,
  length: number,
  direction: 'horizontal' | 'vertical'
): Position[] {
  const positions: Position[] = [];
  for (let i = 0; i < length; i++) {
    positions.push({
      x: direction === 'horizontal' ? x + i : x,
      y: direction === 'vertical' ? y + i : y,
    });
  }
  return positions;
}

function checkShipSunk(ship: Ship): boolean {
  return ship.hits.every(hit => hit);
}

function checkAllShipsSunk(ships: Ship[]): boolean {
  return ships.filter(s => s.isPlaced).every(s => s.isSunk);
}

function generateAiShips(): Ship[] {
  const ships = createInitialShips();
  const grid = createEmptyGrid();

  ships.forEach(ship => {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 100) {
      const direction = Math.random() > 0.5 ? 'horizontal' : 'vertical';
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      if (isValidPosition(grid, x, y, ship.length, direction)) {
        const positions = getPositions(x, y, ship.length, direction);
        ship.positions = positions;
        ship.hits = new Array(ship.length).fill(false);
        ship.isPlaced = true;
        positions.forEach(pos => {
          grid[pos.y][pos.x].hasShip = true;
          grid[pos.y][pos.x].shipId = ship.id;
        });
        placed = true;
      }
      attempts++;
    }
  });

  return ships;
}

function populateGrid(ships: Ship[]): Cell[][] {
  const grid = createEmptyGrid();
  ships.forEach(ship => {
    if (ship.isPlaced) {
      ship.positions.forEach((pos, idx) => {
        grid[pos.y][pos.x].hasShip = true;
        grid[pos.y][pos.x].shipId = ship.id;
      });
    }
  });
  return grid;
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  phase: 'placement',
  turn: 'player',
  round: 1,
  playerShips: createInitialShips(),
  aiShips: createInitialShips(),
  playerGrid: createEmptyGrid(),
  aiGrid: createEmptyGrid(),
  playerHits: 0,
  playerMisses: 0,
  aiHits: 0,
  aiMisses: 0,
  selectedShip: null,
  placementDirection: 'horizontal',
  winner: null,
  isAiThinking: false,
  hitAnimation: null,

  selectShip: (type) => set({ selectedShip: type }),

  toggleDirection: () =>
    set((state) => ({
      placementDirection: state.placementDirection === 'horizontal' ? 'vertical' : 'horizontal',
    })),

  placeShip: (x, y) => {
    set((state) => {
      if (state.phase !== 'placement' || !state.selectedShip) return state;

      const ship = state.playerShips.find((s) => s.type === state.selectedShip);
      if (!ship) return state;

      const direction = state.placementDirection;

      if (!isValidPosition(state.playerGrid, x, y, ship.length, direction)) {
        return state;
      }

      const positions = getPositions(x, y, ship.length, direction);

      const updatedShips = state.playerShips.map((s) =>
        s.id === ship.id
          ? { ...s, positions, hits: new Array(s.length).fill(false), isPlaced: true }
          : s
      );

      const newGrid = placeShipOnGrid(state.playerGrid, ship.id, positions);

      return {
        playerShips: updatedShips,
        playerGrid: newGrid,
        selectedShip: null,
      };
    });
  },

  removeShip: (shipId) => {
    set((state) => {
      const ship = state.playerShips.find((s) => s.id === shipId);
      if (!ship || !ship.isPlaced) return state;

      const updatedShips = state.playerShips.map((s) =>
        s.id === shipId
          ? { ...s, positions: [], hits: new Array(s.length).fill(false), isPlaced: false }
          : s
      );

      const newGrid = state.playerGrid.map((row) =>
        row.map((cell) =>
          cell.shipId === shipId
            ? { ...cell, hasShip: false, shipId: undefined }
            : cell
        )
      );

      return {
        playerShips: updatedShips,
        playerGrid: newGrid,
      };
    });
  },

  startBattle: () => {
    set((state) => {
      if (!state.canStartBattle()) return state;

      const aiShips = generateAiShips();
      const aiGrid = populateGrid(aiShips);

      return {
        phase: 'battle',
        turn: 'player',
        round: 1,
        aiShips,
        aiGrid,
        winner: null,
      };
    });
  },

  playerAttack: (x, y) => {
    let hit = false;
    set((state) => {
      if (state.phase !== 'battle' || state.turn !== 'player') return state;
      if (state.aiGrid[y][x].isHit || state.aiGrid[y][x].isMiss) return state;

      const cell = state.aiGrid[y][x];
      hit = cell.hasShip;

      const newAiGrid = state.aiGrid.map((row) =>
        row.map((c) =>
          c.x === x && c.y === y
            ? { ...c, isHit: hit, isMiss: !hit }
            : c
        )
      );

      let newAiShips = state.aiShips;
      if (hit && cell.shipId) {
        newAiShips = state.aiShips.map((ship) => {
          if (ship.id !== cell.shipId) return ship;
          const posIndex = ship.positions.findIndex((p) => p.x === x && p.y === y);
          const newHits = [...ship.hits];
          newHits[posIndex] = true;
          const isSunk = newHits.every((h) => h);
          return { ...ship, hits: newHits, isSunk };
        });
      }

      const allAiSunk = checkAllShipsSunk(newAiShips);

      return {
        aiGrid: newAiGrid,
        aiShips: newAiShips,
        playerHits: state.playerHits + (hit ? 1 : 0),
        playerMisses: state.playerMisses + (hit ? 0 : 1),
        winner: allAiSunk ? 'player' : null,
        phase: allAiSunk ? 'gameOver' : state.phase,
        hitAnimation: { side: 'ai', x, y, type: hit ? 'hit' : 'miss' },
      };
    });
    return hit;
  },

  aiAttack: (x, y) => {
    let hit = false;
    set((state) => {
      if (state.phase !== 'battle' || state.turn !== 'ai') return state;
      if (state.playerGrid[y][x].isHit || state.playerGrid[y][x].isMiss) return state;

      const cell = state.playerGrid[y][x];
      hit = cell.hasShip;

      const newPlayerGrid = state.playerGrid.map((row) =>
        row.map((c) =>
          c.x === x && c.y === y
            ? { ...c, isHit: hit, isMiss: !hit }
            : c
        )
      );

      let newPlayerShips = state.playerShips;
      if (hit && cell.shipId) {
        newPlayerShips = state.playerShips.map((ship) => {
          if (ship.id !== cell.shipId) return ship;
          const posIndex = ship.positions.findIndex((p) => p.x === x && p.y === y);
          const newHits = [...ship.hits];
          newHits[posIndex] = true;
          const isSunk = newHits.every((h) => h);
          return { ...ship, hits: newHits, isSunk };
        });
      }

      const allPlayerSunk = checkAllShipsSunk(newPlayerShips);

      return {
        playerGrid: newPlayerGrid,
        playerShips: newPlayerShips,
        aiHits: state.aiHits + (hit ? 1 : 0),
        aiMisses: state.aiMisses + (hit ? 0 : 1),
        winner: allPlayerSunk ? 'ai' : null,
        phase: allPlayerSunk ? 'gameOver' : state.phase,
        hitAnimation: { side: 'player', x, y, type: hit ? 'hit' : 'miss' },
      };
    });
    return hit;
  },

  setTurn: (turn) => set({ turn }),

  setAiThinking: (thinking) => set({ isAiThinking: thinking }),

  setHitAnimation: (anim) => set({ hitAnimation: anim }),

  incrementRound: () => set((state) => ({ round: state.round + 1 })),

  resetGame: () => {
    set({
      phase: 'placement',
      turn: 'player',
      round: 1,
      playerShips: createInitialShips(),
      aiShips: createInitialShips(),
      playerGrid: createEmptyGrid(),
      aiGrid: createEmptyGrid(),
      playerHits: 0,
      playerMisses: 0,
      aiHits: 0,
      aiMisses: 0,
      selectedShip: null,
      placementDirection: 'horizontal',
      winner: null,
      isAiThinking: false,
      hitAnimation: null,
    });
  },

  canStartBattle: () => {
    const state = get();
    return state.playerShips.every((s) => s.isPlaced);
  },
}));
