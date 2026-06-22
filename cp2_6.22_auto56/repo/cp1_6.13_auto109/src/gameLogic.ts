import type { BeatEvent } from './audioEngine';
import type { NoteVisual } from './renderer';

export interface GameState {
  score: number;
  combo: number;
  maxCombo: number;
  health: number;
  isPlaying: boolean;
}

export interface Note {
  id: number;
  lane: number;
  hitTime: number;
  spawnTime: number;
  hit: boolean;
  missed: boolean;
  y: number;
  fallDuration: number;
  bpm: number;
}

export type JudgeResult = 'perfect' | 'good' | 'miss';

export interface JudgeEvent {
  result: JudgeResult;
  lane: number;
  score: number;
  combo: number;
}

const KEY_MAP: Record<string, number> = {
  's': 0, 'S': 0,
  'd': 1, 'D': 1,
  'f': 2, 'F': 2,
  'j': 3, 'J': 3,
  'k': 4, 'K': 4,
  'l': 5, 'L': 5
};

const PERFECT_WINDOW = 50;
const MISS_WINDOW = 150;

const PERFECT_SCORE = 100;
const GOOD_SCORE = 50;

const MIN_BPM = 100;
const MAX_BPM = 200;
const BASE_FALL_DURATION = 2000;
const BASE_BPM = 120;

export class GameLogic {
  private state: GameState = {
    score: 0,
    combo: 0,
    maxCombo: 0,
    health: 100,
    isPlaying: false
  };

  private notes: Note[] = [];
  private noteIdCounter = 0;
  private currentBPM = 120;
  private lastFireworkCombo = 0;

  private onJudgeCallback: ((event: JudgeEvent) => void) | null = null;
  private onMissCallback: (() => void) | null = null;
  private onFireworkCallback: (() => void) | null = null;
  private onStateChangeCallback: ((state: GameState) => void) | null = null;

  private judgeLineY = 0;
  private canvasHeight = 0;
  private noteHeight = 0;

  private pressedKeys = new Set<number>();

  private onKeyDownHandler: (e: KeyboardEvent) => void;
  private onKeyUpHandler: (e: KeyboardEvent) => void;

  constructor() {
    this.onKeyDownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);
    this.onKeyUpHandler = (e: KeyboardEvent) => this.handleKeyUp(e);
    this.setupKeyListeners();
  }

  private setupKeyListeners(): void {
    window.addEventListener('keydown', this.onKeyDownHandler);
    window.addEventListener('keyup', this.onKeyUpHandler);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.state.isPlaying) return;

    const lane = KEY_MAP[e.key];
    if (lane !== undefined && !this.pressedKeys.has(lane)) {
      this.pressedKeys.add(lane);
      this.handleKeyPress(lane, performance.now());
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const lane = KEY_MAP[e.key];
    if (lane !== undefined) {
      this.pressedKeys.delete(lane);
    }
  }

  setCanvasParams(judgeLineY: number, canvasHeight: number, noteHeight: number): void {
    this.judgeLineY = judgeLineY;
    this.canvasHeight = canvasHeight;
    this.noteHeight = noteHeight;
  }

  start(): void {
    this.state = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      health: 100,
      isPlaying: true
    };
    this.notes = [];
    this.noteIdCounter = 0;
    this.lastFireworkCombo = 0;
    this.notifyStateChange();
  }

  stop(): void {
    this.state.isPlaying = false;
    this.notes = [];
    this.notifyStateChange();
  }

  pause(): void {
    this.state.isPlaying = false;
    this.notifyStateChange();
  }

  resume(): void {
    this.state.isPlaying = true;
    this.notifyStateChange();
  }

  private getFallDuration(bpm: number): number {
    const clampedBPM = Math.max(MIN_BPM, Math.min(MAX_BPM, bpm));
    const duration = BASE_FALL_DURATION * BASE_BPM / clampedBPM;
    const minDuration = BASE_FALL_DURATION * BASE_BPM / MAX_BPM;
    const maxDuration = BASE_FALL_DURATION * BASE_BPM / MIN_BPM;
    return Math.max(minDuration, Math.min(maxDuration, duration));
  }

  handleBeat(beat: BeatEvent): void {
    if (!this.state.isPlaying) return;

    this.currentBPM = Math.max(MIN_BPM, Math.min(MAX_BPM, beat.bpm));

    const fallDuration = this.getFallDuration(beat.bpm);
    const lane = Math.floor(Math.random() * 6);
    const hitTime = beat.time + fallDuration;
    const spawnTime = beat.time;

    const note: Note = {
      id: this.noteIdCounter++,
      lane,
      hitTime,
      spawnTime,
      hit: false,
      missed: false,
      y: -this.noteHeight,
      fallDuration,
      bpm: beat.bpm
    };

    this.notes.push(note);
  }

  private handleKeyPress(lane: number, currentTimeMs: number): void {
    if (!this.state.isPlaying) return;

    let bestNote: Note | null = null;
    let bestDiff = Infinity;

    for (const note of this.notes) {
      if (note.lane !== lane || note.hit || note.missed) continue;

      const diff = Math.abs(note.hitTime - currentTimeMs);
      if (diff < bestDiff && diff <= MISS_WINDOW) {
        bestDiff = diff;
        bestNote = note;
      }
    }

    if (bestNote) {
      bestNote.hit = true;
      let result: JudgeResult;
      let scoreGain: number;

      if (bestDiff <= PERFECT_WINDOW) {
        result = 'perfect';
        scoreGain = PERFECT_SCORE;
      } else {
        result = 'good';
        scoreGain = GOOD_SCORE;
      }

      this.state.combo++;
      this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
      this.state.score += scoreGain * (1 + Math.floor(this.state.combo / 10) * 0.1);

      this.checkFirework();
      this.notifyStateChange();
      this.notifyJudge(result, lane, scoreGain);
    }
  }

  update(currentAudioTimeMs: number): NoteVisual[] {
    if (!this.state.isPlaying) return [];

    const visibleNotes: NoteVisual[] = [];

    for (const note of this.notes) {
      if (note.hit) continue;

      const timeUntilHit = note.hitTime - currentAudioTimeMs;
      const progress = 1 - (time