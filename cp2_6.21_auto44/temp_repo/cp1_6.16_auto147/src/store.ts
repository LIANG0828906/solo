import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  PlotType,
  BlockConfig,
  SimulationResult,
  runSimulation,
  generatePresetLayout,
} from './utils/simulation';

export interface PresetScheme {
  id: string;
  name: string;
  description: string;
  canopyCoverage: number;
  tempEffectDesc: string;
  humidityEffectDesc: string;
  windEffectDesc: string;
}

export const PRESET_SCHEMES: PresetScheme[] = [
  {
    id: 'dense-forest',
    name: '高密度乔木林',
    description: '树冠覆盖率70%，降温效果最强',
    canopyCoverage: 70,
    tempEffectDesc: '降温显著',
    humidityEffectDesc: '湿度提升中等',
    windEffectDesc: '风速减弱明显',
  },
  {
    id: 'mixed-greenbelt',
    name: '混合绿带',
    description: '树+草+水体，湿度提升明显',
    canopyCoverage: 45,
    tempEffectDesc: '降温中等',
    humidityEffectDesc: '湿度提升显著',
    windEffectDesc: '风速减弱中等',
  },
  {
    id: 'eco-plaza',
    name: '生态广场',
    description: '硬地+分散树池，风速影响最小',
    canopyCoverage: 20,
    tempEffectDesc: '降温较弱',
    humidityEffectDesc: '湿度提升较弱',
    windEffectDesc: '风速影响最小',
  },
];

export interface SavedScheme {
  id: string;
  name: string;
  timestamp: number;
  blockConfig: BlockConfig;
  plots: PlotType[][];
  result: SimulationResult | null;
  thumbnail: string;
}

interface AppState {
  blockConfig: BlockConfig;
  plots: PlotType[][];
  selectedPlotType: PlotType;
  isSimulating: boolean;
  simulationResult: SimulationResult | null;
  savedSchemes: SavedScheme[];
  activePreset: string | null;
  showSaveDialog: boolean;
  hoveredPlot: { x: number; y: number } | null;

  setBlockSize: (width: number, depth: number) => void;
  setSelectedPlotType: (type: PlotType) => void;
  setPlot: (x: number, y: number, type: PlotType) => void;
  setHoveredPlot: (plot: { x: number; y: number } | null) => void;
  applyPreset: (presetId: string) => void;
  runSimulation: () => Promise<void>;
  setShowSaveDialog: (show: boolean) => void;
  saveScheme: (name: string, thumbnail: string) => void;
  loadScheme: (id: string) => void;
  deleteScheme: (id: string) => void;
  loadSavedSchemes: () => void;
}

const STORAGE_KEY = 'microclimate_schemes';
const MAX_SAVED_SCHEMES = 5;

const DEFAULT_CONFIG: BlockConfig = {
  width: 60,
  depth: 40,
  gridSize: 20,
};

function getGridDimensions(config: BlockConfig): { cols: number; rows: number } {
  const cols = Math.floor(config.width / 5);
  const rows = Math.floor(config.depth / 5);
  return { cols: Math.max(1, cols), rows: Math.max(1, rows) };
}

function createEmptyPlots(cols: number, rows: number): PlotType[][] {
  const plots: PlotType[][] = [];
  for (let y = 0; y < rows; y++) {
    plots[y] = [];
    for (let x = 0; x < cols; x++) {
      plots[y][x] = 'pavement';
    }
  }
  return plots;
}

function loadFromStorage(): SavedScheme[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    return [];
  }
  return [];
}

function saveToStorage(schemes: SavedScheme[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schemes));
  } catch {
    console.error('Failed to save schemes to localStorage');
  }
}

export const useAppStore = create<AppState>((set, get) => {
  const { cols, rows } = getGridDimensions(DEFAULT_CONFIG);

  return {
    blockConfig: DEFAULT_CONFIG,
    plots: createEmptyPlots(cols, rows),
    selectedPlotType: 'tree',
    isSimulating: false,
    simulationResult: null,
    savedSchemes: [],
    activePreset: null,
    showSaveDialog: false,
    hoveredPlot: null,

    setBlockSize: (width: number, depth: number) => {
      const newConfig: BlockConfig = {
        ...get().blockConfig,
        width,
        depth,
      };
      const { cols, rows } = getGridDimensions(newConfig);
      const oldPlots = get().plots;
      const newPlots = createEmptyPlots(cols, rows);

      const oldRows = oldPlots.length;
      const oldCols = oldPlots[0]?.length || 0;

      for (let y = 0; y < Math.min(rows, oldRows); y++) {
        for (let x = 0; x < Math.min(cols, oldCols); x++) {
          newPlots[y][x] = oldPlots[y][x];
        }
      }

      set({ blockConfig: newConfig, plots: newPlots, simulationResult: null });
    },

    setSelectedPlotType: (type: PlotType) => {
      set({ selectedPlotType: type });
    },

    setPlot: (x: number, y: number, type: PlotType) => {
      const plots = get().plots;
      if (y >= 0 && y < plots.length && x >= 0 && x < plots[0].length) {
        const newPlots = plots.map((row, yi) =>
          row.map((p, xi) => (xi === x && yi === y ? type : p))
        );
        set({ plots: newPlots, activePreset: null, simulationResult: null });
      }
    },

    setHoveredPlot: (plot: { x: number; y: number } | null) => {
      set({ hoveredPlot: plot });
    },

    applyPreset: (presetId: string) => {
      const config = get().blockConfig;
      const { cols, rows } = getGridDimensions(config);
      const layout = generatePresetLayout(presetId, cols, rows);
      set({ plots: layout, activePreset: presetId, simulationResult: null });
    },

    runSimulation: async () => {
      const { plots, blockConfig, isSimulating } = get();
      if (isSimulating) return;

      set({ isSimulating: true });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const result = runSimulation(plots, blockConfig);
      set({ simulationResult: result, isSimulating: false });
    },

    setShowSaveDialog: (show: boolean) => {
      set({ showSaveDialog: show });
    },

    saveScheme: (name: string, thumbnail: string) => {
      const { blockConfig, plots, simulationResult, savedSchemes } = get();
      const newScheme: SavedScheme = {
        id: uuidv4(),
        name,
        timestamp: Date.now(),
        blockConfig: { ...blockConfig },
        plots: plots.map((row) => [...row]),
        result: simulationResult ? { ...simulationResult } : null,
        thumbnail,
      };

      const newSchemes = [newScheme, ...savedSchemes].slice(
        0,
        MAX_SAVED_SCHEMES
      );
      saveToStorage(newSchemes);
      set({ savedSchemes: newSchemes, showSaveDialog: false });
    },

    loadScheme: (id: string) => {
      const scheme = get().savedSchemes.find((s) => s.id === id);
      if (scheme) {
        set({
          blockConfig: { ...scheme.blockConfig },
          plots: scheme.plots.map((row) => [...row]),
          simulationResult: scheme.result ? { ...scheme.result } : null,
          activePreset: null,
        });
      }
    },

    deleteScheme: (id: string) => {
      const newSchemes = get().savedSchemes.filter((s) => s.id !== id);
      saveToStorage(newSchemes);
      set({ savedSchemes: newSchemes });
    },

    loadSavedSchemes: () => {
      const schemes = loadFromStorage();
      set({ savedSchemes: schemes });
    },
  };
});
