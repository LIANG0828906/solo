import type { AudioState, VinylRecord } from '@/types';

class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private source: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private duration: number = 0;
  private currentRecord: VinylRecord | null = null;
  private animationId: number | null = null;
  private listeners: Set<(state: AudioState) => void> = new Set();

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 128;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  async play(record: VinylRecord): Promise<void> {
    if (!this.audioContext) return;

    this.next();

    this.currentRecord = record;
    this.duration = record.duration;
    this.currentTime = 0;
    this.isPlaying = true;

    this.source = this.audioContext.createOscillator();
    this.gainNode = this.audioContext.createGain();

    this.source.type = 'sine';
    this.source.frequency.setValueAtTime(440, this.audioContext.currentTime);

    this.gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);

    this.source.connect(this.gainNode!);
    this.gainNode!.connect(this.analyser!);
    this.analyser!.connect(this.audioContext.destination);

    this.source.start();
    this.startProgressUpdate();
    this.notifyListeners();
  }

  pause(): void {
    if (!this.isPlaying || !this.audioContext) return;
    this.isPlaying = false;
    this.audioContext.suspend();
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.notifyListeners();
  }

  resume(): void {
    if (this.isPlaying || !this.audioContext) return;
    this.isPlaying = true;
    this.audioContext.resume();
    this.startProgressUpdate();
    this.notifyListeners();
  }

  seek(progress: number): void {
    this.currentTime = Math.max(0, Math.min(1, progress)) * this.duration;
    this.notifyListeners();
  }

  next(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.source) {
      try {
        this.source.stop();
      } catch (e) {
        // ignore
      }
      this.source.disconnect();
      this.source = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 0;
    this.currentRecord = null;
    this.notifyListeners();
  }

  getState(): AudioState {
    const frequencyData: number[] = [];
    if (this.dataArray) {
      for (let i = 0; i < this.dataArray.length; i++) {
        frequencyData.push(this.dataArray[i]);
      }
    }
    while (frequencyData.length < 64) {
      frequencyData.push(0);
    }

    return {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      progress: this.duration > 0 ? this.currentTime / this.duration : 0,
      currentRecord: this.currentRecord,
      frequencyData: frequencyData.slice(0, 64),
    };
  }

  subscribe(callback: (state: AudioState) => void): () => void {
    this.listeners.add(callback);
    callback(this.getState());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private startProgressUpdate(): void {
    let lastUpdate = performance.now();

    const update = () => {
      const now = performance.now();
      const delta = now - lastUpdate;

      if (delta >= 16 && this.isPlaying) {
        lastUpdate = now;
        this.currentTime = Math.min(this.currentTime + delta / 1000, this.duration);

        if (this.dataArray) {
          for (let i = 0; i < this.dataArray.length; i++) {
            this.dataArray[i] = Math.floor(Math.random() * 256);
          }
        }

        if (this.currentTime >= this.duration) {
          this.next();
          return;
        }

        this.notifyListeners();
      }

      this.animationId = requestAnimationFrame(update);
    };

    this.animationId = requestAnimationFrame(update);
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((callback) => callback(state));
  }
}

const audioEngine = new AudioEngine();
export default audioEngine;
