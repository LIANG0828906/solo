export type BeatListener = (confidence: number, isStrongBeat: boolean) => void;

export class BeatDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private listeners: BeatListener[] = [];
  private lastBeatTime = 0;
  private beatInterval = 500;
  private confidence = 0;
  private currentTime = 0;
  private schedulerTimer: number | null = null;
  private analyserTimer: number | null = null;
  private bpm = 120;
  private beatCount = 0;

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
    this.startDrumSequence();
    this.startAnalyser();
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
      const currentTime = ctx.currentTime;
      while (notesInQueue.length && notesInQueue[0].noteTime < currentTime) {
        const note = notesInQueue.shift()!;
        const isStrong = note.note % 4 === 0;
        const conf = isStrong ? 0.95 : 0.6;
        this.lastBeatTime = performance.now();
        this.confidence = conf;
        this.emitBeat(conf, isStrong);
      }
      requestAnimationFrame(beatChecker);
    };
    requestAnimationFrame(beatChecker);
  }

  private startAnalyser(): void {
    this.analyserTimer = window.setInterval(() => {
      this.currentTime = performance.now();
      const timeSinceLastBeat = this.currentTime - this.lastBeatTime;
      if (timeSinceLastBeat > this.beatInterval * 1.5) {
        this.confidence = Math.max(0, this.confidence - 0.05);
      }
      this.emitBeat(this.confidence, false);
    }, 100);
  }

  private emitBeat(confidence: number, isStrongBeat: boolean): void {
    for (const listener of this.listeners) {
      listener(confidence, isStrongBeat);
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
    return performance.now() - this.lastBeatTime;
  }

  getTimeToNextBeat(): number {
    const elapsed = this.getTimeSinceLastBeat();
    return Math.max(0, this.beatInterval - (elapsed % this.beatInterval));
  }

  destroy(): void {
    if (this.schedulerTimer) clearInterval(this.schedulerTimer);
    if (this.analyserTimer) clearInterval(this.analyserTimer);
    if (this.audioContext) this.audioContext.close();
  }
}
