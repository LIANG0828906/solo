import type { AudioAnalysisResult } from '../types/gameTypes';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private lastBeatTime: number = 0;
  private cachedResult: AudioAnalysisResult = {
    beatIntensity: 0,
    frequencyDistribution: [],
    bpm: 120,
    isBeat: false
  };
  private beatHistory: number[] = [];
  private bpmEstimate: number = 120;
  private sfxContext: AudioContext | null = null;

  private internalAudioTime: number = 0;
  private audioStartTime: number = 0;
  private isAudioPlaying: boolean = false;
  private beatTimer: number = 0;
  private simulatedBpm: number = 120;
  private lastAnalyzeTime: number = 0;

  constructor() {
    this.initSfxContext();
  }

  private initSfxContext(): void {
    try {
      this.sfxContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported for SFX');
    }
  }

  public async init(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.simulatedBpm = 120;
    } catch (e) {
      console.error('Failed to initialize audio engine:', e);
    }
  }

  public play(): void {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
    if (!this.isAudioPlaying) {
      this.audioStartTime = performance.now() - this.internalAudioTime * 1000;
      this.isAudioPlaying = true;
      this.beatTimer = 0;
    }
  }

  public pause(): void {
    if (this.isAudioPlaying) {
      this.internalAudioTime = (performance.now() - this.audioStartTime) / 1000;
      this.isAudioPlaying = false;
    }
  }

  public stop(): void {
    this.isAudioPlaying = false;
    this.internalAudioTime = 0;
    this.beatTimer = 0;
    this.bpmEstimate = this.simulatedBpm;
  }

  public updateBpm(bpm: number): void {
    this.simulatedBpm = bpm;
    this.bpmEstimate = bpm;
  }

  public playCollectSfx(): void {
    if (!this.sfxContext) return;

    const ctx = this.sfxContext;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  }

  public analyze(): AudioAnalysisResult {
    const now = performance.now();
    const deltaTime = (now - this.lastAnalyzeTime) / 1000;
    this.lastAnalyzeTime = now;

    const freqDist: number[] = [];
    const bands = 8;
    for (let i = 0; i < bands; i++) {
      freqDist.push(0.3 + Math.random() * 0.4);
    }

    let beatIntensity = 0.3 + Math.random() * 0.2;
    let isBeat = false;

    if (this.isAudioPlaying) {
      this.internalAudioTime = (now - this.audioStartTime) / 1000;
      this.beatTimer += deltaTime;

      const beatInterval = 60 / this.simulatedBpm;
      const beatProgress = this.beatTimer / beatInterval;

      beatIntensity = 0.5 + 0.5 * Math.sin(beatProgress * Math.PI);

      const minBeatInterval = beatInterval * 1000 * 0.8;
      if (this.beatTimer >= beatInterval && (now - this.lastBeatTime) > minBeatInterval) {
        isBeat = true;
        this.lastBeatTime = now;
        this.beatTimer = this.beatTimer - beatInterval;
        this.beatHistory.push(now);

        while (this.beatHistory.length > 0 && now - this.beatHistory[0] > 10000) {
          this.beatHistory.shift();
        }

        beatIntensity = 1.0;
      }
    }

    this.cachedResult = {
      beatIntensity,
      frequencyDistribution: freqDist,
      bpm: this.bpmEstimate,
      isBeat
    };

    return this.cachedResult;
  }

  public getCachedAnalysis(): AudioAnalysisResult {
    return this.cachedResult;
  }

  public getCurrentTime(): number {
    if (this.isAudioPlaying) {
      return (performance.now() - this.audioStartTime) / 1000;
    }
    return this.internalAudioTime;
  }

  public getDuration(): number {
    return 300;
  }
}
