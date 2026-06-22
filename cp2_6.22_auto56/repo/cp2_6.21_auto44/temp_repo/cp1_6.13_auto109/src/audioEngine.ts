export interface FrequencyBand {
  low: number;
  mid: number;
  high: number;
}

export interface AudioAnalysis {
  spectrum: Uint8Array;
  timeDomain: Float32Array;
  timeDomainLeft: Float32Array;
  timeDomainRight: Float32Array;
  bands: FrequencyBand;
}

export interface BeatEvent {
  time: number;
  strength: number;
  bpm: number;
}

export type AudioState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended';

const FFT_SIZE = 256;

type WorkerResult =
  | { type: 'bands'; bands: FrequencyBand }
  | { type: 'beat'; beat: BeatEvent };

type WorkerMessage =
  | { type: 'analyze'; spectrum: ArrayBuffer; timestamp: number }
  | { type: 'reset' };

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private analyserLeft: AnalyserNode | null = null;
  private analyserRight: AnalyserNode | null = null;
  private splitter: ChannelSplitterNode | null = null;
  private gainNode: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private worker: Worker | null = null;
  private state: AudioState = 'idle';
  private startTime = 0;
  private pausedAt = 0;
  private duration = 0;
  private songName = '';
  private onBeatCallback: ((beat: BeatEvent) => void) | null = null;
  private onBandsCallback: ((bands: FrequencyBand) => void) | null = null;
  private spectrumBuffer: Uint8Array;
  private timeDomainBuffer: Float32Array;
  private timeDomainLeftBuffer: Float32Array;
  private timeDomainRightBuffer: Float32Array;
  private currentBands: FrequencyBand = { low: 0, mid: 0, high: 0 };
  private currentBPM = 120;

  constructor() {
    this.spectrumBuffer = new Uint8Array(FFT_SIZE);
    this.timeDomainBuffer = new Float32Array(FFT_SIZE);
    this.timeDomainLeftBuffer = new Float32Array(FFT_SIZE);
    this.timeDomainRightBuffer = new Float32Array(FFT_SIZE);
    this.initWorker();
  }

  private initWorker(): void {
    this.worker = new Worker(
      new URL('./audioWorker.ts', import.meta.url),
      { type: 'module' }
    );

    this.worker.onmessage = (e: MessageEvent) => {
      const data = e.data as WorkerResult;
      if (data.type === 'bands') {
        this.currentBands = data.bands;
        if (this.onBandsCallback) {
          this.onBandsCallback(data.bands);
        }
      } else if (data.type === 'beat') {
        this.currentBPM = data.beat.bpm;
        if (this.onBeatCallback) {
          this.onBeatCallback(data.beat);
        }
      }
    };
  }

  async loadFile(file: File): Promise<void> {
    this.state = 'loading';
    this.songName = file.name;

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.duration = this.audioBuffer.duration;
    this.state = 'idle';
  }

  play(): void {
    if (!this.audioContext || !this.audioBuffer) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.stopSource();

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.audioBuffer;

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = FFT_SIZE;
    this.analyser.smoothingTimeConstant = 0.8;

    this.analyserLeft = this.audioContext.createAnalyser();
    this.analyserLeft.fftSize = FFT_SIZE;
    this.analyserLeft.smoothingTimeConstant = 0.8;

    this.analyserRight = this.audioContext.createAnalyser();
    this.analyserRight.fftSize = FFT_SIZE;
    this.analyserRight.smoothingTimeConstant = 0.8;

    this.splitter = this.audioContext.createChannelSplitter(2);
    this.gainNode = this.audioContext.createGain();

    this.source.connect(this.splitter);
    this.splitter.connect(this.analyserLeft, 0);
    this.splitter.connect(this.analyserRight, 1);
    this.splitter.connect(this.analyser, 0);
    this.splitter.connect(this.analyser, 1);

    this.source.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    const resetMsg: WorkerMessage = { type: 'reset' };
    this.worker?.postMessage(resetMsg);

    const offset = this.pausedAt;
    this.source.start(0, offset);
    this.startTime = this.audioContext.currentTime - offset;
    this.state = 'playing';

    this.source.onended = () => {
      if (this.state === 'playing') {
        this.state = 'ended';
        this.pausedAt = 0;
      }
    };
  }

  pause(): void {
    if (this.state !== 'playing' || !this.audioContext) return;
    this.pausedAt = this.getCurrentTime();
    this.stopSource();
    this.state = 'paused';
  }

  stop(): void {
    this.stopSource();
    this.pausedAt = 0;
    this.state = 'idle';
    const resetMsg: WorkerMessage = { type: 'reset' };
    this.worker?.postMessage(resetMsg);
    this.currentBands = { low: 0, mid: 0, high: 0 };
    this.currentBPM = 120;
  }

  private stopSource(): void {
    if (this.source) {
      try {
        this.source.stop();
        this.source.disconnect();
      } catch {
        // ignore
      }
      this.source = null;
    }
  }

  setVolume(value: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = value;
    }
  }

  getAnalysis(): AudioAnalysis | null {
    if (!this.analyser || !this.analyserLeft || !this.analyserRight) return null;

    this.analyser.getByteFrequencyData(this.spectrumBuffer);
    this.analyser.getFloatTimeDomainData(this.timeDomainBuffer);
    this.analyserLeft.getFloatTimeDomainData(this.timeDomainLeftBuffer);
    this.analyserRight.getFloatTimeDomainData(this.timeDomainRightBuffer);

    if (this.worker && this.state === 'playing') {
      const halfLen = FFT_SIZE / 2;
      const spectrumCopy = new Uint8Array(halfLen);
      for (let i = 0; i < halfLen; i++) {
        spectrumCopy[i] = this.spectrumBuffer[i];
      }
      const msg: WorkerMessage = {
        type: 'analyze',
        spectrum: spectrumCopy.buffer,
        timestamp: this.getCurrentTime() * 1000
      };
      this.worker.postMessage(msg, [spectrumCopy.buffer]);
    }

    return {
      spectrum: this.spectrumBuffer,
      timeDomain: this.timeDomainBuffer,
      timeDomainLeft: this.timeDomainLeftBuffer,
      timeDomainRight: this.timeDomainRightBuffer,
      bands: this.currentBands
    };
  }

  getCurrentTime(): number {
    if (!this.audioContext) return 0;
    if (this.state === 'playing') {
      return this.audioContext.currentTime - this.startTime;
    }
    return this.pausedAt;
  }

  getDuration(): number {
    return this.duration;
  }

  getState(): AudioState {
    return this.state;
  }

  getSongName(): string {
    return this.songName;
  }

  getBPM(): number {
    return this.currentBPM;
  }

  setOnBeatCallback(callback: (beat: BeatEvent) => void): void {
    this.onBeatCallback = callback;
  }

  setOnBandsCallback(callback: (bands: FrequencyBand) => void): void {
    this.onBandsCallback = callback;
  }

  destroy(): void {
    this.stop();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
