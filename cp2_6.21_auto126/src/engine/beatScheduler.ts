import { audioEngine } from './audioEngine';

interface ScheduleEvent {
  beat: number;
  bar: number;
  time: number;
}

export class BeatScheduler {
  private isRunning: boolean = false;
  private currentBeat: number = 0;
  private currentBar: number = 0;
  private nextBeatTime: number = 0;
  private lookahead: number = 0.1;
  private scheduleAheadTime: number = 0.1;
  private schedulerInterval: number | null = null;
  private bpm: number = 120;
  private beatsPerBar: number = 8;
  private barsPerLoop: number = 8;
  private onBeatCallback: ((beat: number, bar: number) => void) | null = null;
  private scheduledEvents: ScheduleEvent[] = [];
  private startTime: number = 0;

  constructor() {}

  public setBPM(bpm: number): void {
    this.bpm = Math.max(60, Math.min(200, bpm));
    audioEngine.setBPM(this.bpm);
  }

  public getBPM(): number {
    return this.bpm;
  }

  public setOnBeatCallback(callback: (beat: number, bar: number) => void): void {
    this.onBeatCallback = callback;
  }

  public start(): void {
    if (this.isRunning) return;

    const ctx = audioEngine.getAudioContext();
    if (!ctx) {
      audioEngine.init().then(() => this.start());
      return;
    }

    this.isRunning = true;
    this.currentBeat = 0;
    this.currentBar = 0;
    this.nextBeatTime = ctx.currentTime + 0.1;
    this.startTime = this.nextBeatTime;

    audioEngine.startLoop();

    this.schedulerInterval = window.setInterval(() => {
      this.scheduler();
    }, 25);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    this.scheduledEvents = [];
    audioEngine.stopLoop();
    this.currentBeat = 0;
    this.currentBar = 0;
  }

  public getCurrentBeat(): number {
    return this.currentBeat;
  }

  public getCurrentBar(): number {
    return this.currentBar;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  private scheduler(): void {
    const ctx = audioEngine.getAudioContext();
    if (!ctx) return;

    while (this.nextBeatTime < ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleBeat(this.currentBeat, this.currentBar, this.nextBeatTime);
      this.nextBeat();
    }

    this.dispatchScheduledEvents(ctx.currentTime);
  }

  private nextBeat(): void {
    const secondsPerBeat = 60.0 / this.bpm / 2;
    this.nextBeatTime += secondsPerBeat;
    this.currentBeat++;

    if (this.currentBeat >= this.beatsPerBar) {
      this.currentBeat = 0;
      this.currentBar++;
      if (this.currentBar >= this.barsPerLoop) {
        this.currentBar = 0;
      }
    }
  }

  private scheduleBeat(beat: number, bar: number, time: number): void {
    this.scheduledEvents.push({ beat, bar, time });
  }

  private dispatchScheduledEvents(currentTime: number): void {
    const threshold = currentTime - 0.05;
    
    while (this.scheduledEvents.length > 0 && this.scheduledEvents[0].time <= threshold) {
      const event = this.scheduledEvents.shift()!;
      
      audioEngine.triggerBeat(event.beat, event.bar);
      
      if (this.onBeatCallback) {
        this.onBeatCallback(event.beat, event.bar);
      }
    }
  }

  public getProgress(): number {
    if (!this.isRunning) return 0;
    
    const ctx = audioEngine.getAudioContext();
    if (!ctx) return 0;

    const elapsed = ctx.currentTime - this.startTime;
    const loopDuration = (this.beatsPerBar * this.barsPerLoop * 60) / this.bpm / 2;
    return (elapsed % loopDuration) / loopDuration;
  }
}

export const beatScheduler = new BeatScheduler();
