export type TrainingMode = 'interval' | 'chord' | 'scale'

export type WaveType = 'sine' | 'triangle' | 'square'

export type NoteName =
  | 'C'
  | 'C#'
  | 'D'
  | 'D#'
  | 'E'
  | 'F'
  | 'F#'
  | 'G'
  | 'G#'
  | 'A'
  | 'A#'
  | 'B'

export const ALL_NOTES: NoteName[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F',
  'F#', 'G', 'G#', 'A', 'A#', 'B',
]

export const WHITE_KEYS: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
export const BLACK_KEYS: NoteName[] = ['C#', 'D#', 'F#', 'G#', 'A#']

export const NOTE_FREQUENCIES: Record<NoteName, number> = {
  C: 261.63,
  'C#': 277.18,
  D: 293.66,
  'D#': 311.13,
  E: 329.63,
  F: 349.23,
  'F#': 369.99,
  G: 392.00,
  'G#': 415.30,
  A: 440.00,
  'A#': 466.16,
  B: 493.88,
}

export interface IntervalQuestion {
  type: 'interval'
  note1: NoteName
  note2: NoteName
  intervalName: string
  semitones: number
}

export interface ChordQuestion {
  type: 'chord'
  notes: NoteName[]
  chordName: string
}

export interface ScaleQuestion {
  type: 'scale'
  rootNote: NoteName
  scaleName: string
  notes: NoteName[]
}

export type Question = IntervalQuestion | ChordQuestion | ScaleQuestion

export interface ChordType {
  name: string
  intervals: number[]
}

export interface ScaleType {
  name: string
  intervals: number[]
}

export const INTERVAL_NAMES: Record<number, string> = {
  0: '纯一度',
  1: '小二度',
  2: '大二度',
  3: '小三度',
  4: '大三度',
  5: '纯四度',
  6: '增四度/减五度',
  7: '纯五度',
  8: '小六度',
  9: '大六度',
  10: '小七度',
  11: '大七度',
  12: '纯八度',
}

export const CHORD_TYPES: ChordType[] = [
  { name: '大三和弦', intervals: [0, 4, 7] },
  { name: '小三和弦', intervals: [0, 3, 7] },
  { name: '增三和弦', intervals: [0, 4, 8] },
  { name: '减三和弦', intervals: [0, 3, 6] },
  { name: '大七和弦', intervals: [0, 4, 7, 11] },
  { name: '小七和弦', intervals: [0, 3, 7, 10] },
  { name: '属七和弦', intervals: [0, 4, 7, 10] },
  { name: '减七和弦', intervals: [0, 3, 6, 9] },
]

export const SCALE_TYPES: ScaleType[] = [
  { name: '自然大调', intervals: [2, 2, 1, 2, 2, 2, 1] },
  { name: '自然小调', intervals: [2, 1, 2, 2, 1, 2, 2] },
  { name: '多利亚调式', intervals: [2, 1, 2, 2, 2, 1, 2] },
  { name: '弗里几亚调式', intervals: [1, 2, 2, 2, 1, 2, 2] },
  { name: '利底亚调式', intervals: [2, 2, 2, 1, 2, 2, 1] },
  { name: '混合利底亚调式', intervals: [2, 2, 1, 2, 2, 1, 2] },
]

export function getNoteIndex(note: NoteName): number {
  return ALL_NOTES.indexOf(note)
}

export function getNoteFromIndex(index: number): NoteName {
  return ALL_NOTES[((index % 12) + 12) % 12]
}

export function buildNotesFromRoot(root: NoteName, intervals: number[]): NoteName[] {
  const rootIndex = getNoteIndex(root)
  const notes: NoteName[] = [root]
  let current = rootIndex
  for (const interval of intervals) {
    current = (current + interval) % 12
    notes.push(getNoteFromIndex(current))
  }
  return notes
}

export function isBlackKey(note: NoteName): boolean {
  return BLACK_KEYS.includes(note)
}
