export interface NoteInfo {
  pitch: string;
  duration: number;
  startX: number;
  endX: number;
  y: number;
  measure: number;
  index: number;
}

export type InstrumentType = 'piano' | 'electricPiano' | 'strings';

export type PlayState = 'stopped' | 'playing' | 'paused';

export interface PlayerState {
  playState: PlayState;
  currentMeasure: number;
  currentNoteIndex: number;
  bpm: number;
  instrument: InstrumentType;
}
