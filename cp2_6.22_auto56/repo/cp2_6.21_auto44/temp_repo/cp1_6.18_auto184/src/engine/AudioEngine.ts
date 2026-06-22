import { useAudioStore } from '../store/audioStore';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private startTime = 0;
  private pauseTime = 0;
  private animationId: number | null = null;
  private isPlaying = false;
  private timeDataArray: Uint8Array | null = null;
  private freqDataArray: Uint8Array | null = null;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = useAudioStore.getState().volume;

    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    this.timeDataArray = new Uint8Array(this.analyser.fftSize);
    this.freqDataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  async loadFile(file: File): Promise<void> {
    if (!this.audioContext) {
      this.initAudioContext();
    }

    if (this.isPlaying) {
      this.stop();
    }

    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);

    useAudioStore.getState().setDuration(this.audioBuffer.duration);
    useAudioStore.getState().setCurrentTime(0);
    this.pauseTime = 0;
  }

  play(): void {
    if (!this.audioBuffer || !this.audioContext || !this.analyser) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.connect(this.analyser);
    this.source.onended = () => {
      if (this.isPlaying) {
        this.isPlaying = false;
        useAudioStore.getState().setPlaying(false);
        useAudioStore.getState().setCurrentTime(0);
        this.pauseTime = 0;
      }
    };

    this.startTime = this.audioContext.currentTime - this.pauseTime;
    this.source.start(0, this.pauseTime);
    this.isPlaying = true;
    useAudioStore.getState().setPlaying(true);

    this.startAnimationLoop();
  }

  pause(): void {
    if (!this.source || !this.audioContext || !this.isPlaying) return;

    this.source.stop();
    this.pauseTime = this.audioContext.currentTime - this.startTime;
    this.isPlaying = false;
    useAudioStore.getState().setPlaying(false);

    this.stopAnimationLoop();
  }

  stop(): void {
    if (this.source) {
      try {
        this.source.stop();
      } catch (e) {
        // ignore
      }
      this.source.disconnect();
      this.source = null;
    }
    this.isPlaying = false;
    this.pauseTime = 0;
    useAudioStore.getState().setPlaying(false);
    useAudioStore.getState().setCurrentTime(0);
    this.stopAnimationLoop();
  }

  seek(time: number): void {
    if (!this.audioBuffer) return;

    const wasPlaying = this.isPlaying;
    if (this.source) {
      try {
        this.source.stop();
      } catch (e) {
        // ignore
      }
      this.source.disconnect();
      this.source = null;
    }

    this.pauseTime = Math.max(0, Math.min(time, this.audioBuffer.duration));
    useAudioStore.getState().setCurrentTime(this.pauseTime);

    if (wasPlaying) {
      this.play();
    }
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
    useAudioStore.getState().setVolume(volume);
  }

  private startAnimationLoop(): void {
    const loop = () => {
      this.updateData();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  private stopAnimationLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private updateData(): void {
    if (!this.analyser || !this.timeDataArray || !this.freqDataArray || !this.audioContext) return;

    this.analyser.getByteTimeDomainData(this.timeDataArray);
    this.analyser.getByteFrequencyData(this.freqDataArray);

    const amplitudes = this.mapAmplitudes(this.timeDataArray, 360);
    const frequencies = this.mapFrequencies(this.freqDataArray, 64);

    useAudioStore.getState().setAmplitudes(amplitudes);
    useAudioStore.getState().setFrequencies(frequencies);

    const currentTime = this.audioContext.currentTime - this.startTime;
    if (currentTime >= 0 && currentTime <= (this.audioBuffer?.duration || 0)) {
      useAudioStore.getState().setCurrentTime(currentTime);
    }
  }

  private mapAmplitudes(timeData: Uint8Array, targetLength: number): Float32Array {
    const result = new Float32Array(targetLength);
    const sourceLength = timeData.length;

    for (let i = 0; i < targetLength; i++) {
      const sourceIndex = Math.floor((i / targetLength) * sourceLength);
      const value = timeData[sourceIndex];
      result[i] = Math.abs((value - 128) / 128);
    }

    return result;
  }

  private mapFrequencies(freqData: Uint8Array, targetLength: number): Float32Array {
    const result = new Float32Array(targetLength);
    const sourceLength = freqData.length;

    for (let i = 0; i < targetLength; i++) {
      const sourceIndex = Math.floor((i / targetLength) * sourceLength);
      result[i] = freqData[sourceIndex] / 255;
    }

    return result;
  }

  dispose(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

let audioEngineInstance: AudioEngine | null = null;

export const getAudioEngine = (): AudioEngine => {
  if (!audioEngineInstance) {
    audioEngineInstance = new AudioEngine();
  }
  return audioEngineInstance;
};
