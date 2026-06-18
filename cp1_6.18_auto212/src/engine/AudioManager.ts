import { audioLoader } from '@/utils/audioLoader';
import type { SoundBlock } from './SoundBlock';

interface TrackEntry {
  block: SoundBlock;
  audio: HTMLAudioElement | null;
  loading: boolean;
  gainNode?: GainNode;
  sourceNode?: MediaElementAudioSourceNode;
}

export class AudioManager {
  private static _instance: AudioManager | null = null;

  static get instance(): AudioManager {
    if (!AudioManager._instance) {
      AudioManager._instance = new AudioManager();
    }
    return AudioManager._instance;
  }

  private tracks: Map<string, TrackEntry> = new Map();
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(32)) as Uint8Array<ArrayBuffer>;
  private _totalVolume = 80;
  private onDataCb: (() => void) | null = null;
  private rafId = 0;

  private constructor() {}

  setDataCallback(cb: (() => void) | null): void {
    this.onDataCb = cb;
    if (cb && !this.rafId) {
      this.tick();
    }
  }

  private ensureContext(): void {
    if (this.ctx) return;
    try {
      const Ctx =
        (window as unknown as { AudioContext: typeof AudioContext }).AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._totalVolume / 100;
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    } catch {
      /* noop */
    }
  }

  async resumeContext(): Promise<void> {
    this.ensureContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        /* noop */
      }
    }
  }

  get totalVolume(): number {
    return this._totalVolume;
  }

  set totalVolume(v: number) {
    this._totalVolume = Math.max(0, Math.min(100, v));
    if (this.masterGain) {
      this.masterGain.gain.value = this._totalVolume / 100;
    }
  }

  async addTrack(block: SoundBlock): Promise<void> {
    if (this.tracks.size >= 6 && !this.tracks.has(block.id)) {
      return;
    }
    if (this.tracks.has(block.id)) {
      this.updateTrack(block);
      return;
    }
    const entry: TrackEntry = { block, audio: null, loading: true };
    this.tracks.set(block.id, entry);
    try {
      const audio = await audioLoader.load(block.audioSrc);
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.loop = true;
      clone.volume = block.muted ? 0 : block.volume / 100;
      entry.audio = clone;
      entry.loading = false;

      this.ensureContext();
      if (this.ctx && this.masterGain) {
        try {
          const src = this.ctx.createMediaElementSource(clone);
          const gain = this.ctx.createGain();
          gain.gain.value = 1;
          src.connect(gain);
          gain.connect(this.masterGain);
          entry.sourceNode = src;
          entry.gainNode = gain;
        } catch {
          /* noop */
        }
      }

      try {
        const p = clone.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {
            /* autoplay may be blocked until user gesture */
          });
        }
      } catch {
        /* noop */
      }
    } catch {
      entry.loading = false;
    }
  }

  updateTrack(block: SoundBlock): void {
    const entry = this.tracks.get(block.id);
    if (!entry) return;
    entry.block = block;
    if (entry.audio) {
      entry.audio.volume = block.muted ? 0 : block.volume / 100;
    }
    if (entry.gainNode) {
      entry.gainNode.gain.value = block.muted ? 0 : 1;
    }
  }

  removeTrack(blockId: string): void {
    const entry = this.tracks.get(blockId);
    if (!entry) return;
    try {
      if (entry.audio) {
        entry.audio.pause();
        entry.audio.src = '';
      }
      if (entry.gainNode) entry.gainNode.disconnect();
      if (entry.sourceNode) entry.sourceNode.disconnect();
    } catch {
      /* noop */
    }
    this.tracks.delete(blockId);
  }

  reorderTracks(ids: string[]): void {
    const next = new Map<string, TrackEntry>();
    for (const id of ids) {
      const t = this.tracks.get(id);
      if (t) next.set(id, t);
    }
    this.tracks = next;
  }

  stopAll(): void {
    for (const id of Array.from(this.tracks.keys())) {
      this.removeTrack(id);
    }
  }

  getAudioData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.freqData);
    }
    return this.freqData;
  }

  getAverageLevel(): number {
    const data = this.getAudioData();
    if (data.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    return sum / data.length / 255;
  }

  getTrackCount(): number {
    return this.tracks.size;
  }

  private tick = (): void => {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.freqData);
    }
    if (this.onDataCb) {
      try {
        this.onDataCb();
      } catch {
        /* noop */
      }
    }
    this.rafId = requestAnimationFrame(this.tick);
  };
}

export const audioManager = AudioManager.instance;
