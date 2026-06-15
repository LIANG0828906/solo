interface AudioEngineOptions {
  fftSize?: number;
  smoothingTimeConstant?: number;
  workerPath?: string;
}

export interface AudioData {
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
  private worker: Worker | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private audioData: AudioData | null = null;
  private isPlaying = false;
  private startTime = 0;
  private pauseTime = 0;
  private spectrumData: Float32Array = new Float32Array(64);
  private waveformData: Float32Array = new Float32Array(256);
  private animationFrameId: number | null = null;
  private lastUpdateTime = 0;
  private readonly maxLatency = 200;
  private readonly fftSize: number;
  private workerPath: string;
  private onDataCallback: ((spectrum: Float32Array, waveform: Float32Array) => void) | null = null;

  constructor(options: AudioEngineOptions = {}) {
    this.fftSize = options.fftSize || 2048;
    this.workerPath = options.workerPath || '';
  }

  async init(): Promise<void> {
    if (this.audioContext) return;

    this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1;
    this.gainNode.connect(this.audioContext.destination);

    if (this.workerPath) {
      this.worker = new Worker(this.workerPath, { type: 'module' });
    } else {
      this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    }
    this.worker.onmessage = this.handleWorkerMessage.bind(this);

    this.spectrumData = new Float32Array(64);
    this.waveformData = new Float32Array(256);
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
    const copyBuffer = arrayBuffer.slice(0);
    this.audioBuffer = await this.audioContext.decodeAudioData(copyBuffer);

    const numberOfChannels = this.audioBuffer.numberOfChannels;
    const sampleRate = this.audioBuffer.sampleRate;
    const length = this.audioBuffer.length;
    const duration = this.audioBuffer.duration;

    const leftRaw = this.audioBuffer.getChannelData(0);
    const leftChannel = new Float32Array(leftRaw.length);
    leftChannel.set(leftRaw);

    let rightChannel: Float32Array;
    if (numberOfChannels > 1) {
      const rightRaw = this.audioBuffer.getChannelData(1);
      rightChannel = new Float32Array(rightRaw.length);
      rightChannel.set(rightRaw);
    } else {
      rightChannel = new Float32Array(leftChannel);
    }

    this.audioData = {
      leftChannel,
      rightChannel,
      sampleRate,
      length,
      duration
    };

    this.pauseTime = 0;
  }

  play(): void {
    if (!this.audioContext || !this.audioBuffer || this.isPlaying) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.gainNode!);

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
    try {
      this.sourceNode.stop();
    } catch (_e) {
      // ignore
    }
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
    const loop = (_timestamp: number) => {
      if (!this.isPlaying || !this.worker || !this.audioData) {
        return;
      }

      const now = performance.now();
      const delta = now - this.lastUpdateTime;

      if (delta >= 16) {
        const currentTime = this.getCurrentTime();
        const sampleIndex = Math.floor(currentTime * this.audioData.sampleRate);
        const samplesToRead = this.fftSize;
        const startIndex = Math.max(0, Math.min(this.audioData.length - samplesToRead, sampleIndex - Math.floor(samplesToRead / 2)));

        const monoData = new Float32Array(samplesToRead);
        for (let i = 0; i < samplesToRead; i++) {
          const idx = startIndex + i;
          if (idx < this.audioData.leftChannel.length) {
            const l = this.audioData.leftChannel[idx] || 0;
            const r = this.audioData.rightChannel[idx] || 0;
            monoData[i] = (l + r) * 0.5;
          }
        }

        const latency = performance.now() - now;
        if (latency < this.maxLatency) {
          try {
            this.worker.postMessage({
              type: 'analyze',
              data: monoData,
              samples: 256
            });
          } catch (_e) {
            // ignore
          }
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
      } catch (_e) {
        // ignore
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
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
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.audioBuffer = null;
    this.audioData = null;
    this.isPlaying = false;
  }
}
