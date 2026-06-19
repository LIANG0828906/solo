export type InstrumentType = 'vocal' | 'guitar' | 'keyboard' | 'drums' | 'bass';

export interface Lick {
  id: string;
  name: string;
  audioBlob: Blob | null;
  audioUrl: string;
  waveformData: number[];
  duration: number;
  timestamp: number;
  instrument: InstrumentType;
  key: string;
  bpm: number;
  tags: string[];
}

export type ChordRoot = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type ChordType = 'Major' | 'Minor' | 'Dim' | 'Aug' | 'Sus4' | 'Sus2' | '7th';

export interface Chord {
  id: string;
  root: ChordRoot;
  type: ChordType;
  order: number;
  duration: number;
}

export interface Preset {
  id: string;
  name: string;
  instrument: InstrumentType;
  description: string;
  imageUrl: string;
}

export interface PlayerState {
  isPlaying: boolean;
  currentLickId: string | null;
  currentTime: number;
  playbackRate: number;
}

export interface UIState {
  leftPanelWidth: number;
  rightPanelWidth: number;
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  isMobile: boolean;
  selectedLickId: string | null;
  appliedPresetId: string | null;
  chordPlayPosition: number;
}
