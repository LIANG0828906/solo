export type NoteName = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
export type NoteDuration = 'whole' | 'half' | 'quarter' | 'eighth';
export type ScaleType = 'major' | 'minor';

export interface Note {
  name: NoteName;
  octave: number;
  frequency: number;
  staffOffset: number;
}

export interface ScaleRule {
  name: string;
  type: ScaleType;
  root: NoteName;
  notes: NoteName[];
}

export interface ChordRule {
  name: string;
  notes: NoteName[];
  displayName: string;
}

const NOTE_FREQUENCIES: Record<NoteName, number> = {
  C: 261.63,
  D: 293.66,
  E: 329.63,
  F: 349.23,
  G: 392.00,
  A: 440.00,
  B: 493.88,
};

const NOTE_ORDER: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const STAFF_OFFSETS: Record<NoteName, number> = {
  C: 6,
  D: 5,
  E: 4,
  F: 3,
  G: 2,
  A: 1,
  B: 0,
};

export const ALL_NOTE_NAMES: NoteName[] = NOTE_ORDER;

export function getNoteFrequency(name: NoteName, octave: number = 4): number {
  const base = NOTE_FREQUENCIES[name];
  return base * Math.pow(2, octave - 4);
}

export function getNoteStaffOffset(name: NoteName): number {
  return STAFF_OFFSETS[name];
}

export function createNote(name: NoteName, octave: number = 4): Note {
  return {
    name,
    octave,
    frequency: getNoteFrequency(name, octave),
    staffOffset: getNoteStaffOffset(name),
  };
}

const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

const MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

function buildScale(root: NoteName, type: ScaleType): NoteName[] {
  const rootIndex = NOTE_ORDER.indexOf(root);
  const intervals = type === 'major' ? MAJOR_INTERVALS : MINOR_INTERVALS;
  return intervals.map((interval) => {
    const idx = (rootIndex + interval) % 7;
    return NOTE_ORDER[idx];
  });
}

export const SCALES: ScaleRule[] = [
  { name: 'C 大调', type: 'major', root: 'C', notes: buildScale('C', 'major') },
  { name: 'G 大调', type: 'major', root: 'G', notes: buildScale('G', 'major') },
  { name: 'D 大调', type: 'major', root: 'D', notes: buildScale('D', 'major') },
  { name: 'F 大调', type: 'major', root: 'F', notes: buildScale('F', 'major') },
  { name: 'A 小调', type: 'minor', root: 'A', notes: buildScale('A', 'minor') },
  { name: 'E 小调', type: 'minor', root: 'E', notes: buildScale('E', 'minor') },
  { name: 'D 小调', type: 'minor', root: 'D', notes: buildScale('D', 'minor') },
];

export const CHORDS: ChordRule[] = [
  { name: 'C', displayName: 'C major', notes: ['C', 'E', 'G'] },
  { name: 'Dm', displayName: 'D minor', notes: ['D', 'F', 'A'] },
  { name: 'Em', displayName: 'E minor', notes: ['E', 'G', 'B'] },
  { name: 'F', displayName: 'F major', notes: ['F', 'A', 'C'] },
  { name: 'G', displayName: 'G major', notes: ['G', 'B', 'D'] },
  { name: 'Am', displayName: 'Am', notes: ['A', 'C', 'E'] },
  { name: 'Bdim', displayName: 'B dim', notes: ['B', 'D', 'F'] },
  { name: 'G7', displayName: 'G7', notes: ['G', 'B', 'D', 'F'] },
  { name: 'C7', displayName: 'C7', notes: ['C', 'E', 'G', 'B'] },
  { name: 'Dm7', displayName: 'Dm7', notes: ['D', 'F', 'A', 'C'] },
  { name: 'F7', displayName: 'F7', notes: ['F', 'A', 'C', 'E'] },
  { name: 'Am7', displayName: 'Am7', notes: ['A', 'C', 'E', 'G'] },
];

export const NOTE_DURATIONS: { type: NoteDuration; label: string; symbol: string }[] = [
  { type: 'whole', label: '全音符', symbol: '𝅝' },
  { type: 'half', label: '二分音符', symbol: '𝅗𝅥' },
  { type: 'quarter', label: '四分音符', symbol: '♩' },
  { type: 'eighth', label: '八分音符', symbol: '♪' },
];
