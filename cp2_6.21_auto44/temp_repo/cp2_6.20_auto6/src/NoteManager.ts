import type { Direction } from './InputHandler';
import { SONGS, type SongData, type SongNote, type NoteType } from './songs';

export { type NoteType };

export interface NoteData {
  time: number;
  direction: Direction;
  type: NoteType;
}

export type ChartData = SongData;

export interface Note {
  id: number;
  direction: Direction;
  type: NoteType;
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
  easy: { speedMultiplier: 1.0, perfectWindow: 0.05, goodWindow: 0.10, normalWindow: 0.15 },
  normal: { speedMultiplier: 1.6, perfectWindow: 0.03, goodWindow: 0.07, normalWindow: 0.12 },
  hard: { speedMultiplier: 2.5, perfectWindow: 0.02, goodWindow: 0.05, normalWindow: 0.09 }
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

export const HEAVY_NOTE_SCORE_MULTIPLIER = 1.5;
export const HEAVY_NOTE_ENERGY_MULTIPLIER = 1.5;

export const CHARTS: ChartData[] = SONGS;

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
          type: noteData.type,
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
