export interface Note {
  id: string;
  pitch: number;
  frequency: number;
  velocity: number;
  timestamp: number;
  duration: number;
}

export type PlayNoteCallback = (pitch: number, velocity: number) => void;

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function getFrequency(pitch: number): number {
  return 440 * Math.pow(2, (pitch - 9) / 12);
}

export function getNoteName(pitch: number): string {
  return NOTE_NAMES[pitch] + '4';
}
