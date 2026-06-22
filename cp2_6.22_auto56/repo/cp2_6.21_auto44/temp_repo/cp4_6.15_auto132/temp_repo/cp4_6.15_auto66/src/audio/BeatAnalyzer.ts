import * as Tone from 'tone';
import type { IBeatData, ISongConfig } from '../types';

export type BeatCallback = (beat: IBeatData, index: number) => void;

export class BeatAnalyzer {
  private beats: IBeatData[] = [];
  private audioBuffer: AudioBuffer | null = null;
  private player: Tone.Player | null = null;
  private startTime: number = 0;
  private isPlaying: boolean = false;
  private currentConfig: ISongConfig | null = null;
  private onBeatCallback: BeatCallback | null = null;
  private triggeredBeats: Set<number> = new Set();
  private activeLoops: Tone.Loop[] = [];
  private detectedBPM: number = 120;

  getBeats(): IBeatData[] {
    return this.beats;
  }

  getDetectedBPM(): number {
    return this.detectedBPM;
  }

  getCurrentBPM(): number {
    return this.detectedBPM;
  }

  getBeatInterval(): number {
    return 60 / this.detectedBPM;
  }

  getVinylRotationSpeed(): number {
    return (this.detectedBPM / 60) * 3;
  }

  setOnBeatCallback(cb: BeatCallback): void {
    this.onBeatCallback = cb;
  }

  async parse(config: ISongConfig): Promise<IBeatData[]> {
    this.currentConfig = config;

    if (config.audioUrl) {
      this.beats = await this.parseRealAudio(config);
    } else {
      this.beats = this.parseProceduralBeatMap(config);
    }

    return this.beats;
  }

  private async parseRealAudio(config: ISongConfig): Promise<IBeatData[]> {
    const t0 = performance.now();

    await Tone.start();
    const response = await fetch(config.audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const buffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    this.audioBuffer = buffer;

    this.detectedBPM = this.detectBPMWithAutocorrelation(
      buffer.getChannelData(0),
      buffer.sampleRate
    );
    console.log(`[BeatAnalyzer] 自相关检测 BPM: ${this.detectedBPM.toFixed(1)} (标称: ${config.bpm})`);

    const sampleRate = buffer.sampleRate;
    const beatInterval = 60 / this.detectedBPM;
    const duration = buffer.duration;
    const totalBeats = Math.floor(duration / beatInterval);
    const beats: IBeatData[] = [];

    const windowSize = Math.floor(sampleRate * beatInterval * 0.6);
    const hopSize = Math.max(1, Math.floor(sampleRate * 0.01));
    const channelData = buffer.getChannelData(0);

    const energyHistory: number[] = [];
    for (let i = 0; i < channelData.length; i += hopSize) {
      let energy = 0;
      const end = Math.min(i + windowSize, channelData.length);
      for (let j = i; j < end; j++) {
        energy += Math.abs(channelData[j]);
      }
      energy = energy / Math.max(1, (end - i));
      energyHistory.push(energy);
    }

    const types: Array<'spike' | 'bar' | 'wall'> = ['spike', 'bar', 'wall'];
    for (let i = 0; i < totalBeats; i++) {
      const time = i * beatInterval;
      const hopIndex = Math.floor((time / duration) * energyHistory.length);

      let intensity = 0.5;
      if (hopIndex >= 0 && hopIndex < energyHistory.length) {
        const start = Math.max(0, hopIndex - 10);
        const end = Math.min(energyHistory.length, hopIndex + 10);
        const window = energyHistory.slice(start, end);
        const maxE = Math.max(...window);
        const avgE = window.reduce((a, b) => a + b, 0) / Math.max(1, window.length) || 1;
        intensity = Math.min(1, Math.max(0.2, (maxE / avgE - 1) * 0.7 + 0.3));
      }

      let type: 'spike' | 'bar' | 'wall';
      if (i % 8 === 0) type = 'wall';
      else if (i % 4 === 0) type = 'bar';
      else type = types[Math.floor(Math.random() * 2)];

      beats.push({ time, intensity, type });
    }

    const latency = performance.now() - t0;
    if (latency > 50) {
      console.warn(`[BeatAnalyzer] 解析耗时: ${latency.toFixed(0)}ms (超过50ms阈值)`);
    }

    audioCtx.close();
    return beats;
  }

  private detectBPMWithAutocorrelation(channelData: Float32Array, sampleRate: number): number {
    const WINDOW_SEC = 5;
    const MIN_BPM = 60;
    const MAX_BPM = 220;
    const windowSamples = Math.min(channelData.length, Math.floor(sampleRate * WINDOW_SEC));
    const windowData = new Float32Array(windowSamples);
    for (let i = 0; i < windowSamples; i++) {
      windowData[i] = Math.abs(channelData[i]);
    }

    const mean = windowData.reduce((a, b) => a + b, 0) / windowSamples;
    for (let i = 0; i < windowSamples; i++) {
      windowData[i] -= mean;
    }

    const minLag = Math.floor(sampleRate * 60 / MAX_BPM);
    const maxLag = Math.floor(sampleRate * 60 / MIN_BPM);

    let bestLag = minLag;
    let bestCorr = -Infinity;

    for (let lag = minLag; lag <= maxLag; lag++) {
      let corr = 0;
      for (let i = 0; i < windowSamples - lag; i += 8) {
        corr += windowData[i] * windowData[i + lag];
      }
      corr /= Math.max(1, (windowSamples - lag) / 8);
      if (corr > bestCorr) {
        bestCorr = corr;
        bestLag = lag;
      }
    }

    let estimatedBPM = sampleRate / bestLag * 60;
    while (estimatedBPM < 80) estimatedBPM *= 2;
    while (estimatedBPM > 180) estimatedBPM /= 2;

    if (this.currentConfig) {
      const nominal = this.currentConfig.bpm;
      const ratios = [0.5, 0.666, 0.75, 1, 1.333, 1.5, 2];
      let bestScore = Infinity;
      let best = estimatedBPM;
      for (const r of ratios) {
        const candidate = estimatedBPM * r;
        const score = Math.abs(candidate - nominal);
        if (score < bestScore) {
          bestScore = score;
          best = candidate;
        }
      }
      estimatedBPM = best;
    }

    return Math.max(60, Math.min(200, estimatedBPM));
  }

  private parseProceduralBeatMap(config: ISongConfig): IBeatData[] {
    const beats: IBeatData[] = [];
    const bpm = config.bpm;
    this.detectedBPM = bpm;
    const beatInterval = 60 / bpm;
    const totalBeats = Math.floor(config.duration / beatInterval);

    const types: Array<'spike' | 'bar' | 'wall'> = ['spike', 'bar', 'wall'];

    for (let i = 0; i < totalBeats; i++) {
      const time = i * beatInterval;

      let intensity: number;
      if (i % 8 === 0) {
        intensity = 0.85 + Math.random() * 0.15;
      } else if (i % 4 === 0) {
        intensity = 0.7 + Math.random() * 0.2;
      } else {
        const base = 0.5;
        const modulation = Math.sin(i * 0.3) * 0.15;
        intensity = base + modulation + Math.random() * 0.15;
      }
      intensity = Math.min(1, Math.max(0.2, intensity));

      let type: 'spike' | 'bar' | 'wall';
      if (i % 8 === 0) type = 'wall';
      else if (i % 4 === 0) type = 'bar';
      else type = types[Math.floor(Math.random() * 2)];

      beats.push({ time, intensity, type });
    }

    return beats;
  }

  async loadAndPlay(config: ISongConfig, onEnd?: () => void): Promise<void> {
    await Tone.start();
    this.cleanupLoops();

    if (this.player) {
      this.player.stop();
      this.player.dispose();
    }

    this.player = new Tone.Player({
      url: config.audioUrl,
      onload: () => {
        this.audioBuffer = this.player!.buffer?.get() ?? null;
      },
      onstop: () => {
        this.isPlaying = false;
        this.cleanupLoops();
        onEnd?.();
      },
    }).toDestination();

    if (config.audioUrl) {
      await Tone.loaded();
    }

    this.scheduleBeatCallbacks();

    this.startTime = Tone.now();
    this.isPlaying = true;
    this.triggeredBeats.clear();
    this.player.start();
  }

  playProceduralMusic(config: ISongConfig, onEnd?: () => void): void {
    this.cleanupLoops();
    Tone.Transport.cancel();
    Tone.Transport.stop();

    const beatInterval = 60 / this.detectedBPM;
    const totalBeats = this.beats.length;

    const synth = new Tone.Synth({
      oscillator: { type: config.style === 'electronic' ? 'sawtooth' : config.style === 'rock' ? 'square' : 'triangle' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.2 },
    }).toDestination();

    const bass = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.4, release: 0.3 },
    }).toDestination();

    const noise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
    }).toDestination();

    noise.volume.value = -20;
    bass.volume.value = -8;

    const notes = config.style === 'electronic'
      ? ['C3', 'Eb3', 'G3', 'Bb3']
      : config.style === 'rock'
        ? ['E2', 'G2', 'A2', 'B2']
        : ['C2', 'F2', 'G2', 'Bb2'];

    let beatIndex = 0;

    const loop = new Tone.Loop((time) => {
      if (beatIndex >= totalBeats) {
        loop.stop();
        this.cleanupLoops();
        setTimeout(() => {
          synth.dispose();
          bass.dispose();
          noise.dispose();
        }, 500);
        onEnd?.();
        return;
      }

      noise.triggerAttackRelease('16n', time);

      if (beatIndex % 2 === 0) {
        const noteIdx = Math.floor(beatIndex / 4) % notes.length;
        bass.triggerAttackRelease(notes[noteIdx], '8n', time);
      }

      if (beatIndex % 4 === 0) {
        const noteIdx = Math.floor(beatIndex / 4) % notes.length;
        synth.triggerAttackRelease(notes[noteIdx].replace('2', '4'), '16n', time);
      }

      const beat = this.beats[beatIndex];
      if (beat && this.onBeatCallback) {
        Tone.Draw.schedule(() => {
          if (!this.triggeredBeats.has(beatIndex)) {
            this.triggeredBeats.add(beatIndex);
            this.onBeatCallback!(beat, beatIndex);
          }
        }, time);
      }

      beatIndex++;
    }, beatInterval);

    this.activeLoops.push(loop);
    this.scheduleBeatCallbacks();

    this.startTime = Tone.now();
    this.isPlaying = true;
    this.triggeredBeats.clear();

    Tone.Transport.start();
    loop.start(0);
  }

  private scheduleBeatCallbacks(): void {
    if (!this.onBeatCallback) return;

    this.beats.forEach((beat, index) => {
      Tone.Transport.schedule((time) => {
        Tone.Draw.schedule(() => {
          if (!this.triggeredBeats.has(index)) {
            this.triggeredBeats.add(index);
            this.onBeatCallback!(beat, index);
          }
        }, time);
      }, beat.time);
    });
  }

  private cleanupLoops(): void {
    for (const loop of this.activeLoops) {
      try {
        loop.stop();
        loop.dispose();
      } catch {}
    }
    this.activeLoops = [];
  }

  getCurrentTime(): number {
    if (!this.isPlaying) return 0;
    return Tone.now() - this.startTime;
  }

  getBeatProgress(): number {
    if (!this.isPlaying || this.beats.length === 0) return 0;
    const t = this.getCurrentTime();

    let left = 0;
    let right = this.beats.length - 1;
    while (left <= right) {
      const mid = (left + right) >> 1;
      if (this.beats[mid].time <= t) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    const nextIndex = Math.min(left, this.beats.length - 1);
    const prevIndex = Math.max(0, nextIndex - 1);
    const prevBeat = this.beats[prevIndex];
    const nextBeat = this.beats[nextIndex];

    if (nextIndex === prevIndex) return 0;

    const span = nextBeat.time - prevBeat.time;
    if (span <= 0) return 0;

    return Math.max(0, Math.min(1, (t - prevBeat.time) / span));
  }

  getNextBeatIntensity(): number {
    if (!this.isPlaying || this.beats.length === 0) return 0;
    const t = this.getCurrentTime();
    const idx = this.beats.findIndex(b => b.time > t);
    return idx >= 0 ? this.beats[idx].intensity : 0;
  }

  getNextBeatTime(): number {
    if (!this.isPlaying || this.beats.length === 0) return -1;
    const t = this.getCurrentTime();
    const idx = this.beats.findIndex(b => b.time > t);
    return idx >= 0 ? this.beats[idx].time : -1;
  }

  getCurrentBeatIndex(): number {
    if (!this.isPlaying || this.beats.length === 0) return -1;
    const t = this.getCurrentTime();
    let idx = 0;
    while (idx < this.beats.length && this.beats[idx].time <= t) {
      idx++;
    }
    return idx - 1;
  }

  stop(): void {
    if (this.player) {
      this.player.stop();
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();
    this.cleanupLoops();
    this.isPlaying = false;
    this.triggeredBeats.clear();
  }

  dispose(): void {
    this.stop();
    this.player?.dispose();
  }
}
