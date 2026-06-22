import Phaser from 'phaser';

export interface BeatData {
  beatCount: number;
  timestamp: number;
}

export class BeatManager {
  private scene: Phaser.Scene;
  private bpm: number;
  private beatInterval: number;
  private startTime: number = 0;
  private beatCount: number = 0;
  private isRunning: boolean = false;
  private toleranceMs: number = 150;
  private lastBeatTime: number = 0;
  private nextBeatTime: number = 0;
  private beatTimer?: Phaser.Time.TimerEvent;

  public readonly events: Phaser.Events.EventEmitter;

  constructor(scene: Phaser.Scene, bpm: number = 120) {
    this.scene = scene;
    this.bpm = bpm;
    this.beatInterval = 60000 / bpm;
    this.events = new Phaser.Events.EventEmitter();
  }

  setBPM(bpm: number): void {
    this.bpm = bpm;
    this.beatInterval = 60000 / bpm;
  }

  getBPM(): number {
    return this.bpm;
  }

  getBeatInterval(): number {
    return this.beatInterval;
  }

  start(): void {
    this.isRunning = true;
    this.startTime = this.scene.time.now;
    this.beatCount = 0;
    this.lastBeatTime = this.startTime;
    this.nextBeatTime = this.startTime + this.beatInterval;
    this.scheduleNextBeat();
  }

  stop(): void {
    this.isRunning = false;
    if (this.beatTimer) {
      this.beatTimer.remove(false);
      this.beatTimer = undefined;
    }
  }

  private scheduleNextBeat(): void {
    if (!this.isRunning) return;

    this.beatTimer = this.scene.time.delayedCall(this.beatInterval, () => {
      this.triggerBeat();
      this.scheduleNextBeat();
    });
  }

  private triggerBeat(): void {
    this.beatCount++;
    const now = this.scene.time.now;
    this.lastBeatTime = now;
    this.nextBeatTime = now + this.beatInterval;

    const beatData: BeatData = {
      beatCount: this.beatCount,
      timestamp: now
    };
    this.events.emit('beat', beatData);
  }

  isOnBeat(toleranceMs?: number): boolean {
    const tolerance = toleranceMs ?? this.toleranceMs;
    const now = this.scene.time.now;

    const distToLast = now - this.lastBeatTime;
    const distToNext = this.nextBeatTime - now;

    return distToLast <= tolerance || distToNext <= tolerance;
  }

  getBeatProgress(): number {
    if (!this.isRunning) return 0;

    const now = this.scene.time.now;
    const elapsed = now - this.lastBeatTime;
    const progress = elapsed / this.beatInterval;

    return Phaser.Math.Clamp(progress, 0, 1);
  }

  getAccuracy(): number {
    const now = this.scene.time.now;
    const distToLast = now - this.lastBeatTime;
    const distToNext = this.nextBeatTime - now;
    const minDist = Math.min(distToLast, distToNext);
    const accuracy = 1 - (minDist / this.toleranceMs);

    return Phaser.Math.Clamp(accuracy, 0, 1);
  }

  getBeatCount(): number {
    return this.beatCount;
  }

  setTolerance(ms: number): void {
    this.toleranceMs = ms;
  }

  getTolerance(): number {
    return this.toleranceMs;
  }

  destroy(): void {
    this.stop();
    this.events.removeAllListeners();
  }
}
