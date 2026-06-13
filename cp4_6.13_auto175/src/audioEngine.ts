/* eslint-disable @typescript-eslint/no-explicit-any */
interface AudioEngineOptions {
  fftSize?: number;
  smoothingTimeConstant?: number;
  workerPath?: string;
}

interface AudioData {
  leftChannel: Float32Array;
  rightChannel: Float32Array;
  sampleRate: number;
  length: number;
  duration: number;
}

interface WorkerResult {
  type: string;
  spectrum: Float32Array;
  waveform: Float32Array;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private worker: Worker | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private audioData: AudioData | null = null;
  private isPlaying = false;
  private startTime = 0;
  private pauseTime = 0;
  private spectrumData: Float32Array = new Float32Array(1024);
  private waveformData: Float32Array = new Float32Array(2048);
  private animationFrameId: number | null = null;
  private lastUpdateTime = 0;
  private readonly maxLatency = 200;
  private fftSize: number;
  private smoothingTimeConstant: number;
  private workerPath: string;
  private onDataCallback: ((spectrum: Float32Array, waveform: Float32Array) => void) | null = null;

  constructor(options: AudioEngineOptions = {}) {
    this.fftSize = options.fftSize || 2048;
    this.smoothingTimeConstant = options.smoothingTimeConstant || 0.8;
    this.workerPath = options.workerPath || './worker.js';
  }

  async init(): Promise<void> {
    if (this.audioContext) return;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = this.fftSize;
    this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1;

    this.worker = new Worker(this.workerPath);
    this.worker.onmessage = this.handleWorkerMessage.bind(this);

    this.spectrumData = new Float32Array(this.fftSize / 2);
    this.waveformData = new Float32Array(this.fftSize);
  }

  private handleWorkerMessage(e: MessageEvent<WorkerResult>): void {
    const { type, spectrum, waveform } = e.data;
    if (type === 'result') {
      this.spectrumData = spectrum;
      this.waveformData = waveform;

      if (this.onDataCallback) {
        this.onDataCallback(spectrum, waveform);
      }
    }
  }

  async decodeFile(file: File): Promise<void> {
    if (!this.audioContext) {
      await this.init();
    }

    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    const numberOfChannels = this.audioBuffer.numberOfChannels;
    const sampleRate = this.audioBuffer.sampleRate;
    const length = this.audioBuffer.length;
    const duration = this.audioBuffer.duration;

    const leftChannel = this.audioBuffer.getChannelData(0);
    const rightChannel = numberOfChannels > 1
      ? this.audioBuffer.getChannelData(1)
      : new Float32Array(leftChannel);

    this.audioData = {
      leftChannel,
      rightChannel,
      sampleRate,
      length,
      duration
    };
  }

  play(): void {
    if (!this.audioContext || !this.audioBuffer || this.isPlaying) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.analyser!);
    this.analyser!.connect(this.gainNode!);
    this.gainNode!.connect(this.audioContext.destination);

    const offset = this.pauseTime;
    this.startTime = this.audioContext.currentTime - offset;
    this.sourceNode.start(0, offset);
    this.isPlaying = true;

    this.sourceNode.onended = () => {
      if (this.isPlaying) {
        this.isPlaying = false;
        this.pauseTime = 0;
      }
    };

    this.startAnalysisLoop();
  }

  pause(): void {
    if (!this.isPlaying || !this.sourceNode || !this.audioContext) return;

    this.pauseTime = this.audioContext.currentTime - this.startTime;
    this.sourceNode.stop();
    this.sourceNode.disconnect();
    this.sourceNode = null;
    this.isPlaying = false;

    this.stopAnalysisLoop();
  }

  togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  seek(time: number): void {
    if (!this.audioBuffer) return;

    const wasPlaying = this.isPlaying;
    const clampedTime = Math.max(0, Math.min(time, this.audioBuffer.duration));

    if (this.isPlaying) {
      this.pause();
    }

    this.pauseTime = clampedTime;

    if (wasPlaying) {
      this.play();
    }
  }

  getCurrentTime(): number {
    if (!this.audioContext || !this.isPlaying) {
      return this.pauseTime;
    }
    return this.audioContext.currentTime - this.startTime;
  }

  getDuration(): number {
    return this.audioBuffer?.duration || 0;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getFrequencyData(): Float32Array {
    return this.spectrumData;
  }

  getWaveformData(): Float32Array {
    return this.waveformData;
  }

  getAudioData(): AudioData | null {
    return this.audioData;
  }

  setOnDataCallback(callback: (spectrum: Float32Array, waveform: Float32Array) => void): void {
    this.onDataCallback = callback;
  }

  private startAnalysisLoop(): void {
    const loop = (timestamp: number) => {
      if (!this.isPlaying || !this.analyser || !this.worker || !this.audioData) {
        return;
      }

      const now = performance.now();
      const delta = now - this.lastUpdateTime;

      if (delta >= 16) {
        const currentTime = this.getCurrentTime();
        const sampleIndex = Math.floor(currentTime * this.audioData.sampleRate);
        const samplesToRead = this.fftSize;
        const startIndex = Math.max(0, sampleIndex - samplesToRead / 2);

        const monoData = new Float32Array(samplesToRead);
        for (let i = 0; i < samplesToRead; i++) {
          const idx = startIndex + i;
          if (idx < this.audioData.leftChannel.length) {
            monoData[i] = (this.audioData.leftChannel[idx] + this.audioData.rightChannel[idx]) / 2;
          } else {
            monoData[i] = 0;
          }
        }

        const latency = performance.now() - now;
        if (latency < this.maxLatency) {
          this.worker.postMessage({
            type: 'analyze',
            data: monoData,
            samples: 64
          });
        }

        this.lastUpdateTime = now;
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private stopAnalysisLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  destroy(): void {
    this.stopAnalysisLoop();

    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (e) {
        // ignore
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.audioBuffer = null;
    this.audioData = null;
    this.isPlaying = false;
  }
}
