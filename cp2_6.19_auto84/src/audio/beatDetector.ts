export interface BeatEvent {
  timestamp: number;
  confidence: number;
  isStrongBeat: boolean;
  beatIndex: number;
  bpm: number;
  timeSinceLastBeat: number;
  timeToNextBeat: number;
}

export type BeatListener = (event: BeatEvent) => void;

export class BeatDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private listeners: BeatListener[] = [];
  private lastBeatTimestamp = 0;
  private lastStrongBeatTimestamp = 0;
  private beatInterval = 500;
  private currentConfidence = 0;
  private schedulerTimer: number | null = null;
  private rafId: number | null = null;
  private bpm = 120;
  private beatCount = 0;
  private strongBeatCount = 0;
  private lastEmitTime = 0;
  private emitInterval = 16;

  constructor() {
    this.beatInterval = 60000 / this.bpm;
  }

  async init(): Promise<void> {
    this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0.5;
    this.gainNode.connect(this.audioContext.destination);
    this.analyser.connect(this.gainNode);
    this.lastBeatTimestamp = performance.now();
    this.lastStrongBeatTimestamp = performance.now();
    this.startDrumSequence();
    this.startFrameLoop();
  }

  private startDrumSequence(): void {
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    const lookahead = 25;
    const scheduleAheadTime = 0.1;
    let nextNoteTime = ctx.currentTime + 0.1;
    const notesInQueue: { noteTime: number; note: number }[] = [];

    const scheduleNote = (beatNumber: number, time: number) => {
      notesInQueue.push({ noteTime: time, note: beatNumber });

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(this.analyser!);

      if (beatNumber % 8 === 0) {
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
      } else if (beatNumber % 4 === 0) {
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);
        gain.gain.setValueAtTime(0.7, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.05);
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
      }

      osc.start(time);
      osc.stop(time + 0.5);
    };

    const nextNote = () => {
      const secondsPerBeat = 60.0 / this.bpm;
      nextNoteTime += secondsPerBeat / 2;
      this.beatCount++;
    };

    const scheduler = () => {
      while (nextNoteTime < ctx.currentTime + scheduleAheadTime) {
        scheduleNote(this.beatCount, nextNoteTime);
        nextNote();
      }
    };

    this.schedulerTimer = window.setInterval(scheduler, lookahead);

    const beatChecker = () => {
      const audioCurrentTime = ctx.currentTime;
      while (notesInQueue.length && notesInQueue[0].noteTime < audioCurrentTime) {
        const note = notesInQueue.shift()!;
        const isStrong = note.note % 4 === 0;
        const conf = isStrong ? 0.95 : 0.6;
        const now = performance.now();
        this.lastBeatTimestamp = now;
        this.currentConfidence = conf;
        if (isStrong) {
          this.lastStrongBeatTimestamp = now;
          this.strongBeatCount++;
        }
        this.emitBeatEvent(conf, isStrong);
      }
    };

    const beatCheckerInterval = window.setInterval(beatChecker, 5);
    (this as unknown as { _beatCheckerInterval: number })._beatCheckerInterval = beatCheckerInterval;
  }

  private startFrameLoop(): void {
    const tick = () => {
      const now = performance.now();
      if (now - this.lastEmitTime >= this.emitInterval) {
        this.lastEmitTime = now;
        const timeSinceLastBeat = now - this.lastBeatTimestamp;
        if (timeSinceLastBeat > this.beatInterval * 1.5) {
          this.currentConfidence = Math.max(0, this.currentConfidence - 0.02);
        }
        this.emitBeatEvent(this.currentConfidence, false);
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private emitBeatEvent(confidence: number, isStrongBeat: boolean): void {
    const now = performance.now();
    const event: BeatEvent = {
      timestamp: now,
      confidence,
      isStrongBeat,
      beatIndex: this.beatCount,
      bpm: this.bpm,
      timeSinceLastBeat: now - this.lastBeatTimestamp,
      timeToNextBeat: this.getTimeToNextBeat()
    };
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  onBeat(listener: BeatListener): void {
    this.listeners.push(listener);
  }

  getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  getBeatInterval(): number {
    return this.beatInterval;
  }

  getBpm(): number {
    return this.bpm;
  }

  getTimeSinceLastBeat(): number {
    return performance.now() - this.lastBeatTimestamp;
  }

  getTimeSinceLastStrongBeat(): number {
    return performance.now() - this.lastStrongBeatTimestamp;
  }

  getTimeToNextBeat(): number {
    const elapsed = this.getTimeSinceLastBeat();
    return Math.max(0, this.beatInterval - (elapsed % this.beatInterval));
  }

  getTimeToNextStrongBeat(): number {
    const strongInterval = this.beatInterval * 2;
    const elapsed = this.getTimeSinceLastStrongBeat();
    return Math.max(0, strongInterval - (elapsed % strongInterval));
  }

  destroy(): void {
    if (this.schedulerTimer) clearInterval(this.schedulerTimer);
    const bci = (this as unknown as { _beatCheckerInterval?: number })._beatCheckerInterval;
    if (bci) clearInterval(bci);
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.audioContext) this.audioContext.close();
    this.listeners = [];
  }
}
