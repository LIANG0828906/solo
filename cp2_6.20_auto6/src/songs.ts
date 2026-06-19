import type { Direction } from './InputHandler';

export type NoteType = 'normal' | 'heavy';

export interface SongNote {
  time: number;
  direction: Direction;
  type: NoteType;
}

export interface SongData {
  name: string;
  bpm: number;
  duration: number;
  notes: SongNote[];
}

function beatTime(bpm: number, beat: number): number {
  return (beat * 60) / bpm;
}

const neonPulseNotes: SongNote[] = (() => {
  const bpm = 110;
  const notes: SongNote[] = [];
  const t = (beat: number) => beatTime(bpm, beat);

  const patterns: Array<[number, Direction, NoteType][]> = [
    [[0, 'down', 'heavy'], [0.5, 'up', 'normal'], [1, 'left', 'normal'], [1.5, 'right', 'normal']],
    [[2, 'down', 'normal'], [2.5, 'up', 'normal'], [3, 'right', 'heavy'], [3.5, 'left', 'normal']],
    [[4, 'up', 'heavy'], [4.5, 'down', 'normal'], [5, 'right', 'normal'], [5.5, 'left', 'normal']],
    [[6, 'left', 'normal'], [6.5, 'right', 'normal'], [7, 'down', 'heavy'], [7.5, 'up', 'normal']],
  ];

  for (let bar = 0; bar < 20; bar++) {
    const pattern = patterns[bar % patterns.length];
    for (const [offset, dir, type] of pattern) {
      notes.push({ time: t(bar * 8 + offset), direction: dir, type });
    }
  }

  for (let i = 0; i < 6; i++) {
    notes.push({ time: t(160 + i * 0.5), direction: (['up', 'down', 'left', 'right'] as Direction[])[i % 4], type: i % 3 === 0 ? 'heavy' : 'normal' });
  }

  notes.push({ time: t(190), direction: 'down', type: 'heavy' });

  return notes.sort((a, b) => a.time - b.time);
})();

const cyberBeatNotes: SongNote[] = (() => {
  const bpm = 140;
  const notes: SongNote[] = [];
  const t = (beat: number) => beatTime(bpm, beat);

  for (let bar = 0; bar < 28; bar++) {
    const base = bar * 4;
    const barType = bar % 4;

    if (barType === 0) {
      notes.push({ time: t(base), direction: 'down', type: 'heavy' });
      notes.push({ time: t(base + 0.5), direction: 'up', type: 'normal' });
      notes.push({ time: t(base + 1), direction: 'left', type: 'normal' });
      notes.push({ time: t(base + 1.5), direction: 'right', type: 'normal' });
      notes.push({ time: t(base + 2), direction: 'down', type: 'heavy' });
      notes.push({ time: t(base + 2.5), direction: 'up', type: 'normal' });
      notes.push({ time: t(base + 3), direction: 'right', type: 'normal' });
      notes.push({ time: t(base + 3.5), direction: 'left', type: 'normal' });
    } else if (barType === 1) {
      notes.push({ time: t(base), direction: 'up', type: 'heavy' });
      notes.push({ time: t(base + 0.5), direction: 'left', type: 'normal' });
      notes.push({ time: t(base + 1), direction: 'right', type: 'normal' });
      notes.push({ time: t(base + 1.5), direction: 'down', type: 'normal' });
      notes.push({ time: t(base + 2), direction: 'up', type: 'normal' });
      notes.push({ time: t(base + 2.5), direction: 'down', type: 'heavy' });
      notes.push({ time: t(base + 2.75), direction: 'left', type: 'normal' });
      notes.push({ time: t(base + 3), direction: 'right', type: 'normal' });
      notes.push({ time: t(base + 3.25), direction: 'up', type: 'normal' });
      notes.push({ time: t(base + 3.5), direction: 'down', type: 'normal' });
    } else if (barType === 2) {
      notes.push({ time: t(base), direction: 'left', type: 'heavy' });
      notes.push({ time: t(base + 0.25), direction: 'right', type: 'normal' });
      notes.push({ time: t(base + 0.5), direction: 'left', type: 'normal' });
      notes.push({ time: t(base + 0.75), direction: 'right', type: 'normal' });
      notes.push({ time: t(base + 1), direction: 'up', type: 'heavy' });
      notes.push({ time: t(base + 1.5), direction: 'down', type: 'normal' });
      notes.push({ time: t(base + 2), direction: 'right', type: 'heavy' });
      notes.push({ time: t(base + 2.25), direction: 'left', type: 'normal' });
      notes.push({ time: t(base + 2.5), direction: 'right', type: 'normal' });
      notes.push({ time: t(base + 2.75), direction: 'left', type: 'normal' });
      notes.push({ time: t(base + 3), direction: 'down', type: 'heavy' });
      notes.push({ time: t(base + 3.5), direction: 'up', type: 'normal' });
    } else {
      notes.push({ time: t(base), direction: 'down', type: 'heavy' });
      notes.push({ time: t(base + 0.5), direction: 'up', type: 'heavy' });
      notes.push({ time: t(base + 1), direction: 'left', type: 'heavy' });
      notes.push({ time: t(base + 1.5), direction: 'right', type: 'heavy' });
      notes.push({ time: t(base + 2), direction: 'up', type: 'normal' });
      notes.push({ time: t(base + 2.25), direction: 'down', type: 'normal' });
      notes.push({ time: t(base + 2.5), direction: 'left', type: 'normal' });
      notes.push({ time: t(base + 2.75), direction: 'right', type: 'normal' });
      notes.push({ time: t(base + 3), direction: 'down', type: 'heavy' });
      notes.push({ time: t(base + 3.5), direction: 'up', type: 'normal' });
    }
  }

  return notes.sort((a, b) => a.time - b.time);
})();

const thunderStrikeNotes: SongNote[] = (() => {
  const bpm = 170;
  const notes: SongNote[] = [];
  const t = (beat: number) => beatTime(bpm, beat);

  for (let bar = 0; bar < 40; bar++) {
    const base = bar * 4;
    const phase = Math.floor(bar / 10) % 4;

    if (phase === 0) {
      notes.push({ time: t(base), direction: 'down', type: 'heavy' });
      notes.push({ time: t(base + 0.25), direction: 'up', type: 'normal' });
      notes.push({ time: t(base + 0.5), direction: 'left', type: 'normal' });
      notes.push({ time: t(base + 0.75), direction: 'right', type: 'normal' });
      notes.push({ time: t(base + 1), direction: 'down', type: 'heavy' });
      notes.push({ time: t(base + 1.25), direction: 'up', type: 'normal' });
      notes.push({ time: t(base + 1.5), direction: 'right', type: 'normal' });
      notes.push({ time: t(base + 1.75), direction: 'left', type: 'normal' });
      notes.push({ time: t(base + 2), direction: 'up', type: 'heavy' });
      notes.push({ time: t(base + 2.25), direction: 'down', type: 'normal' });
      notes.push({ time: t(base + 2.5), direction: 'left', type: 'normal' });
      notes.push({ time: t(base + 2.75), direction: 'right', type: 'normal' });
      notes.push({ time: t(base + 3), direction: 'down', type: 'heavy' });
      notes.push({ time: t(base + 3.25), direction: 'up', type: 'normal' });
      notes.push({ time: t(base + 3.5), direction: 'left', type: 'normal' });
      notes.push({ time: t(base + 3.75), direction: 'right', type: 'normal' });
    } else if (phase === 1) {
      notes.push({ time: t(base), direction: 'up', type: 'heavy' });
      notes.push({ time: t(base + 0.125), direction: 'down', type: 'normal' });
      notes.push({ time: t(base + 0.25), direction: 'up', type: 'normal' });
      notes.push({ time: t(base + 0.5), direction: 'left', type: 'heavy' });
      notes.push({ time: t(base + 0.625), direction: 'right', type: 'normal' });
      notes.push({ time: t(base + 0.75), direction: 'left', type: 'normal' });
      notes.push({ time: t(base + 1), direction: 'down', type: 'heavy' });
      notes.push({ time: t(base + 1.125), direction: 'up', type: 'normal' });
      notes.push({ time: t(base + 1.25), direction: 'down', type: 'normal' });
      notes.push({ time: t(base + 1.5), direction: 'right', type: 'heavy' });
      notes.push({ time: t(base + 1.625), direction: 'left', type: 'normal' });
      notes.push({ time: t(base + 1.75), direction: 'right', type: 'normal' });
      notes.push({ time: t(base + 2), direction: 'up', type: 'heavy' });
      notes.push({ time: t(base + 2.5), direction: 'down', type: 'heavy' });
      notes.push({ time: t(base + 3), direction: 'left', type: 'heavy' });
      notes.push({ time: t(base + 3.5), direction: 'right', type: 'heavy' });
    } else if (phase === 2) {
      for (let i = 0; i < 16; i++) {
        const d = (['up', 'down', 'left', 'right'] as Direction[])[i % 4];
        notes.push({
          time: t(base + i * 0.25),
          direction: d,
          type: i % 4 === 0 ? 'heavy' : 'normal'
        });
      }
    } else {
      notes.push({ time: t(base), direction: 'left', type: 'heavy' });
      notes.push({ time: t(base), direction: 'right', type: 'heavy' });
      notes.push({ time: t(base + 0.5), direction: 'up', type: 'normal' });
      notes.push({ time: t(base + 1), direction: 'down', type: 'heavy' });
      notes.push({ time: t(base + 1), direction: 'up', type: 'heavy' });
      notes.push({ time: t(base + 1.5), direction: 'left', type: 'normal' });
      notes.push({ time: t(base + 2), direction: 'right', type: 'heavy' });
      notes.push({ time: t(base + 2), direction: 'left', type: 'heavy' });
      notes.push({ time: t(base + 2.5), direction: 'down', type: 'normal' });
      notes.push({ time: t(base + 3), direction: 'up', type: 'heavy' });
      notes.push({ time: t(base + 3), direction: 'down', type: 'heavy' });
      notes.push({ time: t(base + 3.5), direction: 'right', type: 'normal' });
    }
  }

  return notes.sort((a, b) => a.time - b.time);
})();

export const SONGS: SongData[] = [
  {
    name: 'Neon Pulse',
    bpm: 110,
    duration: 50,
    notes: neonPulseNotes
  },
  {
    name: 'Cyber Beat',
    bpm: 140,
    duration: 55,
    notes: cyberBeatNotes
  },
  {
    name: 'Thunder Strike',
    bpm: 170,
    duration: 60,
    notes: thunderStrikeNotes
  }
];
