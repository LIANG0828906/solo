import React, { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';
import { CellType, SymbolType, MazeData, Position, MechanismDoor, PressurePlate, Item, generateMaze } from './GameCore';
import { PuzzleModule } from './PuzzleModule';

export interface GameState {
  maze: MazeData;
  playerPos: Position;
  stamina: number;
  maxStamina: number;
  inventory: Item[];
  doors: MechanismDoor[];
  plates: PressurePlate[];
  items: Item[];
  puzzleModule: PuzzleModule;
  hintMessage: string | null;
  screenShake: boolean;
  doorParticles: Position | null;
  gameWon: boolean;
  gameStarted: boolean;
  elapsedTime: number;
  discoveredPlates: Position[];
  discoveredDoors: Position[];
  plateFlash: Position | null;
  victoryBeam: boolean;
  discoveredItems: Position[];
}

export type GameAction =
  | { type: 'MOVE'; direction: Position }
  | { type: 'COLLECT_ITEM'; position: Position }
  | { type: 'ACTIVATE_PLATE'; position: Position }
  | { type: 'OPEN_DOOR'; position: Position }
  | { type: 'DISMISS_HINT' }
  | { type: 'CLEAR_SHAKE' }
  | { type: 'CLEAR_PARTICLES' }
  | { type: 'CLEAR_PLATE_FLASH' }
  | { type: 'TICK_TIMER' }
  | { type: 'NEW_GAME' }
  | { type: 'START_GAME' }
  | { type: 'CLEAR_VICTORY_BEAM' };

function createInitialState(): GameState {
  const maze = generateMaze(10, 10);
  const puzzleModule = new PuzzleModule(maze.doors, maze.plates);
  return {
    maze,
    playerPos: maze.startPosition,
    stamina: 20,
    maxStamina: 20,
    inventory: [],
    doors: maze.doors,
    plates: maze.plates,
    items: maze.items,
    puzzleModule,
    hintMessage: null,
    screenShake: false,
    doorParticles: null,
    gameWon: false,
    gameStarted: false,
    elapsedTime: 0,
    discoveredPlates: [],
    discoveredDoors: [],
    plateFlash: null,
    victoryBeam: false,
    discoveredItems: [],
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return { ...state, gameStarted: true };

    case 'NEW_GAME':
      return createInitialState();

    case 'MOVE': {
      if (state.gameWon) return state;

      const newPos: Position = {
        row: state.playerPos.row + action.direction.row,
        col: state.playerPos.col + action.direction.col,
      };

      if (newPos.row < 0 || newPos.row >= state.maze.grid.length ||
          newPos.col < 0 || newPos.col >= state.maze.grid[0].length) {
        return state;
      }

      const targetCell = state.maze.grid[newPos.row][newPos.col];
      if (targetCell.type === CellType.Wall) return state;

      if (targetCell.type === CellType.Mechanism) {
        const door = state.doors.find(d => d.position.row === newPos.row && d.position.col === newPos.col);
        if (door && !door.open) return state;
      }

      if (state.stamina <= 0) return state;

      let newStamina = state.stamina - 1;
      let newInventory = state.inventory;
      let newItems = state.items;
      let newDoors = state.doors;
      let newPlates = state.plates;
      let newHint = state.hintMessage;
      let shake = false;
      let particles = state.doorParticles;
      let flash = state.plateFlash;
      let newDiscoveredPlates = state.discoveredPlates;
      let newDiscoveredDoors = state.discoveredDoors;
      let newDiscoveredItems = state.discoveredItems;
      let newVictoryBeam = false;

      const itemIdx = newItems.findIndex(i => i.position.row === newPos.row && i.position.col === newPos.col && !i.collected);
      if (itemIdx >= 0) {
        const item = newItems[itemIdx];
        newItems = newItems.map((it, idx) => idx === itemIdx ? { ...it, collected: true } : it);
        newInventory = [...newInventory, item];

        if (item.type === 'potion') {
          newStamina = Math.min(state.maxStamina, newStamina + 5);
        }

        if (item.type === 'scroll') {
          const hint = state.puzzleModule.getUnsolvedHint(state.doors, state.plates);
          if (hint) {
            newHint = hint.message;
          }
        }

        if (!newDiscoveredItems.some(di => di.row === item.position.row && di.col === item.position.col)) {
          newDiscoveredItems = [...newDiscoveredItems, item.position];
        }
      }

      const plate = newPlates.find(p => p.position.row === newPos.row && p.position.col === newPos.col && !p.activated);
      if (plate) {
        newPlates = newPlates.map(p =>
          p.position.row === newPos.row && p.position.col === newPos.col ? { ...p, activated: true } : p
        );
        const doorToOpen = state.puzzleModule.tryActivatePlate(plate.symbol, newDoors, newPlates);
        if (doorToOpen) {
          newDoors = newDoors.map(d =>
            d.position.row === doorToOpen.position.row && d.position.col === doorToOpen.position.col ? { ...d, open: true } : d
          );
          state.maze.grid[doorToOpen.position.row][doorToOpen.position.col].type = CellType.Path;
          particles = doorToOpen.position;
        }
        shake = true;
        flash = plate.position;

        if (!newDiscoveredPlates.some(p => p.row === plate.position.row && p.col === plate.position.col)) {
          newDiscoveredPlates = [...newDiscoveredPlates, plate.position];
        }
      }

      const nearbyPlate = newPlates.find(p =>
        Math.abs(p.position.row - newPos.row) <= 2 && Math.abs(p.position.col - newPos.col) <= 2 &&
        !newDiscoveredPlates.some(dp => dp.row === p.position.row && dp.col === p.position.col)
      );
      if (nearbyPlate) {
        newDiscoveredPlates = [...newDiscoveredPlates, nearbyPlate.position];
      }

      const nearbyDoor = newDoors.find(d =>
        Math.abs(d.position.row - newPos.row) <= 2 && Math.abs(d.position.col - newPos.col) <= 2 &&
        !newDiscoveredDoors.some(dd => dd.row === d.position.row && dd.col === d.position.col)
      );
      if (nearbyDoor) {
        newDiscoveredDoors = [...newDiscoveredDoors, nearbyDoor.position];
      }

      const gameWon = newPos.row === state.maze.endPosition.row && newPos.col === state.maze.endPosition.col;
      if (gameWon) {
        newVictoryBeam = true;
      }

      return {
        ...state,
        playerPos: newPos,
        stamina: newStamina,
        inventory: newInventory,
        doors: newDoors,
        plates: newPlates,
        items: newItems,
        hintMessage: newHint,
        screenShake: shake,
        doorParticles: particles,
        gameWon,
        discoveredPlates: newDiscoveredPlates,
        discoveredDoors: newDiscoveredDoors,
        plateFlash: flash,
        victoryBeam: newVictoryBeam,
        discoveredItems: newDiscoveredItems,
      };
    }

    case 'DISMISS_HINT':
      return { ...state, hintMessage: null };

    case 'CLEAR_SHAKE':
      return { ...state, screenShake: false };

    case 'CLEAR_PARTICLES':
      return { ...state, doorParticles: null };

    case 'CLEAR_PLATE_FLASH':
      return { ...state, plateFlash: null };

    case 'CLEAR_VICTORY_BEAM':
      return { ...state, victoryBeam: false };

    case 'TICK_TIMER':
      if (!state.gameStarted || state.gameWon) return state;
      return { ...state, elapsedTime: state.elapsedTime + 1 };

    case 'OPEN_DOOR':
      return state;

    default:
      return state;
  }
}

const GameContext = createContext<{ state: GameState; dispatch: Dispatch<GameAction> } | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
