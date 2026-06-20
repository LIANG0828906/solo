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
  private scriptProcessor: ScriptProcessorNode | null = null;
  private gainNode: GainNode | null = null;
  private listeners: BeatListener[] = [];
  private lastBeatTimestamp = 0;
  private lastStrongBeatTimestamp = 0;
  private beatInterval = 500;
  private currentConfidence = 0;
  private schedulerTimer: number | null = null;
  private beatCheckerTimer: number | null = null;
  private stateTimer: number | null = null;
  private bpm = 120;
  private beatCount = 0;
  private strongBeatCount = 0;
  private lastEmitTime = 0;
  private emitInterval = 16;
  private freqCache: Uint8Array<ArrayBuffer> | null = null;
  private freqCacheTime = 0;
  private freqCacheInterval = 33;

  constructor() {
    this.beatInterval = 60000 / this.bpm;
  }

  async init(): Promise<void> {
    this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.75;

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0.5;
    this.gainNode.connect(this.audioContext.destination);

    this.analyser.connect(this.gainNode);

    this.scriptProcessor = this.audioContext.createScriptProcessor(2048, 1, 1);
    this.scriptProcessor.onaudioprocess = this.handleAudioProcess.bind(this);
    this.analyser.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext.destination);

    this.lastBeatTimestamp = performance.now();
    this.lastStrongBeatTimestamp = performance.now();

    this.startDrumSequence();
    this.startStateEmitter();
  }

  private handleAudioProcess(e: AudioProcessingEvent): void {
    if (!this.analyser) return;

    const now = performance.now();
    const bufferLength = this.analyser.frequencyBinCount;
    if (!this.freqCache || this.freqCache.length !== bufferLength) {
      this.freqCache = new Uint8Array(new ArrayBuffer(bufferLength));
    }
    if (now - this.freqCacheTime >= this.freqCacheInterval) {
      this.analyser.getByteFrequencyData(this.freqCache);
      this.freqCacheTime = now;

      let sum = 0;
      const lowEnd = Math.min(20, bufferLength);
      for (let i = 0; i < lowEnd; i++) sum += this.freqCache[i];
      const lowAvg = sum / lowEnd;
      const confFromFFT = Math.min(1, lowAvg / 180);
      if (confFromFFT > this.currentConfidence) {
        this.currentConfidence = confFromFFT;
      }
    }

    const input = e.inputBuffer.getChannelData(0);
    let peak = 0;
    for (let i = 0; i < input.length; i += 8) {
      const v = Math.abs(input[i]);
      if (v > peak) peak = v;
    }
    if (peak > 0.2) {
      const confFromPeak = Math.min(1, peak * 1.8);
      if (confFromPeak > this.currentConfidence) {
        this.currentConfidence = confFromPeak;
      }
    }
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
      if (!this.audioContext) return;
      const audioCurrentTime = this.audioContext.currentTime;
      while (notesInQueue.length && notesInQueue[0].noteTime < audioCurrentTime) {
        const note = notesInQueue.shift()!;
        const isStrong = note.note % 4 === 0;
        const conf = isStrong ? 0.95 : 0.6;
        const now = performance.now();
        this.lastBeatTimestamp = now;
        if (conf > this.currentConfidence) this.currentConfidence = conf;
        if (isStrong) {
          this.lastStrongBeatTimestamp = now;
          this.strongBeatCount++;
        }
        this.emitBeatEvent(conf, isStrong);
      }
    };

    this.beatCheckerTimer = window.setInterval(beatChecker, 5);
  }

  private startStateEmitter(): void {
    this.stateTimer = window.setInterval(() => {
      const now = performance.now();
      if (now - this.lastEmitTime >= this.emitInterval) {
        this.lastEmitTime = now;
        const timeSinceLastBeat = now - this.lastBeatTimestamp;
        if (timeSinceLastBeat > this.beatInterval * 1.5) {
          this.currentConfidence = Math.max(0, this.currentConfidence - 0.015);
        }
        this.emitBeatEvent(this.currentConfidence, false);
      }
    }, 8);
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
    const listenersSnapshot = this.listeners.slice();
    for (const listener of listenersSnapshot) {
      try {
        listener(event);
      } catch (err) {
        console.error('[BeatDetector] Listener error:', err);
      }
    }
  }

  onBeat(listener: BeatListener): void {
    this.listeners.push(listener);
  }

  getFrequencyData(): Uint8Array {
    const now = performance.now();
    if (this.analyser) {
      if (!this.freqCache || now - this.freqCacheTime > this.freqCacheInterval) {
        const bufferLength = this.analyser.frequencyBinCount;
        this.freqCache = new Uint8Array(new ArrayBuffer(bufferLength));
        this.analyser.getByteFrequencyData(this.freqCache);
        this.freqCacheTime = now;
      }
      return new Uint8Array(this.freqCache.buffer.slice(0));
    }
    return new Uint8Array(new ArrayBuffer(0));
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

  getStrongBeatCount(): number {
    return this.strongBeatCount;
  }

  destroy(): void {
    if (this.schedulerTimer) clearInterval(this.schedulerTimer);
    if (this.beatCheckerTimer) clearInterval(this.beatCheckerTimer);
    if (this.stateTimer) clearInterval(this.stateTimer);
    try {
      this.scriptProcessor?.disconnect();
    } catch (_e) { /* noop */ }
    try {
      this.analyser?.disconnect();
    } catch (_e) { /* noop */ }
    try {
      this.gainNode?.disconnect();
    } catch (_e) { /* noop */ }
    if (this.audioContext) {
      this.audioContext.close().catch(() => { /* noop */ });
    }
    this.listeners = [];
    this.freqCache = null;
  }
}
