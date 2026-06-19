import type { Direction } from './InputHandler';

export interface NoteData {
  time: number;
  direction: Direction;
}

export interface ChartData {
  name: string;
  bpm: number;
  duration: number;
  notes: NoteData[];
}

export interface Note {
  id: number;
  direction: Direction;
  spawnTime: number;
  hitTime: number;
  y: number;
  judged: boolean;
  result?: JudgeResult;
  trail: { y: number; alpha: number }[];
}

export type JudgeResult = 'perfect' | 'good' | 'normal' | 'miss';

export type Difficulty = 'easy' | 'normal' | 'hard';

export const DIFFICULTY_CONFIG: Record<Difficulty, { speedMultiplier: number; perfectWindow: number; goodWindow: number; normalWindow: number }> = {
  easy: { speedMultiplier: 1.0, perfectWindow: 0.09, goodWindow: 0.15, normalWindow: 0.22 },
  normal: { speedMultiplier: 1.6, perfectWindow: 0.06, goodWindow: 0.11, normalWindow: 0.17 },
  hard: { speedMultiplier: 2.5, perfectWindow: 0.035, goodWindow: 0.07, normalWindow: 0.12 }
};

export const JUDGE_SCORE: Record<JudgeResult, number> = {
  perfect: 300,
  good: 200,
  normal: 100,
  miss: 0
};

export const JUDGE_ENERGY: Record<JudgeResult, number> = {
  perfect: 8,
  good: 5,
  normal: 2,
  miss: 0
};

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

function generateRandomNotes(bpm: number, duration: number, density: number): NoteData[] {
  const notes: NoteData[] = [];
  const beatInterval = 60 / bpm;
  const steps = Math.floor(duration / (beatInterval / density));
  let lastTime = 0;

  for (let i = 2; i < steps; i++) {
    if (Math.random() < 0.65) {
      const time = i * (beatInterval / density);
      if (time - lastTime < beatInterval * 0.3) continue;
      const dir = DIRECTIONS[Math.floor(Math.random() * 4)];
      notes.push({ time, direction: dir });
      lastTime = time;

      if (Math.random() < 0.18 && i < steps - 1) {
        const dir2 = DIRECTIONS[Math.floor(Math.random() * 4)];
        if (dir2 !== dir) {
          notes.push({ time, direction: dir2 });
        }
      }
    }
  }
  return notes;
}

export const CHARTS: ChartData[] = [
  {
    name: 'Neon Pulse',
    bpm: 110,
    duration: 45,
    notes: generateRandomNotes(110, 45, 2)
  },
  {
    name: 'Cyber Beat',
    bpm: 140,
    duration: 50,
    notes: generateRandomNotes(140, 50, 2)
  },
  {
    name: 'Thunder Strike',
    bpm: 170,
    duration: 55,
    notes: generateRandomNotes(170, 55, 3)
  }
];

export class NoteManager {
  private notes: Note[] = [];
  private chart: ChartData;
  private difficulty: Difficulty;
  private noteIdCounter = 0;
  private nextNoteIndex = 0;
  private baseSpeed: number;
  private currentSpeedMultiplier: number;
  private judgeLineY: number;
  private topSpawnY: number;
  private chartOffset = 0;

  constructor(chart: ChartData, difficulty: Difficulty, judgeLineY: number, topSpawnY: number) {
    this.chart = chart;
    this.difficulty = difficulty;
    this.judgeLineY = judgeLineY;
    this.topSpawnY = topSpawnY;
    this.baseSpeed = (judgeLineY - topSpawnY) / 2.0;
    this.currentSpeedMultiplier = DIFFICULTY_CONFIG[difficulty].speedMultiplier;
  }

  reset(chart: ChartData, difficulty: Difficulty): void {
    this.chart = chart;
    this.difficulty = difficulty;
    this.notes = [];
    this.noteIdCounter = 0;
    this.nextNoteIndex = 0;
    this.chartOffset = 0;
    this.currentSpeedMultiplier = DIFFICULTY_CONFIG[difficulty].speedMultiplier;
  }

  setSpeedMultiplier(mult: number): void {
    this.currentSpeedMultiplier = mult;
  }

  getSpeedMultiplier(): number {
    return this.currentSpeedMultiplier;
  }

  setJudgePositions(judgeLineY: number, topSpawnY: number): void {
    this.judgeLineY = judgeLineY;
    this.topSpawnY = topSpawnY;
    this.baseSpeed = (judgeLineY - topSpawnY) / 2.0;
  }

  getActiveNotes(): Note[] {
    return this.notes;
  }

  getChart(): ChartData {
    return this.chart;
  }

  getDifficultyConfig() {
    return DIFFICULTY_CONFIG[this.difficulty];
  }

  getTotalNotes(): number {
    return this.chart.notes.length;
  }

  update(dt: number, currentSongTime: number): Note[] {
    const travelTime = (this.judgeLineY - this.topSpawnY) / (this.baseSpeed * this.currentSpeedMultiplier);

    while (this.nextNoteIndex < this.chart.notes.length) {
      const noteData = this.chart.notes[this.nextNoteIndex];
      const spawnTime = noteData.time - travelTime;
      if (currentSongTime >= spawnTime) {
        this.notes.push({
          id: this.noteIdCounter++,
          direction: noteData.direction,
          spawnTime: currentSongTime,
          hitTime: noteData.time,
          y: this.topSpawnY,
          judged: false,
          trail: []
        });
        this.nextNoteIndex++;
      } else {
        break;
      }
    }

    const missed: Note[] = [];
    const cfg = DIFFICULTY_CONFIG[this.difficulty];

    for (let i = this.notes.length - 1; i >= 0; i--) {
      const note = this.notes[i];
      const timeToHit = note.hitTime - currentSongTime;
      note.y = this.judgeLineY - timeToHit * this.baseSpeed * this.currentSpeedMultiplier;

      if (!note.judged && currentSongTime - note.hitTime > cfg.normalWindow) {
        note.judged = true;
        note.result = 'miss';
        missed.push(note);
      }

      if (note.judged && currentSongTime - note.hitTime > 0.4) {
        this.notes.splice(i, 1);
        continue;
      }

      if (!note.judged) {
        note.trail.unshift({ y: note.y, alpha: 1 });
        if (note.trail.length > 8) note.trail.pop();
        for (let j = 0; j < note.trail.length; j++) {
          note.trail[j].alpha = 1 - j / note.trail.length;
        }
      }
    }

    return missed;
  }

  judge(direction: Direction, currentSongTime: number): { note: Note | null; result: JudgeResult } {
    const cfg = DIFFICULTY_CONFIG[this.difficulty];
    let bestNote: Note | null = null;
    let bestDiff = Infinity;

    for (const note of this.notes) {
      if (note.judged || note.direction !== direction) continue;
      const diff = Math.abs(currentSongTime - note.hitTime);
      if (diff < cfg.normalWindow && diff < bestDiff) {
        bestDiff = diff;
        bestNote = note;
      }
    }

    if (!bestNote) {
      return { note: null, result: 'miss' };
    }

    bestNote.judged = true;
    let result: JudgeResult;
    if (bestDiff <= cfg.perfectWindow) {
      result = 'perfect';
    } else if (bestDiff <= cfg.goodWindow) {
      result = 'good';
    } else {
      result = 'normal';
    }
    bestNote.result = result;
    return { note: bestNote, result };
  }

  isFinished(currentSongTime: number): boolean {
    return this.nextNoteIndex >= this.chart.notes.length && this.notes.length === 0 && currentSongTime > this.chart.duration;
  }
}
