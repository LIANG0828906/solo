export type ScaleNote = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

export interface BellState {
  id: string;
  position: [number, number, number];
  targetPosition: [number, number, number] | null;
  scaleNote: ScaleNote | null;
  size: number;
  isDragging: boolean;
  isRinging: boolean;
  isHarmonizing: boolean;
  ringIntensity: number;
  floatOffset: number;
}

export interface PlayedNote {
  id: string;
  note: ScaleNote;
  octave: number;
  velocity: number;
  timestamp: number;
  duration: number;
}

export interface ParticleData {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface GameState {
  bells: BellState[];
  playedNotes: PlayedNote[];
  velocity: number;
  bellCount: number;
  particles: ParticleData[];
  harmonyPairs: Set<string>;
  setVelocity: (v: number) => void;
  setBellCount: (n: number) => void;
  addBell: () => void;
  removeBell: () => void;
  updateBellPosition: (id: string, pos: [number, number, number], isDragging: boolean) => void;
  placeBellOnScale: (id: string, note: ScaleNote, pos: [number, number, number]) => void;
  triggerBellRing: (id: string, intensity: number) => void;
  triggerHarmony: (id1: string, id2: string) => void;
  addPlayedNote: (note: Omit<PlayedNote, 'id' | 'timestamp'>) => void;
  addParticles: (position: [number, number, number], color: string, count: number) => void;
  updateParticles: (delta: number) => void;
  resetBells: () => void;
  clearHarmonyPairs: () => void;
}
