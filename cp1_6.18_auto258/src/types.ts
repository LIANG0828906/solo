export type Mode = 'free' | 'beat' | 'chord';

export interface ColumnState {
  id: string;
  row: number;
  col: number;
  baseHeight: number;
  currentHeight: number;
  frequency: number;
  waveform: OscillatorType;
  isLocked: boolean;
  isPulsing: boolean;
  rippleIntensity: number;
  opacity: number;
  breathePhase: number;
}

export interface AppState {
  mode: Mode;
  columns: ColumnState[];
  gridSize: number;
  lockedColumnId: string | null;
  modeFlash: number;
  setMode: (mode: Mode) => void;
  setGridSize: (size: number) => void;
  triggerColumn: (id: string, delay?: number) => void;
  lockColumn: (id: string) => void;
  unlockColumn: (id: string) => void;
  triggerRipple: (centerId: string) => void;
  triggerChord: (centerId: string) => void;
  updateBreathePhase: (id: string, phase: number) => void;
  updateColumnHeight: (id: string, height: number) => void;
  updateRippleIntensity: (id: string, intensity: number) => void;
  setModeFlash: (value: number) => void;
  resetPulseState: (id: string) => void;
}

export const WAVEFORM_TYPES: OscillatorType[] = ['sine', 'triangle', 'sawtooth'];
