import { create } from 'zustand';
import { GameState, GamePhase, Unit, Enemy, FogState, MapData } from '../types';
import { generateMap, MAP_WIDTH, MAP_HEIGHT } from '../modules/terrainGenerator';
import {
  createInitialUnits,
  createInitialEnemies,
  updateUnits,
  updateEnemies,
  checkCollisions,
  checkExtraction,
  getInputDelay,
  switchUnitByKey,
  getKeyState,
} from '../modules/unitController';
import { FogEngine } from '../modules/fogEngine';

let fogEngine: FogEngine | null = null;

const initialFogState: FogState = {
  visibleCells: new Set(),
  texture: null,
  coverage: 0,
};

export const useGameStore = create<
  GameState & {
    initGame: () => void;
    selectUnit: (unitId: string) => void;
    gameLoop: (deltaTime: number, currentTime: number) => void;
    triggerRetreat: () => void;
    resetGame: () => void;
    getFogEngine: () => FogEngine | null;
  }
>((set, get) => ({
  phase: GamePhase.PLAYING,
  mapData: null,
  units: [],
  enemies: [],
  fogState: initialFogState,
  selectedUnitId: null,
  extractionProgress: 0,
  fps: 60,
  lastFrameTime: performance.now(),
  inputDelay: 0,
  flashEffect: false,

  initGame: () => {
    const mapData = generateMap();
    const units = createInitialUnits(mapData);
    const enemies = createInitialEnemies(mapData);
    fogEngine = new FogEngine(MAP_WIDTH, MAP_HEIGHT);

    const initialFog = fogEngine.calculateVisibility(units, mapData, performance.now());

    set({
      phase: GamePhase.PLAYING,
      mapData,
      units,
      enemies,
      fogState: initialFog,
      selectedUnitId: units[0]?.id ?? null,
      extractionProgress: 0,
      lastFrameTime: performance.now(),
      inputDelay: 0,
      flashEffect: false,
    });
  },

  selectUnit: (unitId: string) => {
    set((state) => ({
      units: state.units.map((u) => ({
        ...u,
        isSelected: u.id === unitId,
      })),
      selectedUnitId: unitId,
    }));
  },

  gameLoop: (deltaTime: number, currentTime: number) => {
    const state = get();
    if (state.phase !== GamePhase.PLAYING || !state.mapData || !fogEngine) return;

    for (let i = 1; i <= 4; i++) {
      if (getKeyState(String(i))) {
        const newId = switchUnitByKey(state.units, String(i));
        if (newId && newId !== state.selectedUnitId) {
          get().selectUnit(newId);
        }
      }
    }

    const updatedUnits = updateUnits(
      state.units,
      state.selectedUnitId,
      state.mapData,
      deltaTime
    );

    const updatedEnemies = updateEnemies(state.enemies, state.mapData, deltaTime);

    const collision = checkCollisions(updatedUnits, updatedEnemies);

    if (collision.gameOver) {
      set({
        phase: GamePhase.LOSE,
        units: updatedUnits,
        enemies: updatedEnemies,
        flashEffect: true,
      });
      setTimeout(() => set({ flashEffect: false }), 200);
      return;
    }

    const newProgress = checkExtraction(
      updatedUnits,
      state.mapData.extractionPoint,
      state.extractionProgress,
      deltaTime,
      state.phase
    );

    if (newProgress >= 100) {
      set({
        phase: GamePhase.WIN,
        units: updatedUnits,
        enemies: updatedEnemies,
        extractionProgress: 100,
      });
      return;
    }

    const fogState = fogEngine.calculateVisibility(
      updatedUnits,
      state.mapData,
      currentTime
    );

    if (state.fps < 30) {
      fogEngine.setResolutionScale(0.5);
    } else {
      fogEngine.setResolutionScale(1);
    }

    set({
      units: updatedUnits,
      enemies: updatedEnemies,
      fogState,
      extractionProgress: newProgress,
      inputDelay: getInputDelay(),
      fps: Math.round(1 / Math.max(deltaTime, 0.001)),
      lastFrameTime: currentTime,
    });
  },

  triggerRetreat: () => {
    console.log('撤退指令已发出');
  },

  resetGame: () => {
    get().initGame();
  },

  getFogEngine: () => fogEngine,
}));
