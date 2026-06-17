import type { NoiseType } from '@/types';

export interface AudioSpectrumData {
  averageFrequency: number;
  lowFrequency: number;
  midFrequency: number;
  highFrequency: number;
  spectrumArray: number[];
}

type NoiseGenerator = (sampleRate: number, duration: number) => Float32Array;

class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private noiseSources: Map<NoiseType, AudioBuffer> = new Map();
  private isInitialized = false;
  private currentNoiseType: NoiseType = 'white';

  private whiteNoise = (sampleRate: number, duration: number): Float32Array => {
    const length = sampleRate * duration;
    const buffer = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      buffer[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  private pinkNoise = (sampleRate: number, duration: number): Float32Array => {
    const length = sampleRate * duration;
    const buffer = new Float32Array(length);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      buffer[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  };

  private brownNoise = (sampleRate: number, duration: number): Float32Array => {
    const length = sampleRate * duration;
    const buffer = new Float32Array(length);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      buffer[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = buffer[i];
      buffer[i] *= 3.5;
    }
    return buffer;
  };

  private noiseGenerators: Record<NoiseType, NoiseGenerator> = {
    white: this.whiteNoise,
    pink: this.pinkNoise,
    brown: this.brownNoise,
  };

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      const sampleRate = this.audioContext.sampleRate;
      const duration = 2;

      for (const type of ['white', 'pink', 'brown'] as NoiseType[]) {
        const noiseData = this.noiseGenerators[type](sampleRate, duration);
        const audioBuffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        audioBuffer.getChannelData(0).set(noiseData);
        this.noiseSources.set(type, audioBuffer);
      }

      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext initialization failed, using fallback synthetic data');
      this.isInitialized = false;
    }
  }

  getSpectrumData(noiseType: NoiseType): AudioSpectrumData {
    this.currentNoiseType = noiseType;

    if (!this.isInitialized || !this.analyser) {
      return this.getSyntheticSpectrum(noiseType);
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    const spectrumArray = Array.from(dataArray).map(v => v / 255);

    const third = Math.floor(bufferLength / 3);
    const lowFrequency = this.average(spectrumArray, 0, third);
    const midFrequency = this.average(spectrumArray, third, third * 2);
    const highFrequency = this.average(spectrumArray, third * 2, bufferLength);
    const averageFrequency = this.average(spectrumArray, 0, bufferLength);

    return {
      averageFrequency,
      lowFrequency,
      midFrequency,
      highFrequency,
      spectrumArray,
    };
  }

  private getSyntheticSpectrum(noiseType: NoiseType): AudioSpectrumData {
    const spectrumArray: number[] = [];
    const bins = 128;

    for (let i = 0; i < bins; i++) {
      const t = i / bins;
      let value: number;

      switch (noiseType) {
        case 'white':
          value = 0.5 + (Math.random() - 0.5) * 0.6;
          break;
        case 'pink':
          value = (1 - t) * 0.7 + Math.random() * 0.3;
          value *= 1 + Math.sin(t * 8 + Math.random() * 2) * 0.2;
          break;
        case 'brown':
          value = Math.pow(1 - t, 1.5) * 0.8;
          value += Math.sin(t * 3) * 0.1;
          value = Math.max(0, Math.min(1, value));
          break;
      }
      spectrumArray.push(Math.max(0, Math.min(1, value)));
    }

    const third = Math.floor(bins / 3);
    return {
      averageFrequency: this.average(spectrumArray, 0, bins),
      lowFrequency: this.average(spectrumArray, 0, third),
      midFrequency: this.average(spectrumArray, third, third * 2),
      highFrequency: this.average(spectrumArray, third * 2, bins),
      spectrumArray,
    };
  }

  private average(arr: number[], start: number, end: number): number {
    if (end <= start) return 0;
    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += arr[i];
    }
    return sum / (end - start);
  }

  getNoiseProfile(noiseType: NoiseType): { centerBias: number; clusterStrength: number; smoothness: number } {
    switch (noiseType) {
      case 'white':
        return { centerBias: 0, clusterStrength: 0, smoothness: 0 };
      case 'pink':
        return { centerBias: 0.3, clusterStrength: 0.6, smoothness: 0.2 };
      case 'brown':
        return { centerBias: 0.5, clusterStrength: 0.3, smoothness: 0.9 };
    }
  }

  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.noiseSources.clear();
    this.isInitialized = false;
  }
}

export const audioEngine = new AudioEngine();
export default audioEngine;
