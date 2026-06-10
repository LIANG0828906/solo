export interface Buoy {
  id: string;
  position: [number, number, number];
  color: string;
  pitch: number;
  frequency: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'create' | 'move' | 'click' | 'frequency';
  message: string;
  pitchChange?: number;
}

export interface AppState {
  buoys: Buoy[];
  frequency: number;
  logs: LogEntry[];
  selectedBuoyId: string | null;
  addBuoy: (position: [number, number, number]) => void;
  removeBuoy: (id: string) => void;
  updateBuoyPosition: (id: string, position: [number, number, number]) => void;
  setFrequency: (freq: number) => void;
  triggerBuoySound: (id: string) => void;
  reset: () => void;
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  setSelectedBuoy: (id: string | null) => void;
}

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const BUOY_COLORS = [
  '#ff6b6b',
  '#4ecdc4',
  '#ffe66d',
  '#95e1d3',
  '#f38181',
  '#aa96da',
  '#6c5ce7',
  '#00b894',
];
