import { BeatAnalyzer } from './BeatAnalyzer';

export class MusicPlayer {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private gainNodes: GainNode[] = [];
  private startTime: number = 0;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private pauseTime: number = 0;
  private currentBPM: number = 128;
  private beatInterval: number = 60000 / 128;
  private currentTime: number = 0;
  private scheduleAheadTime: number = 0.1;
  private nextNoteTime: number = 0;
  private beatCallbacks: Array<(beatIndex: number, timeMs: number) => void> = [];
  private progressCallbacks: Array<(progress: number) => void> = [];
  private endCallbacks: Array<() => void> = [];
  private duration: number = 64000;
  private scheduledBeats: Set<number> = new Set();
  private animationFrameId: number | null = null;
  private beatAnalyzer: BeatAnalyzer;

  constructor(beatAnalyzer: BeatAnalyzer) {
    this.beatAnalyzer = beatAnalyzer;
  }

  init(): void {
    const ctx = this.beatAnalyzer.getContext();
    if (!ctx) return;
    this.audioContext = ctx;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(ctx.destination);
  }

  async loadLevel(bpm: number, duration: number): Promise<void> {
    this.currentBPM = bpm;
    this.beatInterval = 60000 / bpm;
    this.duration = duration;
    this.scheduledBeats.clear();
  }

  onBeat(callback: (beatIndex: number, timeMs: number) => void): void {
    this.beatCallbacks.push(callback);
  }

  onProgress(callback: (progress: number) => void): void {
    this.progressCallbacks.push(callback);
  }

  onEnd(callback: () => void): void {
    this.endCallbacks.push(callback);
  }

  private clearCallbacks(): void {
    this.beatCallbacks = [];
    this.progressCallbacks = [];
    this.endCallbacks = [];
  }

  async play(): Promise<void> {
    if (!this.audioContext) return;
    await this.beatAnalyzer.resume();
    if (this.isPaused) {
      this.startTime = this.audioContext.currentTime - (this.pauseTime / 1000);
      this.nextNoteTime = this.audioContext.currentTime + (this.beatInterval / 1000) - ((this.pauseTime % this.beatInterval) / 1000);
      this.isPaused = false;
    } else {
      this.startTime = this.audioContext.currentTime;
      this.nextNoteTime = this.audioContext.currentTime + this.beatInterval / 1000;
      this.currentTime = 0;
    }
    this.isPlaying = true;
    this.scheduler();
  }

  pause(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.isPaused = true;
    if (this.audioContext) {
      this.pauseTime = (this.audioContext.currentTime - this.startTime) * 1000;
    }
    this.stopAllOscillators();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  reset(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentTime = 0;
    this.pauseTime = 0;
    this.scheduledBeats.clear();
    this.stopAllOscillators();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private scheduler(): void {
    if (!this.audioContext || !this.isPlaying) return;
    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      const beatIndex = Math.round((this.nextNoteTime - this.startTime) / (this.beatInterval / 1000));
      if (!this.scheduledBeats.has(beatIndex)) {
        this.scheduleNote(beatIndex, this.nextNoteTime);
        this.scheduledBeats.add(beatIndex);
      }
      this.nextNoteTime += this.beatInterval / 1000;
    }
    this.updateProgress();
    this.animationFrameId = requestAnimationFrame(() => this.scheduler());
  }

  private scheduleNote(beatIndex: number, time: number): void {
    if (!this.audioContext || !this.masterGain) return;
    const isKick = beatIndex % 4 === 0;
    const isSnare = beatIndex % 2 === 0 && beatIndex % 4 !== 0;
    const isHiHat = beatIndex % 2 !== 0;
    const noteTimeMs = (time - this.startTime) * 1000;
    setTimeout(() => {
      this.beatCallbacks.forEach(cb => cb(beatIndex, noteTimeMs));
    }, Math.max(0, noteTimeMs - this.getCurrentTime()));
    if (isKick) this.playKick(time);
    if (isSnare) this.playSnare(time);
    if (isHiHat) this.playHiHat(time);
    if (beatIndex % 8 === 0) this.playMelody(time, beatIndex);
  }

  private playKick(time: number): void {
    if (!this.audioContext || !this.masterGain) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  private playSnare(time: number): void {
    if (!this.audioContext || !this.masterGain) return;
    const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.2, this.audioContext.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    noiseGain.gain.setValueAtTime(0.4, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(time);
    noise.stop(time + 0.15);
  }

  private playHiHat(time: number): void {
    if (!this.audioContext || !this.masterGain) return;
    const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.05, this.audioContext.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;
    noiseGain.gain.setValueAtTime(0.15, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(time);
    noise.stop(time + 0.05);
  }

  private playMelody(time: number, beatIndex: number): void {
    if (!this.audioContext || !this.masterGain) return;
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    const note = scale[beatIndex % scale.length];
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'square';
    osc.frequency.value = note;
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.3);
  }

  private updateProgress(): void {
    if (!this.audioContext || !this.isPlaying) return;
    this.currentTime = (this.audioContext.currentTime - this.startTime) * 1000;
    const progress = Math.min(1, this.currentTime / this.duration);
    this.progressCallbacks.forEach(cb => cb(progress));
    if (this.currentTime >= this.duration) {
      this.stop();
      this.endCallbacks.forEach(cb => cb());
    }
  }

  stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.stopAllOscillators();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private stopAllOscillators(): void {
    this.oscillators.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    this.oscillators = [];
    this.gainNodes = [];
  }

  getCurrentTime(): number {
    if (!this.audioContext) return 0;
    if (this.isPlaying) {
      return (this.audioContext.currentTime - this.startTime) * 1000;
    }
    return this.pauseTime;
  }

  getDuration(): number {
    return this.duration;
  }

  getBPM(): number {
    return this.currentBPM;
  }

  getBeatInterval(): number {
    return this.beatInterval;
  }

  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  destroy(): void {
    this.stop();
    this.clearCallbacks();
    if (this.masterGain) {
      try { this.masterGain.disconnect(); } catch (e) {}
    }
    this.masterGain = null;
  }
}
