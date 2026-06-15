import { create } from 'zustand';
import type {
  SiteType,
  ToolType,
  FragmentData,
  PlacedFragment,
  RestorationRecord,
  GridCell,
  Particle,
  FlareCell,
} from '../types';

interface GameState {
  currentSite: SiteType | null;
  currentTool: ToolType;
  currentArtifactId: string | null;
  excavatedFragments: FragmentData[];
  placedFragments: Record<string, PlacedFragment>;
  selectedFragmentId: string | null;
  restorationRecords: RestorationRecord[];
  gridSize: { rows: number; cols: number };
  grid: GridCell[][];
  particles: Particle[];
  flareCells: FlareCell[];
  digStartTime: number | null;
  digEndTime: number | null;
  showWorkbench: boolean;
  workbenchProgress: number;
  showRating: boolean;
  lastRating: { stars: number; integrity: number; accuracy: number; digTime: number } | null;
  matchFlash: string | null;

  setSite: (site: SiteType) => void;
  setTool: (tool: ToolType) => void;
  setCurrentArtifactId: (id: string) => void;
  initGrid: (artifactFragments: FragmentData[]) => void;
  excavateCell: (row: number, col: number) => { hasFragment: boolean; fragment?: FragmentData };
  addFragment: (fragment: FragmentData) => void;
  removeFragment: (id: string) => void;
  placeFragment: (fragmentId: string, x: number, y: number) => void;
  updateFragment: (fragmentId: string, updates: Partial<PlacedFragment>) => void;
  rotateFragment: (fragmentId: string, delta: number) => void;
  flipFragment: (fragmentId: string) => void;
  setSelectedFragment: (id: string | null) => void;
  matchFragment: (fragmentId: string) => void;
  setRecords: (records: RestorationRecord[]) => void;
  addRecord: (record: RestorationRecord) => void;
  setParticles: (particles: Particle[]) => void;
  addFlareCell: (cell: FlareCell) => void;
  clearFlareCell: (row: number, col: number) => void;
  startDigTimer: () => void;
  endDigTimer: () => number;
  toggleWorkbench: (show?: boolean) => void;
  setWorkbenchProgress: (progress: number) => void;
  setShowRating: (show: boolean) => void;
  setLastRating: (rating: GameState['lastRating']) => void;
  setMatchFlash: (id: string | null) => void;
  resetGame: () => void;
}

const TOOL_SITE_INTEGRITY: Record<SiteType, Record<ToolType, number>> = {
  desert: { brush: 100, shovel: 80, vacuum: 70 },
  jungle: { brush: 85, shovel: 75, vacuum: 100 },
  ocean: { brush: 70, shovel: 85, vacuum: 90 },
};

export const calculateIntegrity = (site: SiteType, tool: ToolType): number => {
  return TOOL_SITE_INTEGRITY[site]?.[tool] ?? 75;
};

export const calculateStars = (integrity: number, accuracy: number): number => {
  const score = (integrity * 0.6 + accuracy * 0.4) / 100;
  if (score >= 0.9) return 3;
  if (score >= 0.75) return 2;
  return 1;
};

const GRID_ROWS = 10;
const GRID_COLS = 12;

const createInitialGrid = (rows: number, cols: number): GridCell[][] => {
  const grid: GridCell[][] = [];
  for (let r = 0; r < rows; r++) {
    const rowArr: GridCell[] = [];
    for (let c = 0; c < cols; c++) {
      rowArr.push({ row: r, col: c, excavated: false, hasFragment: false });
    }
    grid.push(rowArr);
  }
  return grid;
};

const getRandomCells = (
  rows: number,
  cols: number,
  count: number
): Array<{ row: number; col: number }> => {
  const all: Array<{ row: number; col: number }> = [];
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      all.push({ row: r, col: c });
    }
  }
  const shuffled = all.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const useGameStore = create<GameState>((set, get) => ({
  currentSite: null,
  currentTool: 'brush',
  currentArtifactId: null,
  excavatedFragments: [],
  placedFragments: {},
  selectedFragmentId: null,
  restorationRecords: [],
  gridSize: { rows: GRID_ROWS, cols: GRID_COLS },
  grid: createInitialGrid(GRID_ROWS, GRID_COLS),
  particles: [],
  flareCells: [],
  digStartTime: null,
  digEndTime: null,
  showWorkbench: false,
  workbenchProgress: 0,
  showRating: false,
  lastRating: null,
  matchFlash: null,

  setSite: (site) => set({ currentSite: site }),
  setTool: (tool) => set({ currentTool: tool }),
  setCurrentArtifactId: (id) => set({ currentArtifactId: id }),

  initGrid: (artifactFragments) => {
    const { rows, cols } = get().gridSize;
    const grid = createInitialGrid(rows, cols);
    const positions = getRandomCells(rows, cols, artifactFragments.length);
    positions.forEach((pos, idx) => {
      const fragment = artifactFragments[idx];
      if (fragment) {
        grid[pos.row][pos.col].hasFragment = true;
        grid[pos.row][pos.col].fragmentId = fragment.id;
      }
    });
    set({ grid });
  },

  excavateCell: (row, col) => {
    const state = get();
    const cell = state.grid[row]?.[col];
    if (!cell || cell.excavated) return { hasFragment: false };

    const newGrid = state.grid.map((r) => r.map((c) => ({ ...c })));
    newGrid[row][col].excavated = true;

    let foundFragment: FragmentData | undefined;
    if (cell.hasFragment && cell.fragmentId) {
      const match = state.excavatedFragments.find((f) => f.id === cell.fragmentId);
      if (!match) {
        foundFragment = state.excavatedFragments[0]
          ? state.excavatedFragments[0]
          : undefined;
      }
      set({ grid: newGrid });
      return { hasFragment: true, fragment: foundFragment };
    }

    set({ grid: newGrid });
    return { hasFragment: false };
  },

  addFragment: (fragment) =>
    set((s) => ({
      excavatedFragments: s.excavatedFragments.find((f) => f.id === fragment.id)
        ? s.excavatedFragments
        : [...s.excavatedFragments, fragment],
    })),

  removeFragment: (id) =>
    set((s) => ({
      excavatedFragments: s.excavatedFragments.filter((f) => f.id !== id),
    })),

  placeFragment: (fragmentId, x, y) =>
    set((s) => {
      if (s.placedFragments[fragmentId]) return {};
      const fragment = s.excavatedFragments.find((f) => f.id === fragmentId);
      return {
        placedFragments: {
          ...s.placedFragments,
          [fragmentId]: {
            id: fragmentId,
            x,
            y,
            rotation: fragment?.initialRotation ?? 0,
            flipped: fragment?.initialFlipped ?? false,
            matched: false,
          },
        },
      };
    }),

  updateFragment: (fragmentId, updates) =>
    set((s) => {
      if (!s.placedFragments[fragmentId]) return {};
      return {
        placedFragments: {
          ...s.placedFragments,
          [fragmentId]: { ...s.placedFragments[fragmentId], ...updates },
        },
      };
    }),

  rotateFragment: (fragmentId, delta) =>
    set((s) => {
      if (!s.placedFragments[fragmentId]) return {};
      const f = s.placedFragments[fragmentId];
      return {
        placedFragments: {
          ...s.placedFragments,
          [fragmentId]: { ...f, rotation: (f.rotation + delta + 360) % 360 },
        },
      };
    }),

  flipFragment: (fragmentId) =>
    set((s) => {
      if (!s.placedFragments[fragmentId]) return {};
      const f = s.placedFragments[fragmentId];
      return {
        placedFragments: {
          ...s.placedFragments,
          [fragmentId]: { ...f, flipped: !f.flipped },
        },
      };
    }),

  setSelectedFragment: (id) => set({ selectedFragmentId: id }),

  matchFragment: (fragmentId) =>
    set((s) => {
      if (!s.placedFragments[fragmentId]) return {};
      return {
        placedFragments: {
          ...s.placedFragments,
          [fragmentId]: { ...s.placedFragments[fragmentId], matched: true },
        },
      };
    }),

  setRecords: (records) => set({ restorationRecords: records }),
  addRecord: (record) =>
    set((s) => ({ restorationRecords: [...s.restorationRecords, record] })),

  setParticles: (particles) => set({ particles }),
  addFlareCell: (cell) => set((s) => ({ flareCells: [...s.flareCells, cell] })),
  clearFlareCell: (row, col) =>
    set((s) => ({
      flareCells: s.flareCells.filter((c) => !(c.row === row && c.col === col)),
    })),

  startDigTimer: () => set({ digStartTime: Date.now() }),
  endDigTimer: () => {
    const start = get().digStartTime ?? Date.now();
    const elapsed = Math.floor((Date.now() - start) / 1000);
    set({ digEndTime: Date.now() });
    return elapsed;
  },

  toggleWorkbench: (show) =>
    set((s) => ({ showWorkbench: show !== undefined ? show : !s.showWorkbench })),

  setWorkbenchProgress: (progress) => set({ workbenchProgress: progress }),

  setShowRating: (show) => set({ showRating: show }),
  setLastRating: (rating) => set({ lastRating: rating }),
  setMatchFlash: (id) => set({ matchFlash: id }),

  resetGame: () =>
    set({
      currentSite: null,
      currentArtifactId: null,
      excavatedFragments: [],
      placedFragments: {},
      selectedFragmentId: null,
      grid: createInitialGrid(GRID_ROWS, GRID_COLS),
      particles: [],
      flareCells: [],
      digStartTime: null,
      digEndTime: null,
      showWorkbench: false,
      workbenchProgress: 0,
      showRating: false,
      lastRating: null,
      matchFlash: null,
    }),
}));
