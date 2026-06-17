export class AudioEngine {
  private beatTimestamps: number[] = [];
  private startTime: number = 0;
  private bpm: number = 120;
  private baseBpm: number = 120;
  private bpmBoostEndTime: number = 0;
  private _isRunning: boolean = false;

  constructor(baseBpm: number = 120) {
    this.baseBpm = baseBpm;
    this.bpm = baseBpm;
    this.generateBeatPattern();
  }

  private generateBeatPattern(): void {
    this.beatTimestamps = [];
    const beatInterval = 60000 / this.bpm;
    for (let i = 0; i < 1000; i++) {
      this.beatTimestamps.push(i * beatInterval);
    }
  }

  start(): void {
    this.startTime = performance.now();
    this._isRunning = true;
  }

  stop(): void {
    this._isRunning = false;
  }

  isRunning(): boolean {
    return this._isRunning;
  }

  reset(): void {
    this.startTime = performance.now();
    this.bpm = this.baseBpm;
    this.bpmBoostEndTime = 0;
    this.generateBeatPattern();
  }

  getCurrentTime(): number {
    return performance.now() - this.startTime;
  }

  getBeatOffset(currentTime?: number): number {
    const time = currentTime ?? this.getCurrentTime();
    const beatInterval = 60000 / this.bpm;

    const beatIndex = Math.floor(time / beatInterval);
    const nearestBeatTime = beatIndex * beatInterval;
    const nextBeatTime = (beatIndex + 1) * beatInterval;

    const offsetToCurrent = time - nearestBeatTime;
    const offsetToNext = nextBeatTime - time;

    return offsetToCurrent < offsetToNext ? offsetToCurrent : -offsetToNext;
  }

  getBeatProgress(): number {
    const time = this.getCurrentTime();
    const beatInterval = 60000 / this.bpm;
    return (time % beatInterval) / beatInterval;
  }

  applyBpmBoost(boostPercentage: number, duration: number): void {
    const currentTime = this.getCurrentTime();
    this.bpm = this.baseBpm * (1 + boostPercentage);
    this.bpmBoostEndTime = currentTime + duration;
    this.generateBeatPattern();
  }

  update(): void {
    const currentTime = this.getCurrentTime();
    if (this.bpmBoostEndTime > 0 && currentTime >= this.bpmBoostEndTime) {
      this.bpm = this.baseBpm;
      this.bpmBoostEndTime = 0;
      this.generateBeatPattern();
    }
  }

  getBpm(): number {
    return this.bpm;
  }

  isBpmBoosted(): boolean {
    return this.bpm !== this.baseBpm;
  }
}
