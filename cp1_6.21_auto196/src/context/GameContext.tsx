import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';
import {
  ElementType,
  TerrainType,
  HexCoord,
  Rune,
  Enemy,
  ComboEffect,
  Particle,
  getNeighbors,
  getComboType,
  createParticles,
  generateId,
  getTerrainModifier,
} from '../utils/elementSystem';

export interface GameState {
  runes: Rune[];
  enemies: Enemy[];
  comboEffects: ComboEffect[];
  particles: Particle[];
  inventory: Record<ElementType, number>;
  selectedRune: ElementType | null;
  wave: number;
  enemiesRemaining: number;
  enemiesSpawned: number;
  totalEnemiesInWave: number;
  comboCount: number;
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  terrain: TerrainType[][];
  path: HexCoord[];
  waveInProgress: boolean;
  gridSize: number;
}

type ActionType =
  | { type: 'SELECT_RUNE'; payload: ElementType | null }
  | {
      type: 'PLACE_RUNE';
      payload: { position: HexCoord; centerX: number; centerY: number };
    }
  | { type: 'SPAWN_ENEMY'; payload: Enemy }
  | { type: 'UPDATE_ENEMIES'; payload: Enemy[] }
  | { type: 'TRIGGER_COMBO'; payload: ComboEffect[] }
  | { type: 'ADD_PARTICLES'; payload: Particle[] }
  | { type: 'UPDATE_PARTICLES'; payload: Particle[] }
  | { type: 'END_WAVE' }
  | { type: 'START_WAVE'; payload: { totalEnemies: number } }
  | { type: 'START_GAME'; payload?: { gridSize?: number } }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'GAME_OVER' }
  | { type: 'VICTORY' }
  | { type: 'UPDATE_COMBO_EFFECTS'; payload: ComboEffect[] }
  | { type: 'SET_GRID_SIZE'; payload: number };

export function generatePath(gridSize: number): HexCoord[] {
  const path: HexCoord[] = [];
  const midR = Math.floor(gridSize / 2);
  let currentR = midR;

  for (let q = 0; q < gridSize; q += 1) {
    path.push({ q, r: currentR });

    if (q < gridSize - 1) {
      const rand = Math.random();
      if (rand < 0.33 && currentR > 0) {
        currentR -= 1;
      } else if (rand < 0.66 && currentR < gridSize - 1) {
        currentR += 1;
      }
    }
  }

  return path;
}

export function generateTerrain(gridSize: number): TerrainType[][] {
  const terrain: TerrainType[][] = [];

  for (let r = 0; r < gridSize; r += 1) {
    terrain[r] = [];
    for (let q = 0; q < gridSize; q += 1) {
      const rand = Math.random();
      if (rand < 0.15) {
        terrain[r][q] = 'grass';
      } else if (rand < 0.3) {
        terrain[r][q] = 'lava';
      } else {
        terrain[r][q] = 'normal';
      }
    }
  }

  return terrain;
}

export function getRandomRunes(count: number): ElementType[] {
  const elements: ElementType[] = ['fire', 'water', 'wind', 'earth'];
  const runes: ElementType[] = [];

  for (let i = 0; i < count; i += 1) {
    runes.push(elements[Math.floor(Math.random() * 4)]);
  }

  return runes;
}

export function initGameState(gridSize: number): GameState {
  const initialInventory: Record<ElementType, number> = {
    fire: 0,
    water: 0,
    wind: 0,
    earth: 0,
  };

  const randomRunes = getRandomRunes(5);
  randomRunes.forEach((element) => {
    const total =
      initialInventory.fire +
      initialInventory.water +
      initialInventory.wind +
      initialInventory.earth;
    if (total < 15) {
      initialInventory[element] += 1;
    }
  });

  return {
    runes: [],
    enemies: [],
    comboEffects: [],
    particles: [],
    inventory: initialInventory,
    selectedRune: null,
    wave: 1,
    enemiesRemaining: 0,
    enemiesSpawned: 0,
    totalEnemiesInWave: 0,
    comboCount: 0,
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    isVictory: false,
    terrain: generateTerrain(gridSize),
    path: generatePath(gridSize),
    waveInProgress: false,
    gridSize,
  };
}

function checkCombo(
  runes: Rune[],
  newRune: Rune
): { comboElements: ElementType[]; runesToTrigger: Rune[] } | null {
  const neighbors = getNeighbors(newRune.position);
  const adjacentRunes = runes.filter(
    (r) =>
      r.id !== newRune.id &&
      neighbors.some((n) => n.q === r.position.q && n.r === r.position.r)
  );

  if (adjacentRunes.length === 0) {
    return null;
  }

  const comboElements: ElementType[] = [newRune.element];
  const runesToTrigger: Rune[] = [newRune];

  adjacentRunes.forEach((r) => {
    comboElements.push(r.element);
    runesToTrigger.push(r);
  });

  return { comboElements, runesToTrigger };
}

function gameReducer(state: GameState, action: ActionType): GameState {
  switch (action.type) {
    case 'SELECT_RUNE': {
      return { ...state, selectedRune: action.payload };
    }

    case 'PLACE_RUNE': {
      const { position, centerX, centerY } = action.payload;

      if (!state.selectedRune) return state;
      if (state.inventory[state.selectedRune] <= 0) return state;

      const occupied = state.runes.some(
        (r) => r.position.q === position.q && r.position.r === position.r
      );
      if (occupied) return state;

      if (
        position.q < 0 ||
        position.q >= state.gridSize ||
        position.r < 0 ||
        position.r >= state.gridSize
      ) {
        return state;
      }

      const newRune: Rune = {
        id: `r-${generateId()}`,
        element: state.selectedRune,
        position,
        placedAt: Date.now(),
      };

      const newRunes = [...state.runes, newRune];
      const newInventory = {
        ...state.inventory,
        [state.selectedRune]: state.inventory[state.selectedRune] - 1,
      };

      const comboResult = checkCombo(newRunes, newRune);

      if (comboResult) {
        const comboInfo = getComboType(comboResult.comboElements);
        if (comboInfo) {
          const terrainAt =
            state.terrain[position.r]?.[position.q] ?? 'normal';
          const { damageMultiplier } = getTerrainModifier(terrainAt, newRune.element);

          const newComboEffects: ComboEffect[] = comboResult.runesToTrigger.map(
            (r) => ({
              id: `c-${generateId()}`,
              position: r.position,
              type: r.element,
              comboType: comboInfo.name,
              startTime: Date.now(),
              duration: comboInfo.duration,
              radius: comboInfo.radius,
              damage: Math.floor(comboInfo.damage * damageMultiplier),
              statusType: comboInfo.statusType,
              statusDuration: comboInfo.statusDuration,
            })
          );

          const newParticles = createParticles(centerX, centerY, newRune.element, 8);

          return {
            ...state,
            runes: newRunes,
            inventory: newInventory,
            selectedRune: null,
            comboEffects: [...state.comboEffects, ...newComboEffects],
            particles: [...state.particles, ...newParticles],
            comboCount: state.comboCount + 1,
          };
        }
      }

      const placeParticles = createParticles(centerX, centerY, newRune.element, 3);

      return {
        ...state,
        runes: newRunes,
        inventory: newInventory,
        selectedRune: null,
        particles: [...state.particles, ...placeParticles],
      };
    }

    case 'SPAWN_ENEMY': {
      return {
        ...state,
        enemies: [...state.enemies, action.payload],
        enemiesSpawned: state.enemiesSpawned + 1,
        enemiesRemaining: state.totalEnemiesInWave - (state.enemiesSpawned + 1),
      };
    }

    case 'UPDATE_ENEMIES': {
      return {
        ...state,
        enemies: action.payload,
        enemiesRemaining: state.totalEnemiesInWave - state.enemiesSpawned + action.payload.length - (state.totalEnemiesInWave - state.enemiesSpawned),
      };
    }

    case 'TRIGGER_COMBO': {
      return {
        ...state,
        comboEffects: [...state.comboEffects, ...action.payload],
      };
    }

    case 'ADD_PARTICLES': {
      return {
        ...state,
        particles: [...state.particles, ...action.payload],
      };
    }

    case 'UPDATE_PARTICLES': {
      return { ...state, particles: action.payload };
    }

    case 'END_WAVE': {
      const bonusCount = 2 + Math.floor(state.comboCount / 3);
      const bonusRunes = getRandomRunes(bonusCount);
      const newInventory = { ...state.inventory };
      bonusRunes.forEach((element) => {
        const total =
          newInventory.fire +
          newInventory.water +
          newInventory.wind +
          newInventory.earth;
        if (total < 15) {
          newInventory[element] += 1;
        }
      });

      return {
        ...state,
        waveInProgress: false,
        inventory: newInventory,
        wave: state.wave + 1,
      };
    }

    case 'START_WAVE': {
      return {
        ...state,
        waveInProgress: true,
        enemiesRemaining: action.payload.totalEnemies,
        enemiesSpawned: 0,
        totalEnemiesInWave: action.payload.totalEnemies,
      };
    }

    case 'START_GAME': {
      const newGridSize = action.payload?.gridSize ?? state.gridSize;
      return {
        ...initGameState(newGridSize),
        isPlaying: true,
      };
    }

    case 'TOGGLE_PAUSE': {
      if (!state.isPlaying || state.isGameOver || state.isVictory) return state;
      return { ...state, isPaused: !state.isPaused };
    }

    case 'GAME_OVER': {
      return { ...state, isGameOver: true, isPlaying: false };
    }

    case 'VICTORY': {
      return { ...state, isVictory: true, isPlaying: false };
    }

    case 'UPDATE_COMBO_EFFECTS': {
      return { ...state, comboEffects: action.payload };
    }

    case 'SET_GRID_SIZE': {
      if (state.isPlaying) return state;
      return {
        ...state,
        gridSize: action.payload,
        terrain: generateTerrain(action.payload),
        path: generatePath(action.payload),
      };
    }

    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<ActionType>;
  actions: {
    selectRune: (rune: ElementType | null) => void;
    placeRune: (position: HexCoord, centerX: number, centerY: number) => void;
    startGame: (gridSize?: number) => void;
    togglePause: () => void;
    setGridSize: (size: number) => void;
    startWave: (totalEnemies: number) => void;
  };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const DEFAULT_GRID_SIZE =
  typeof window !== 'undefined' && window.innerWidth >= 768 ? 8 : 6;

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, DEFAULT_GRID_SIZE, initGameState);

  const selectRune = useCallback((rune: ElementType | null) => {
    dispatch({ type: 'SELECT_RUNE', payload: rune });
  }, []);

  const placeRune = useCallback(
    (position: HexCoord, centerX: number, centerY: number) => {
      dispatch({
        type: 'PLACE_RUNE',
        payload: { position, centerX, centerY },
      });
    },
    []
  );

  const startGame = useCallback((gridSize?: number) => {
    dispatch({ type: 'START_GAME', payload: { gridSize } });
  }, []);

  const togglePause = useCallback(() => {
    dispatch({ type: 'TOGGLE_PAUSE' });
  }, []);

  const setGridSize = useCallback((size: number) => {
    dispatch({ type: 'SET_GRID_SIZE', payload: size });
  }, []);

  const startWave = useCallback((totalEnemies: number) => {
    dispatch({ type: 'START_WAVE', payload: { totalEnemies } });
  }, []);

  const value = useMemo<GameContextType>(
    () => ({
      state,
      dispatch,
      actions: {
        selectRune,
        placeRune,
        startGame,
        togglePause,
        setGridSize,
        startWave,
      },
    }),
    [state, selectRune, placeRune, startGame, togglePause, setGridSize, startWave]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameContext(): GameContextType {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}
