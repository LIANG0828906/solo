import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { BulletPattern, BulletPatternType } from '../utils/bulletPhysics';

export interface Wave {
  id: string;
  name: string;
  patterns: string[];
  spawnInterval: number;
  spawnPositionX: number;
  triggerTime: number;
  duration: number;
  color: string;
}

interface EditorState {
  patterns: BulletPattern[];
  waves: Wave[];
  selectedPatternId: string | null;
  selectedWaveId: string | null;
  isPlaying: boolean;
  currentTime: number;

  addPattern: (type?: BulletPatternType) => void;
  updatePattern: (id: string, updates: Partial<BulletPattern>) => void;
  deletePattern: (id: string) => void;
  selectPattern: (id: string | null) => void;

  addWave: () => void;
  updateWave: (id: string, updates: Partial<Wave>) => void;
  deleteWave: (id: string) => void;
  selectWave: (id: string | null) => void;
  reorderWaves: (fromIndex: number, toIndex: number) => void;

  addPatternToWave: (waveId: string, patternId: string) => void;
  removePatternFromWave: (waveId: string, patternId: string) => void;

  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;

  loadPreset: (presetName: string) => void;
  exportToJSON: () => string;
}

const createPresetPatterns = (): BulletPattern[] => [
  {
    id: 'preset-fan',
    type: 'fan',
    angleRange: 60,
    bulletSpeed: 3,
    bulletDensity: 8,
    colorStart: '#00d4ff',
    colorEnd: '#0099cc',
    gravityEnabled: false,
    gravityStrength: 0.1,
  },
  {
    id: 'preset-spiral',
    type: 'spiral',
    angleRange: 360,
    bulletSpeed: 2.5,
    bulletDensity: 12,
    colorStart: '#ff6b35',
    colorEnd: '#ff9f43',
    gravityEnabled: false,
    gravityStrength: 0.1,
  },
  {
    id: 'preset-spread',
    type: 'spread',
    angleRange: 180,
    bulletSpeed: 4,
    bulletDensity: 20,
    colorStart: '#ff0066',
    colorEnd: '#ff3399',
    gravityEnabled: true,
    gravityStrength: 0.05,
  },
];

const createInitialWaves = (): Wave[] => [
  {
    id: 'wave-1',
    name: '第一波',
    patterns: ['preset-fan'],
    spawnInterval: 1.5,
    spawnPositionX: 10,
    triggerTime: 0,
    duration: 5,
    color: '#00d4ff',
  },
];

export const useEditorStore = create<EditorState>((set, get) => ({
  patterns: createPresetPatterns(),
  waves: createInitialWaves(),
  selectedPatternId: 'preset-fan',
  selectedWaveId: 'wave-1',
  isPlaying: true,
  currentTime: 0,

  addPattern: (type: BulletPatternType = 'fan') => {
    const newPattern: BulletPattern = {
      id: uuidv4(),
      type,
      angleRange: 60,
      bulletSpeed: 3,
      bulletDensity: 8,
      colorStart: '#00d4ff',
      colorEnd: '#0099cc',
      gravityEnabled: false,
      gravityStrength: 0.1,
    };
    set((state) => ({
      patterns: [...state.patterns, newPattern],
      selectedPatternId: newPattern.id,
    }));
  },

  updatePattern: (id: string, updates: Partial<BulletPattern>) => {
    set((state) => ({
      patterns: state.patterns.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },

  deletePattern: (id: string) => {
    set((state) => {
      const newPatterns = state.patterns.filter((p) => p.id !== id);
      const newWaves = state.waves.map((w) => ({
        ...w,
        patterns: w.patterns.filter((pid) => pid !== id),
      }));
      return {
        patterns: newPatterns,
        waves: newWaves,
        selectedPatternId:
          state.selectedPatternId === id
            ? newPatterns[0]?.id || null
            : state.selectedPatternId,
      };
    });
  },

  selectPattern: (id: string | null) => {
    set({ selectedPatternId: id });
  },

  addWave: () => {
    const { waves } = get();
    const lastWave = waves[waves.length - 1];
    const newTriggerTime = lastWave
      ? lastWave.triggerTime + lastWave.duration + 1
      : 0;

    const colors = ['#00d4ff', '#ff6b35', '#00ff88', '#ff0066', '#9966ff'];
    const colorIndex = waves.length % colors.length;

    const newWave: Wave = {
      id: uuidv4(),
      name: `第${waves.length + 1}波`,
      patterns: [],
      spawnInterval: 2,
      spawnPositionX: 15,
      triggerTime: newTriggerTime,
      duration: 5,
      color: colors[colorIndex],
    };
    set((state) => ({
      waves: [...state.waves, newWave],
      selectedWaveId: newWave.id,
    }));
  },

  updateWave: (id: string, updates: Partial<Wave>) => {
    set((state) => ({
      waves: state.waves.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
    }));
  },

  deleteWave: (id: string) => {
    set((state) => {
      const newWaves = state.waves.filter((w) => w.id !== id);
      return {
        waves: newWaves,
        selectedWaveId:
          state.selectedWaveId === id
            ? newWaves[0]?.id || null
            : state.selectedWaveId,
      };
    });
  },

  selectWave: (id: string | null) => {
    set({ selectedWaveId: id });
  },

  reorderWaves: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const newWaves = [...state.waves];
      const [removed] = newWaves.splice(fromIndex, 1);
      newWaves.splice(toIndex, 0, removed);
      return { waves: newWaves };
    });
  },

  addPatternToWave: (waveId: string, patternId: string) => {
    set((state) => ({
      waves: state.waves.map((w) => {
        if (w.id !== waveId) return w;
        if (w.patterns.length >= 3) return w;
        if (w.patterns.includes(patternId)) return w;
        return { ...w, patterns: [...w.patterns, patternId] };
      }),
    }));
  },

  removePatternFromWave: (waveId: string, patternId: string) => {
    set((state) => ({
      waves: state.waves.map((w) => {
        if (w.id !== waveId) return w;
        return { ...w, patterns: w.patterns.filter((p) => p !== patternId) };
      }),
    }));
  },

  setPlaying: (playing: boolean) => {
    set({ isPlaying: playing });
  },

  setCurrentTime: (time: number) => {
    set({ currentTime: time });
  },

  loadPreset: (presetName: string) => {
    const presets = createPresetPatterns();
    const preset = presets.find((p) => p.id.includes(presetName));
    if (preset) {
      const newPattern = { ...preset, id: uuidv4() };
      set((state) => ({
        patterns: [...state.patterns, newPattern],
        selectedPatternId: newPattern.id,
      }));
    }
  },

  exportToJSON: () => {
    const state = get();
    const exportData = {
      version: '1.0',
      patterns: state.patterns,
      waves: state.waves.map((w) => ({
        ...w,
        patternIds: w.patterns,
      })),
    };
    return JSON.stringify(exportData, null, 2);
  },
}));
