import { create } from 'zustand';
import type { Cell, Monster, Tower, TowerType, UpgradePanelState } from '../types';
import { GameEngine, GRID_COLS, GRID_ROWS, TOTAL_WAVES, WAVE_MONSTER_COUNTS } from '../engine/gameEngine';

interface GameStoreState {
  engine: GameEngine | null;
  cells: Cell[][];
  path: Cell[];
  towers: Tower[];
  monsters: Monster[];
  gold: number;
  lives: number;
  wave: number;
  totalWaves: number;
  maxWaveMonsters: number[];
  waveActive: boolean;
  gameOver: boolean;
  victory: boolean;
  selectedTowerType: TowerType | null;
  upgradePanel: UpgradePanelState;
  fps: number;
  gridCols: number;
  gridRows: number;
  cellSize: number;
}

interface GameStoreActions {
  initEngine: () => void;
  syncFromEngine: () => void;
  updateEngine: (currentTime: number, deltaTime: number) => void;
  selectTowerType: (type: TowerType | null) => void;
  placeTower: (x: number, y: number) => void;
  upgradeTower: (towerId: string) => void;
  sellTower: (towerId: string) => void;
  startWave: () => void;
  showUpgradePanel: (towerId: string, screenX: number, screenY: number) => void;
  hideUpgradePanel: () => void;
  resetGame: () => void;
  setFps: (fps: number) => void;
}

export type GameStore = GameStoreState & GameStoreActions;

const initialCells: Cell[][] = [];
const initialPath: Cell[] = [];

function isValidUpgradePanelPosition(screenX: number, screenY: number): boolean {
  return (
    typeof screenX === 'number' &&
    typeof screenY === 'number' &&
    screenX >= 0 &&
    screenX <= window.innerWidth &&
    screenY >= 0 &&
    screenY <= window.innerHeight
  );
}

export const useGameStore = create<GameStore>((set, get) => ({
  engine: null,
  cells: initialCells,
  path: initialPath,
  towers: [],
  monsters: [],
  gold: 200,
  lives: 20,
  wave: 0,
  totalWaves: TOTAL_WAVES,
  maxWaveMonsters: WAVE_MONSTER_COUNTS,
  waveActive: false,
  gameOver: false,
  victory: false,
  selectedTowerType: null,
  upgradePanel: {
    visible: false,
    towerId: null,
    screenX: 0,
    screenY: 0,
  },
  fps: 60,
  gridCols: GRID_COLS,
  gridRows: GRID_ROWS,
  cellSize: 48,

  initEngine: () => {
    const engine = new GameEngine(GRID_COLS, GRID_ROWS);
    set({ engine });
    get().syncFromEngine();
  },

  syncFromEngine: () => {
    const { engine } = get();
    if (!engine) return;

    const newMonsters = engine.getMonsters();
    const currentMonsters = get().monsters;

    let monstersUpdated = false;
    if (currentMonsters.length !== newMonsters.length) {
      monstersUpdated = true;
    } else {
      const currentIds = new Set(currentMonsters.map((m) => m.id));
      for (const m of newMonsters) {
        if (!currentIds.has(m.id)) {
          monstersUpdated = true;
          break;
        }
      }
    }

    set({
      cells: engine.getCells(),
      path: engine.getPath(),
      towers: engine.getAllTowers(),
      monsters: monstersUpdated ? [...newMonsters] : currentMonsters,
      gold: engine.getGold(),
      lives: engine.getLives(),
      wave: engine.getWave(),
      waveActive: engine.isWaveActive(),
      gameOver: engine.isGameOver(),
      victory: engine.isVictory(),
    });
  },

  updateEngine: (currentTime: number, deltaTime: number) => {
    const { engine } = get();
    if (!engine) return;

    engine.update(currentTime, deltaTime);
    get().syncFromEngine();
  },

  selectTowerType: (type: TowerType | null) => {
    set({
      selectedTowerType: type,
      upgradePanel: {
        visible: false,
        towerId: null,
        screenX: 0,
        screenY: 0,
      },
    });
  },

  placeTower: (x: number, y: number) => {
    const { engine, selectedTowerType } = get();
    if (!engine || !selectedTowerType) return;

    const tower = engine.placeTower(x, y, selectedTowerType);
    if (tower) {
      get().syncFromEngine();
    }
  },

  upgradeTower: (towerId: string) => {
    const { engine } = get();
    if (!engine) return;

    const success = engine.upgradeTower(towerId);
    if (success) {
      get().syncFromEngine();
    }
  },

  sellTower: (towerId: string) => {
    const { engine } = get();
    if (!engine) return;

    engine.sellTower(towerId);
    set({
      upgradePanel: {
        visible: false,
        towerId: null,
        screenX: 0,
        screenY: 0,
      },
    });
    get().syncFromEngine();
  },

  startWave: () => {
    const { engine } = get();
    if (!engine) return;

    const success = engine.startWave();
    if (success) {
      get().syncFromEngine();
    }
  },

  showUpgradePanel: (towerId: string, screenX: number, screenY: number) => {
    if (!towerId) {
      console.error('[Store] showUpgradePanel: towerId is required');
      return;
    }

    if (!isValidUpgradePanelPosition(screenX, screenY)) {
      console.error(
        `[Store] showUpgradePanel: invalid screen coordinates (${screenX}, ${screenY})`
      );
      return;
    }

    const { towers } = get();
    const tower = towers.find((t) => t.id === towerId);
    if (!tower) {
      console.error(`[Store] showUpgradePanel: tower ${towerId} not found`);
      return;
    }

    set({
      selectedTowerType: null,
      upgradePanel: {
        visible: true,
        towerId,
        screenX,
        screenY,
      },
    });
  },

  hideUpgradePanel: () => {
    set({
      upgradePanel: {
        visible: false,
        towerId: null,
        screenX: 0,
        screenY: 0,
      },
    });
  },

  resetGame: () => {
    const { engine } = get();
    if (!engine) {
      get().initEngine();
    } else {
      engine.reset();
    }
    set({
      selectedTowerType: null,
      upgradePanel: {
        visible: false,
        towerId: null,
        screenX: 0,
        screenY: 0,
      },
    });
    get().syncFromEngine();
  },

  setFps: (fps: number) => {
    set({ fps });
  },
}));
