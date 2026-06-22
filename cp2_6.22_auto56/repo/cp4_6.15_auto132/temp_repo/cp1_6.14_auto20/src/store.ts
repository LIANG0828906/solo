import { create } from 'zustand';
import type { Unit, HexCell, LogEntry, TerrainType, GameState } from './types';
import { GRID_WIDTH, GRID_HEIGHT, DEFAULT_PLAYER_UNIT, DEFAULT_ENEMY_UNIT } from './config';
import { v4 as uuidv4 } from 'uuid';

interface GameStore extends GameState {
  setSelectedUnit: (id: string | null) => void;
  setEditMode: (editMode: boolean) => void;
  setBrushType: (brushType: TerrainType) => void;
  setUnits: (units: Unit[]) => void;
  updateUnit: (id: string, updates: Partial<Unit>) => void;
  addUnit: (type: 'player' | 'enemy', q: number, r: number) => void;
  removeUnit: (id: string) => void;
  moveUnit: (id: string, q: number, r: number) => void;
  setTerrain: (terrain: HexCell[]) => void;
  updateTerrain: (q: number, r: number, terrain: TerrainType) => void;
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  setLogs: (logs: LogEntry[]) => void;
  nextRound: () => void;
  resetRound: () => void;
  loadState: (state: GameState) => void;
}

const generateInitialTerrain = (): HexCell[] => {
  const terrain: HexCell[] = [];
  for (let q = 0; q < GRID_WIDTH; q++) {
    for (let r = 0; r < GRID_HEIGHT; r++) {
      terrain.push({ q, r, terrain: 'grass' });
    }
  }
  return terrain;
};

const generateInitialUnits = (): Unit[] => {
  return [
    {
      ...DEFAULT_PLAYER_UNIT,
      id: uuidv4(),
      name: '战士',
      race: '人类',
      position: { q: 3, r: 7 },
    },
    {
      ...DEFAULT_PLAYER_UNIT,
      id: uuidv4(),
      name: '法师',
      race: '精灵',
      hp: 35,
      maxHp: 35,
      strength: 8,
      intelligence: 16,
      position: { q: 3, r: 8 },
    },
    {
      ...DEFAULT_ENEMY_UNIT,
      id: uuidv4(),
      name: '哥布林战士',
      position: { q: 15, r: 6 },
    },
    {
      ...DEFAULT_ENEMY_UNIT,
      id: uuidv4(),
      name: '哥布林弓手',
      hp: 20,
      maxHp: 20,
      armor: 10,
      agility: 16,
      strength: 8,
      position: { q: 15, r: 9 },
    },
  ];
};

export const useGameStore = create<GameStore>((set) => ({
  units: generateInitialUnits(),
  terrain: generateInitialTerrain(),
  currentRound: 1,
  selectedUnitId: null,
  editMode: false,
  brushType: 'grass',
  logs: [],

  setSelectedUnit: (id) => set({ selectedUnitId: id }),
  setEditMode: (editMode) => set({ editMode, selectedUnitId: null }),
  setBrushType: (brushType) => set({ brushType }),
  setUnits: (units) => set({ units }),

  updateUnit: (id, updates) =>
    set((state) => ({
      units: state.units.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    })),

  addUnit: (type, q, r) =>
    set((state) => {
      const template = type === 'player' ? DEFAULT_PLAYER_UNIT : DEFAULT_ENEMY_UNIT;
      const newUnit: Unit = {
        ...template,
        id: uuidv4(),
        position: { q, r },
        name: type === 'player' ? `玩家${state.units.filter(u => u.type === 'player').length + 1}` : `敌人${state.units.filter(u => u.type === 'enemy').length + 1}`,
      };
      return { units: [...state.units, newUnit] };
    }),

  removeUnit: (id) =>
    set((state) => ({
      units: state.units.filter((u) => u.id !== id),
      selectedUnitId: state.selectedUnitId === id ? null : state.selectedUnitId,
    })),

  moveUnit: (id, q, r) =>
    set((state) => ({
      units: state.units.map((u) =>
        u.id === id ? { ...u, position: { q, r } } : u
      ),
    })),

  setTerrain: (terrain) => set({ terrain }),

  updateTerrain: (q, r, terrainType) =>
    set((state) => {
      const exists = state.terrain.find((t) => t.q === q && t.r === r);
      if (exists) {
        return {
          terrain: state.terrain.map((t) =>
            t.q === q && t.r === r ? { ...t, terrain: terrainType } : t
          ),
        };
      }
      return { terrain: [...state.terrain, { q, r, terrain: terrainType }] };
    }),

  addLog: (log) =>
    set((state) => ({
      logs: [
        ...state.logs,
        {
          ...log,
          id: uuidv4(),
          timestamp: Date.now(),
        },
      ],
    })),

  setLogs: (logs) => set({ logs }),

  nextRound: () => set((state) => ({ currentRound: state.currentRound + 1 })),
  resetRound: () => set({ currentRound: 1 }),

  loadState: (state) =>
    set({
      units: state.units,
      terrain: state.terrain,
      currentRound: state.currentRound,
      selectedUnitId: state.selectedUnitId,
      editMode: state.editMode,
      brushType: state.brushType,
      logs: state.logs,
    }),
}));
