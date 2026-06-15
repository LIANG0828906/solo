import type { FrequencyData } from './types.d';

type FrequencyCallback = (data: FrequencyData) => void;
type ProgressCallback = (time: number, duration: number) => void;

class AudioManager {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private frequencyData: Uint8Array | null = null;
  private startTime = 0;
  private pauseTime = 0;
  private isPlaying = false;
  private duration = 0;
  private volume = 0.8;
  private freqCallbacks: FrequencyCallback[] = [];
  private progressCallbacks: ProgressCallback[] = [];
  private rafId: number | null = null;

  async init(): Promise<void> {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = this.volume;
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
  }

  async loadFile(file: File): Promise<void> {
    if (!this.audioContext) await this.init();
    if (this.source) {
      this.source.stop();
      this.source.disconnect();
      this.source = null;
    }
    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
    this.duration = this.audioBuffer.duration;
    this.pauseTime = 0;
    this.isPlaying = false;
  }

  play(): void {
    if (!this.audioContext || !this.audioBuffer) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    if (this.isPlaying) return;

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.connect(this.analyser!);
    this.analyser!.connect(this.gainNode!);
    this.gainNode!.connect(this.audioContext.destination);

    const offset = this.pauseTime;
    this.startTime = this.audioContext.currentTime - offset;
    this.source.start(0, offset);
    this.isPlaying = true;

    this.source.onended = () => {
      if (this.isPlaying && this.getCurrentTime() >= this.duration - 0.05) {
        this.isPlaying = false;
        this.pauseTime = 0;
        this.stopAnalyserLoop();
      }
    };

    this.startAnalyserLoop();
  }

  pause(): void {
    if (!this.isPlaying || !this.source) return;
    this.pauseTime = this.getCurrentTime();
    this.source.stop();
    this.source.disconnect();
    this.source = null;
    this.isPlaying = false;
    this.stopAnalyserLoop();
  }

  togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  getVolume(): number {
    return this.volume;
  }

  setProgress(time: number): void {
    if (!this.audioBuffer) return;
    const wasPlaying = this.isPlaying;
    if (this.source) {
      this.source.stop();
      this.source.disconnect();
      this.source = null;
    }
    this.pauseTime = Math.max(0, Math.min(this.duration, time));
    this.isPlaying = false;
    if (wasPlaying) {
      this.play();
    }
  }

  getCurrentTime(): number {
    if (!this.audioContext) return 0;
    if (this.isPlaying) {
      return this.audioContext.currentTime - this.startTime;
    }
    return this.pauseTime;
  }

  getDuration(): number {
    return this.duration;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getFrequencyData(): FrequencyData {
    if (!this.analyser || !this.frequencyData) {
      return { low: 0, mid: 0, high: 0 };
    }
    this.analyser.getByteFrequencyData(this.frequencyData);
    const binCount = this.frequencyData.length;
    const lowEnd = Math.floor(binCount * 0.1);
    const midEnd = Math.floor(binCount * 0.5);

    let lowSum = 0;
    for (let i = 0; i < lowEnd; i++) {
      lowSum += this.frequencyData[i];
    }
    let midSum = 0;
    for (let i = lowEnd; i < midEnd; i++) {
      midSum += this.frequencyData[i];
    }
    let highSum = 0;
    for (let i = midEnd; i < binCount; i++) {
      highSum += this.frequencyData[i];
    }

    return {
      low: (lowSum / lowEnd) / 255,
      mid: (midSum / (midEnd - lowEnd)) / 255,
      high: (highSum / (binCount - midEnd)) / 255
    };
  }

  onFrequency(callback: FrequencyCallback): void {
    this.freqCallbacks.push(callback);
  }

  onProgress(callback: ProgressCallback): void {
    this.progressCallbacks.push(callback);
  }

  private startAnalyserLoop(): void {
    const loop = () => {
      const freqData = this.getFrequencyData();
      this.freqCallbacks.forEach(cb => cb(freqData));
      const currentTime = this.getCurrentTime();
      this.progressCallbacks.forEach(cb => cb(currentTime, this.duration));
      if (this.isPlaying) {
        this.rafId = requestAnimationFrame(loop);
      }
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stopAnalyserLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  dispose(): void {
    this.stopAnalyserLoop();
    if (this.source) {
      try { this.source.stop(); } catch (e) {}
      this.source.disconnect();
    }
    if (this.analyser) this.analyser.disconnect();
    if (this.gainNode) this.gainNode.disconnect();
    if (this.audioContext) this.audioContext.close();
  }
}

export const audioManager = new AudioManager();
