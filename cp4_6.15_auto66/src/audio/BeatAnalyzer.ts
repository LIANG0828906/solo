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

  getBeats(): IBeatData[] {
    return this.beats;
  }

  getCurrentBPM(): number {
    return this.currentConfig?.bpm ?? 120;
  }

  getBeatInterval(): number {
    return 60 / (this.currentConfig?.bpm ?? 120);
  }

  getVinylRotationSpeed(): number {
    const bpm = this.currentConfig?.bpm ?? 120;
    return (bpm / 60) * 3;
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
    const audioUrl = config.audioUrl;

    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const buffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));

    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const beatInterval = 60 / config.bpm;
    const beats: IBeatData[] = [];

    const windowSize = Math.floor(sampleRate * beatInterval * 0.6);
    const hopSize = Math.floor(sampleRate * 0.01);

    let energyHistory: number[] = [];
    for (let i = 0; i < channelData.length; i += hopSize) {
      let energy = 0;
      const end = Math.min(i + windowSize, channelData.length);
      for (let j = i; j < end; j++) {
        energy += Math.abs(channelData[j]);
      }
      energy = energy / (end - i);
      energyHistory.push(energy);
    }

    const expectedBeats = Math.floor(buffer.duration / beatInterval);
    const types: Array<'spike' | 'bar' | 'wall'> = ['spike', 'bar', 'wall'];

    for (let i = 0; i < expectedBeats; i++) {
      const time = i * beatInterval;
      const hopIndex = Math.floor((time / buffer.duration) * energyHistory.length);

      let intensity = 0.5;
      if (hopIndex < energyHistory.length) {
        const window = energyHistory.slice(
          Math.max(0, hopIndex - 10),
          Math.min(energyHistory.length, hopIndex + 10)
        );
        const maxE = Math.max(...window);
        const avgE = window.reduce((a, b) => a + b, 0) / window.length || 1;
        intensity = Math.min(1, (maxE / avgE - 1) * 0.7 + 0.3);
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

  private parseProceduralBeatMap(config: ISongConfig): IBeatData[] {
    const beats: IBeatData[] = [];
    const beatInterval = 60 / config.bpm;
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

    const beatInterval = 60 / config.bpm;
    const totalBeats = Math.floor(config.duration / beatInterval);

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
          this.onBeatCallback!(beat, beatIndex);
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
    if (!this.isPlaying || !this.currentConfig) return 0;
    const interval = this.getBeatInterval();
    return (this.getCurrentTime() % interval) / interval;
  }

  getNextBeatIntensity(): number {
    if (!this.isPlaying) return 0;
    const t = this.getCurrentTime();
    const idx = this.beats.findIndex(b => b.time > t);
    return idx >= 0 ? this.beats[idx].intensity : 0;
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
