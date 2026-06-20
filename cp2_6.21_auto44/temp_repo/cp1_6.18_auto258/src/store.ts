import { create } from 'zustand';
import { AppState, ColumnState, Mode, WAVEFORM_TYPES } from './types';
import { audioEngine } from './audioEngine';

const generateColumns = (gridSize: number): ColumnState[] => {
  const columns: ColumnState[] = [];
  const minFreq = 220;
  const maxFreq = 880;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const freqRatio = col / (gridSize - 1);
      const frequency = minFreq + (maxFreq - minFreq) * freqRatio;
      
      const waveformIndex = Math.min(
        Math.floor(freqRatio * WAVEFORM_TYPES.length),
        WAVEFORM_TYPES.length - 1
      );

      columns.push({
        id: `${row}-${col}`,
        row,
        col,
        baseHeight: 30 + Math.random() * 170,
        currentHeight: 30 + Math.random() * 170,
        frequency,
        waveform: WAVEFORM_TYPES[waveformIndex],
        isLocked: false,
        isPulsing: false,
        rippleIntensity: 0,
        opacity: 1,
        breathePhase: 0,
      });
    }
  }
  return columns;
};

const getInitialGridSize = (): number => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 600 ? 5 : 7;
  }
  return 7;
};

export const useStore = create<AppState>((set, get) => ({
  mode: 'free',
  gridSize: getInitialGridSize(),
  columns: generateColumns(getInitialGridSize()),
  lockedColumnId: null,
  modeFlash: 0,

  setMode: (mode: Mode) => {
    set({ mode });
    get().setModeFlash(0.3);
    setTimeout(() => get().setModeFlash(0), 100);
  },

  setGridSize: (size: number) => {
    set({ gridSize: size, columns: generateColumns(size) });
  },

  setModeFlash: (value: number) => {
    set({ modeFlash: value });
  },

  triggerColumn: (id: string, delay: number = 0) => {
    const { columns, mode } = get();
    const column = columns.find(c => c.id === id);
    if (!column) return;

    const actualDelay = mode === 'beat' ? delay || Math.random() * 3000 : delay;

    setTimeout(() => {
      audioEngine.playTone(column.frequency, column.waveform, 0.3, 0.5);
      
      set(state => ({
        columns: state.columns.map(c =>
          c.id === id ? { ...c, isPulsing: true } : c
        ),
      }));

      setTimeout(() => {
        get().resetPulseState(id);
      }, 150);
    }, actualDelay);
  },

  resetPulseState: (id: string) => {
    set(state => ({
      columns: state.columns.map(c =>
        c.id === id ? { ...c, isPulsing: false } : c
      ),
    }));
  },

  lockColumn: (id: string) => {
    const { columns, lockedColumnId } = get();
    const column = columns.find(c => c.id === id);
    if (!column) return;

    if (lockedColumnId && lockedColumnId !== id) {
      get().unlockColumn(lockedColumnId);
    }

    audioEngine.startContinuousTone(column.frequency * 0.5, 0.2);

    set(state => ({
      lockedColumnId: id,
      columns: state.columns.map(c =>
        c.id === id ? { ...c, isLocked: true } : c
      ),
    }));
  },

  unlockColumn: (id: string) => {
    audioEngine.stopContinuousTone();
    
    set(state => ({
      lockedColumnId: null,
      columns: state.columns.map(c =>
        c.id === id ? { ...c, isLocked: false, opacity: 1 } : c
      ),
    }));
  },

  triggerRipple: (centerId: string) => {
    const { columns, gridSize } = get();
    const center = columns.find(c => c.id === centerId);
    if (!center) return;

    const maxDistance = gridSize - 1;
    
    columns.forEach(col => {
      if (col.id === centerId) return;

      const distance = Math.max(
        Math.abs(col.row - center.row),
        Math.abs(col.col - center.col)
      );

      if (distance <= 3) {
        const intensity = (1 - distance / maxDistance) * 0.5;
        
        setTimeout(() => {
          get().updateRippleIntensity(col.id, intensity);
          
          setTimeout(() => {
            get().updateRippleIntensity(col.id, 0);
          }, 500);
        }, distance * 50);
      }
    });
  },

  triggerChord: (centerId: string) => {
    const { columns, gridSize } = get();
    const center = columns.find(c => c.id === centerId);
    if (!center) return;

    const affectedColumns: string[] = [];
    
    for (let r = center.row - 1; r <= center.row + 1; r++) {
      for (let c = center.col - 1; c <= center.col + 1; c++) {
        if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
          affectedColumns.push(`${r}-${c}`);
        }
      }
    }

    affectedColumns.forEach(id => {
      get().triggerColumn(id);
    });
  },

  updateBreathePhase: (id: string, phase: number) => {
    set(state => ({
      columns: state.columns.map(c =>
        c.id === id ? { ...c, breathePhase: phase } : c
      ),
    }));
  },

  updateColumnHeight: (id: string, height: number) => {
    set(state => ({
      columns: state.columns.map(c =>
        c.id === id ? { ...c, currentHeight: height } : c
      ),
    }));
  },

  updateRippleIntensity: (id: string, intensity: number) => {
    set(state => ({
      columns: state.columns.map(c =>
        c.id === id ? { ...c, rippleIntensity: intensity } : c
      ),
    }));
  },
}));
