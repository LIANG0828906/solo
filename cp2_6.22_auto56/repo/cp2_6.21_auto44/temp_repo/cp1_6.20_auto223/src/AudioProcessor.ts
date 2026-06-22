import type { SpectrumFrame } from './types';

const MAX_DURATION = 30;
const DEFAULT_FFT_SIZE = 512;
const HOP_SIZE = 256;

const LOW_FREQ_MAX = 500;
const MID_FREQ_MAX = 2000;

export class AudioProcessor {
  private audioContext: AudioContext | null = null;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext(): void {
    if (typeof window !== 'undefined' && !this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  async decodeAudioFile(file: File): Promise<AudioBuffer> {
    if (!this.audioContext) {
      this.initAudioContext();
    }
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    if (file.type !== 'audio/wav' && file.type !== 'audio/x-wav') {
      throw new Error('请上传WAV格式的音频文件');
    }

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    if (audioBuffer.duration > MAX_DURATION) {
      throw new Error(`音频时长不能超过${MAX_DURATION}秒`);
    }

    return audioBuffer;
  }

  async analyzeSpectrum(
    audioBuffer: AudioBuffer,
    fftSize: number = DEFAULT_FFT_SIZE
  ): Promise<SpectrumFrame[]> {
    if (!this.audioContext) {
      this.initAudioContext();
    }
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    const sampleRate = audioBuffer.sampleRate;
    const channelData = audioBuffer.getChannelData(0);

    const frames: SpectrumFrame[] = [];
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = 0;

    const frequencyBinCount = analyser.frequencyBinCount;
    const frequencyData = new Float32Array(frequencyBinCount);

    const totalSamples = channelData.length;
    const numFrames = Math.floor((totalSamples - fftSize) / HOP_SIZE) + 1;

    const windowFunction = this.createHannWindow(fftSize);

    for (let i = 0; i < numFrames; i++) {
      const startSample = i * HOP_SIZE;
      const endSample = Math.min(startSample + fftSize, totalSamples);

      const frameBuffer = new Float32Array(fftSize);
      for (let j = 0; j < fftSize; j++) {
        const sampleIndex = startSample + j;
        frameBuffer[j] = sampleIndex < endSample ? channelData[sampleIndex] * windowFunction[j] : 0;
      }

      this.performFFT(frameBuffer, frequencyData);

      const time = (startSample + fftSize / 2) / sampleRate;
      const energy = this.getBandEnergy(frequencyData, sampleRate);

      frames.push({
        time,
        frequencies: new Float32Array(frequencyData),
        energy
      });
    }

    return frames;
  }

  private createHannWindow(size: number): Float32Array {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
    }
    return window;
  }

  private performFFT(input: Float32Array, output: Float32Array): void {
    const n = input.length;
    const real = new Float32Array(n);
    const imag = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      real[i] = input[i];
      imag[i] = 0;
    }

    this.fftTransform(real, imag, false);

    for (let i = 0; i < n / 2; i++) {
      const magnitude = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]) / (n / 2);
      output[i] = magnitude;
    }
  }

  private fftTransform(real: Float32Array, imag: Float32Array, invert: boolean): void {
    const n = real.length;

    let j = 0;
    for (let i = 1; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) {
        j ^= bit;
      }
      j ^= bit;

      if (i < j) {
        [real[i], real[j]] = [real[j], real[i]];
        [imag[i], imag[j]] = [imag[j], imag[i]];
      }
    }

    for (let len = 2; len <= n; len <<= 1) {
      const halfLen = len >> 1;
      const angle = (invert ? 2 : -2) * Math.PI / len;
      const wLenReal = Math.cos(angle);
      const wLenImag = Math.sin(angle);

      for (let i = 0; i < n; i += len) {
        let wReal = 1;
        let wImag = 0;

        for (let j = 0; j < halfLen; j++) {
          const uReal = real[i + j];
          const uImag = imag[i + j];
          const vReal = real[i + j + halfLen] * wReal - imag[i + j + halfLen] * wImag;
          const vImag = real[i + j + halfLen] * wImag + imag[i + j + halfLen] * wReal;

          real[i + j] = uReal + vReal;
          imag[i + j] = uImag + vImag;
          real[i + j + halfLen] = uReal - vReal;
          imag[i + j + halfLen] = uImag - vImag;

          const nextWReal = wReal * wLenReal - wImag * wLenImag;
          wImag = wReal * wLenImag + wImag * wLenReal;
          wReal = nextWReal;
        }
      }
    }

    if (invert) {
      for (let i = 0; i < n; i++) {
        real[i] /= n;
        imag[i] /= n;
      }
    }
  }

  getBandEnergy(
    frequencies: Float32Array,
    sampleRate: number
  ): { low: number; mid: number; high: number } {
    const nyquist = sampleRate / 2;
    const binWidth = nyquist / frequencies.length;

    let lowEnergy = 0;
    let midEnergy = 0;
    let highEnergy = 0;
    let lowCount = 0;
    let midCount = 0;
    let highCount = 0;

    for (let i = 0; i < frequencies.length; i++) {
      const freq = i * binWidth;
      const magnitude = frequencies[i];

      if (freq <= LOW_FREQ_MAX) {
        lowEnergy += magnitude;
        lowCount++;
      } else if (freq <= MID_FREQ_MAX) {
        midEnergy += magnitude;
        midCount++;
      } else {
        highEnergy += magnitude;
        highCount++;
      }
    }

    return {
      low: lowCount > 0 ? lowEnergy / lowCount : 0,
      mid: midCount > 0 ? midEnergy / midCount : 0,
      high: highCount > 0 ? highEnergy / highCount : 0
    };
  }

  getWaveformData(audioBuffer: AudioBuffer, samples: number = 500): Float32Array {
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / samples);
    const waveform = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      let max = 0;
      const start = i * blockSize;
      const end = Math.min(start + blockSize, channelData.length);

      for (let j = start; j < end; j++) {
        const abs = Math.abs(channelData[j]);
        if (abs > max) max = abs;
      }

      waveform[i] = max;
    }

    return waveform;
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  async resumeContext(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
}
