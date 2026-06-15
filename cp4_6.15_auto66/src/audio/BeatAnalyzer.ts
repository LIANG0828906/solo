import * as Tone from 'tone';
import type { IBeatData, ISongConfig } from '../types';

export class BeatAnalyzer {
  private beats: IBeatData[] = [];
  private audioBuffer: AudioBuffer | null = null;
  private player: Tone.Player | null = null;
  private startTime: number = 0;
  private isPlaying: boolean = false;

  async analyzeSong(config: ISongConfig): Promise<IBeatData[]> {
    this.beats = this.generateBeatMap(config);
    return this.beats;
  }

  private generateBeatMap(config: ISongConfig): IBeatData[] {
    const beats: IBeatData[] = [];
    const beatInterval = 60 / config.bpm;
    const totalBeats = Math.floor(config.duration / beatInterval);

    let lastType: 'spike' | 'bar' | 'wall' = 'spike';
    const types: Array<'spike' | 'bar' | 'wall'> = ['spike', 'bar', 'wall'];

    for (let i = 0; i < totalBeats; i++) {
      const time = i * beatInterval;
      const intensity = 0.5 + Math.random() * 0.5;

      let type: 'spike' | 'bar' | 'wall';
      if (i % 8 === 0) {
        type = 'wall';
      } else if (i % 4 === 0) {
        type = 'bar';
      } else {
        type = 'spike';
      }

      if (type === lastType && Math.random() > 0.4) {
        const idx = types.indexOf(type);
        type = types[(idx + 1 + Math.floor(Math.random() * 2)) % 3];
      }
      lastType = type;

      const lane = Math.floor(Math.random() * 3);

      beats.push({ time, intensity, type });
    }

    return beats;
  }

  async loadAndPlay(config: ISongConfig, onEnd?: () => void): Promise<void> {
    await Tone.start();

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
        onEnd?.();
      },
    }).toDestination();

    if (config.audioUrl) {
      await Tone.loaded();
    }

    this.startTime = Tone.now();
    this.isPlaying = true;
    this.player.start();
  }

  playProceduralMusic(config: ISongConfig, onEnd?: () => void): void {
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
        synth.dispose();
        bass.dispose();
        noise.dispose();
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
        synth.triggerAttackRelease(noteIdx < 2 ? notes[noteIdx] : notes[noteIdx].replace('2', '4'), '16n', time);
      }

      beatIndex++;
    }, beatInterval);

    this.startTime = Tone.now();
    this.isPlaying = true;

    Tone.Transport.start();
    loop.start(0);
  }

  getCurrentTime(): number {
    if (!this.isPlaying) return 0;
    return Tone.now() - this.startTime;
  }

  getBeats(): IBeatData[] {
    return this.beats;
  }

  stop(): void {
    if (this.player) {
      this.player.stop();
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();
    this.isPlaying = false;
  }

  dispose(): void {
    this.stop();
    this.player?.dispose();
  }
}
