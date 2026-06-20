export interface FingerPosition {
  string: number;
  fret: number;
  finger: number;
}

export interface ChordData {
  name: string;
  type: 'major' | 'minor' | 'dominant7' | 'major7' | 'minor7';
  positions: FingerPosition[];
  notes: string[];
  intervals: string[];
  openStrings: number[];
  mutedStrings: number[];
}

export interface InstrumentData {
  id: 'guitar' | 'ukulele';
  name: string;
  stringCount: number;
  fretCount: number;
  tuning: string[];
  chords: ChordData[];
}

const guitarChords: ChordData[] = [
  {
    name: 'C',
    type: 'major',
    positions: [
      { string: 1, fret: 3, finger: 3 },
      { string: 2, fret: 2, finger: 2 },
      { string: 4, fret: 1, finger: 1 },
    ],
    notes: ['C', 'E', 'G'],
    intervals: ['根音', '大三度', '纯五度'],
    openStrings: [3, 5],
    mutedStrings: [0],
  },
  {
    name: 'D',
    type: 'major',
    positions: [
      { string: 3, fret: 2, finger: 1 },
      { string: 4, fret: 3, finger: 3 },
      { string: 5, fret: 2, finger: 2 },
    ],
    notes: ['D', 'F#', 'A'],
    intervals: ['根音', '大三度', '纯五度'],
    openStrings: [2],
    mutedStrings: [0, 1],
  },
  {
    name: 'E',
    type: 'major',
    positions: [
      { string: 1, fret: 2, finger: 2 },
      { string: 2, fret: 2, finger: 3 },
      { string: 3, fret: 1, finger: 1 },
    ],
    notes: ['E', 'G#', 'B'],
    intervals: ['根音', '大三度', '纯五度'],
    openStrings: [0, 4, 5],
    mutedStrings: [],
  },
  {
    name: 'G',
    type: 'major',
    positions: [
      { string: 0, fret: 3, finger: 2 },
      { string: 1, fret: 2, finger: 1 },
      { string: 5, fret: 3, finger: 3 },
    ],
    notes: ['G', 'B', 'D'],
    intervals: ['根音', '大三度', '纯五度'],
    openStrings: [2, 3, 4],
    mutedStrings: [],
  },
  {
    name: 'A',
    type: 'major',
    positions: [
      { string: 2, fret: 2, finger: 1 },
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 2, finger: 3 },
    ],
    notes: ['A', 'C#', 'E'],
    intervals: ['根音', '大三度', '纯五度'],
    openStrings: [1, 5],
    mutedStrings: [0],
  },
  {
    name: 'Am',
    type: 'minor',
    positions: [
      { string: 2, fret: 2, finger: 2 },
      { string: 3, fret: 2, finger: 3 },
      { string: 4, fret: 1, finger: 1 },
    ],
    notes: ['A', 'C', 'E'],
    intervals: ['根音', '小三度', '纯五度'],
    openStrings: [1, 5],
    mutedStrings: [0],
  },
  {
    name: 'Em',
    type: 'minor',
    positions: [
      { string: 1, fret: 2, finger: 2 },
      { string: 2, fret: 2, finger: 3 },
    ],
    notes: ['E', 'G', 'B'],
    intervals: ['根音', '小三度', '纯五度'],
    openStrings: [0, 3, 4, 5],
    mutedStrings: [],
  },
  {
    name: 'Dm',
    type: 'minor',
    positions: [
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 3, finger: 3 },
      { string: 5, fret: 1, finger: 1 },
    ],
    notes: ['D', 'F', 'A'],
    intervals: ['根音', '小三度', '纯五度'],
    openStrings: [2],
    mutedStrings: [0, 1],
  },
  {
    name: 'G7',
    type: 'dominant7',
    positions: [
      { string: 0, fret: 3, finger: 3 },
      { string: 1, fret: 2, finger: 2 },
      { string: 5, fret: 1, finger: 1 },
    ],
    notes: ['G', 'B', 'D', 'F'],
    intervals: ['根音', '大三度', '纯五度', '小七度'],
    openStrings: [2, 3, 4],
    mutedStrings: [],
  },
  {
    name: 'A7',
    type: 'dominant7',
    positions: [
      { string: 2, fret: 2, finger: 2 },
      { string: 4, fret: 2, finger: 3 },
    ],
    notes: ['A', 'C#', 'E', 'G'],
    intervals: ['根音', '大三度', '纯五度', '小七度'],
    openStrings: [1, 3, 5],
    mutedStrings: [0],
  },
  {
    name: 'D7',
    type: 'dominant7',
    positions: [
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 1, finger: 1 },
      { string: 5, fret: 2, finger: 3 },
    ],
    notes: ['D', 'F#', 'A', 'C'],
    intervals: ['根音', '大三度', '纯五度', '小七度'],
    openStrings: [2],
    mutedStrings: [0, 1],
  },
  {
    name: 'B7',
    type: 'dominant7',
    positions: [
      { string: 1, fret: 2, finger: 2 },
      { string: 2, fret: 1, finger: 1 },
      { string: 3, fret: 2, finger: 3 },
      { string: 5, fret: 2, finger: 4 },
    ],
    notes: ['B', 'D#', 'F#', 'A'],
    intervals: ['根音', '大三度', '纯五度', '小七度'],
    openStrings: [4],
    mutedStrings: [0],
  },
];

const ukuleleChords: ChordData[] = [
  {
    name: 'C',
    type: 'major',
    positions: [
      { string: 3, fret: 3, finger: 3 },
    ],
    notes: ['C', 'E', 'G'],
    intervals: ['根音', '大三度', '纯五度'],
    openStrings: [0, 1, 2],
    mutedStrings: [],
  },
  {
    name: 'F',
    type: 'major',
    positions: [
      { string: 0, fret: 2, finger: 1 },
      { string: 2, fret: 1, finger: 2 },
    ],
    notes: ['F', 'A', 'C'],
    intervals: ['根音', '大三度', '纯五度'],
    openStrings: [1, 3],
    mutedStrings: [],
  },
  {
    name: 'G',
    type: 'major',
    positions: [
      { string: 1, fret: 2, finger: 2 },
      { string: 2, fret: 3, finger: 3 },
      { string: 3, fret: 2, finger: 1 },
    ],
    notes: ['G', 'B', 'D'],
    intervals: ['根音', '大三度', '纯五度'],
    openStrings: [0],
    mutedStrings: [],
  },
  {
    name: 'A',
    type: 'major',
    positions: [
      { string: 0, fret: 2, finger: 1 },
      { string: 1, fret: 1, finger: 2 },
    ],
    notes: ['A', 'C#', 'E'],
    intervals: ['根音', '大三度', '纯五度'],
    openStrings: [2, 3],
    mutedStrings: [],
  },
  {
    name: 'D',
    type: 'major',
    positions: [
      { string: 0, fret: 2, finger: 1 },
      { string: 1, fret: 2, finger: 2 },
      { string: 2, fret: 2, finger: 3 },
    ],
    notes: ['D', 'F#', 'A'],
    intervals: ['根音', '大三度', '纯五度'],
    openStrings: [3],
    mutedStrings: [],
  },
  {
    name: 'Am',
    type: 'minor',
    positions: [
      { string: 0, fret: 2, finger: 1 },
    ],
    notes: ['A', 'C', 'E'],
    intervals: ['根音', '小三度', '纯五度'],
    openStrings: [1, 2, 3],
    mutedStrings: [],
  },
  {
    name: 'Dm',
    type: 'minor',
    positions: [
      { string: 0, fret: 2, finger: 2 },
      { string: 1, fret: 2, finger: 3 },
      { string: 2, fret: 1, finger: 1 },
    ],
    notes: ['D', 'F', 'A'],
    intervals: ['根音', '小三度', '纯五度'],
    openStrings: [3],
    mutedStrings: [],
  },
  {
    name: 'Em',
    type: 'minor',
    positions: [
      { string: 1, fret: 2, finger: 2 },
      { string: 2, fret: 3, finger: 3 },
      { string: 3, fret: 2, finger: 1 },
    ],
    notes: ['E', 'G', 'B'],
    intervals: ['根音', '小三度', '纯五度'],
    openStrings: [0],
    mutedStrings: [],
  },
  {
    name: 'G7',
    type: 'dominant7',
    positions: [
      { string: 1, fret: 2, finger: 2 },
      { string: 2, fret: 1, finger: 1 },
      { string: 3, fret: 2, finger: 3 },
    ],
    notes: ['G', 'B', 'D', 'F'],
    intervals: ['根音', '大三度', '纯五度', '小七度'],
    openStrings: [0],
    mutedStrings: [],
  },
  {
    name: 'A7',
    type: 'dominant7',
    positions: [
      { string: 0, fret: 2, finger: 1 },
      { string: 2, fret: 1, finger: 3 },
    ],
    notes: ['A', 'C#', 'E', 'G'],
    intervals: ['根音', '大三度', '纯五度', '小七度'],
    openStrings: [1, 3],
    mutedStrings: [],
  },
  {
    name: 'D7',
    type: 'dominant7',
    positions: [
      { string: 0, fret: 2, finger: 1 },
      { string: 1, fret: 2, finger: 2 },
      { string: 3, fret: 2, finger: 3 },
    ],
    notes: ['D', 'F#', 'A', 'C'],
    intervals: ['根音', '大三度', '纯五度', '小七度'],
    openStrings: [2],
    mutedStrings: [],
  },
  {
    name: 'C7',
    type: 'dominant7',
    positions: [
      { string: 3, fret: 3, finger: 3 },
      { string: 2, fret: 1, finger: 1 },
    ],
    notes: ['C', 'E', 'G', 'Bb'],
    intervals: ['根音', '大三度', '纯五度', '小七度'],
    openStrings: [0, 1],
    mutedStrings: [],
  },
];

export const instruments: InstrumentData[] = [
  {
    id: 'guitar',
    name: '吉他',
    stringCount: 6,
    fretCount: 5,
    tuning: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    chords: guitarChords,
  },
  {
    id: 'ukulele',
    name: '尤克里里',
    stringCount: 4,
    fretCount: 5,
    tuning: ['G4', 'C4', 'E4', 'A4'],
    chords: ukuleleChords,
  },
];

export function getChordColor(type: ChordData['type']): string {
  switch (type) {
    case 'major':
      return '#ff6b35';
    case 'minor':
      return '#4ecdc4';
    case 'dominant7':
      return '#a855f7';
    case 'major7':
      return '#fbbf24';
    case 'minor7':
      return '#38bdf8';
    default:
      return '#6c63ff';
  }
}

export function getChordGradient(type: ChordData['type']): [string, string] {
  switch (type) {
    case 'major':
      return ['#ff6b35', '#ff8c42'];
    case 'minor':
      return ['#4ecdc4', '#45b7aa'];
    case 'dominant7':
      return ['#a855f7', '#9333ea'];
    case 'major7':
      return ['#fbbf24', '#f59e0b'];
    case 'minor7':
      return ['#38bdf8', '#0ea5e9'];
    default:
      return ['#6c63ff', '#5b52d5'];
  }
}
