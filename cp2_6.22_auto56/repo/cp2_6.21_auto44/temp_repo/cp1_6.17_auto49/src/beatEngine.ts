import { BeatType, BeatSignal } from './types';

export class BeatEngine {
  private bpm: number = 120;
  private pattern: BeatType[] = [];
  private isPlaying: boolean = false;
  private currentBeatIndex: number = 0;
  private audioContext: AudioContext | null = null;
  private nextBeatTime: number = 0;
  private scheduleAheadTime: number = 0.1;
  private lookahead: number = 25;
  private timerId: number | null = null;
  private beatListeners: Set<(signal: BeatSignal) => void> = new Set();
  private beatHistory: { time: number; index: number }[] = [];

  constructor() {
    this.pattern = ['accent', 'normal', 'normal', 'normal'];
  }

  setBpm(bpm: number): void {
    this.bpm = Math.max(30, Math.min(300, bpm));
  }

  getBpm(): number {
    return this.bpm;
  }

  setPattern(pattern: BeatType[]): void {
    if (pattern.length >= 4 && pattern.length <= 12) {
      this.pattern = [...pattern];
      if (this.isPlaying) {
        this.currentBeatIndex = 0;
      }
    }
  }

  getPattern(): BeatType[] {
    return [...this.pattern];
  }

  getCurrentBeatIndex(): number {
    return this.currentBeatIndex;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  onBeat(listener: (signal: BeatSignal) => void): () => void {
    this.beatListeners.add(listener);
    return () => this.beatListeners.delete(listener);
  }

  private emitBeat(signal: BeatSignal): void {
    this.beatListeners.forEach((listener) => listener(signal));
  }

  start(): void {
    if (this.isPlaying) return;

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    this.currentBeatIndex = 0;
    this.nextBeatTime = this.audioContext.currentTime + 0.05;
    this.beatHistory = [];
    this.scheduler();
  }

  stop(): void {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.currentBeatIndex = 0;
  }

  private getBeatDuration(): number {
    return 60.0 / this.bpm;
  }

  private scheduler(): void {
    if (!this.isPlaying || !this.audioContext) return;

    while (this.nextBeatTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleBeat(this.nextBeatTime, this.currentBeatIndex);
      this.advanceBeat();
    }

    this.timerId = window.setTimeout(() => this.scheduler(), this.lookahead);
  }

  private scheduleBeat(time: number, beatIndex: number): void {
    const beatType = this.pattern[beatIndex % this.pattern.length];
    const intensity = beatType === 'accent' ? 1 : beatType === 'normal' ? 0.6 : 0;

    const delay = (time - (this.audioContext?.currentTime || 0)) * 1000;

    setTimeout(() => {
      if (this.isPlaying) {
        this.emitBeat({
          beatIndex: beatIndex % this.pattern.length,
          beatType,
          timestamp: performance.now(),
          intensity,
        });
      }
    }, Math.max(0, delay));

    this.beatHistory.push({ time, index: beatIndex });
    if (this.beatHistory.length > 100) {
      this.beatHistory.shift();
    }
  }

  private advanceBeat(): void {
    const secondsPerBeat = this.getBeatDuration();
    this.nextBeatTime += secondsPerBeat;
    this.currentBeatIndex = (this.currentBeatIndex + 1) % this.pattern.length;
  }

  getBeatProgress(): number {
    if (!this.isPlaying || !this.audioContext || this.pattern.length === 0) {
      return 0;
    }

    const currentTime = this.audioContext.currentTime;
    const beatDuration = this.getBeatDuration();

    let prevBeatTime = this.nextBeatTime - beatDuration;
    while (prevBeatTime > currentTime) {
      prevBeatTime -= beatDuration;
    }

    const elapsed = currentTime - prevBeatTime;
    return Math.min(1, Math.max(0, elapsed / beatDuration));
  }

  destroy(): void {
    this.stop();
    this.beatListeners.clear();
  }
}
