export type AudioSource = 'mic' | 'file';

export interface AudioFrameData {
  frequencyData: Float32Array;
  timeDomainData: Float32Array;
  lowEnergy: number;
  midEnergy: number;
  highEnergy: number;
  totalEnergy: number;
  beatDetected: boolean;
  beatEnergy: number;
  isActive: boolean;
}

const FFT_SIZE = 512;
const BIN_COUNT = FFT_SIZE / 2;
const BEAT_HISTORY_SIZE = 43;
const BEAT_THRESHOLD = 1.35;

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private microphoneStream: MediaStream | null = null;
  private mediaSource: MediaStreamAudioSourceNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private audioSource: MediaElementAudioSourceNode | null = null;
  private currentSource: AudioSource | null = null;
  private running: boolean = false;
  private frameData: AudioFrameData;
  private energyHistory: number[] = [];
  private lastFrameTime: number = 0;
  private frameInterval: number = 1000 / 30;
  private listeners: ((data: AudioFrameData) => void)[] = [];
  private rafId: number | null = null;

  constructor() {
    this.frameData = {
      frequencyData: new Float32Array(BIN_COUNT),
      timeDomainData: new Float32Array(BIN_COUNT),
      lowEnergy: 0,
      midEnergy: 0,
      highEnergy: 0,
      totalEnergy: 0,
      beatDetected: false,
      beatEnergy: 0,
      isActive: false
    };
  }

  private async ensureContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = FFT_SIZE;
      this.analyser.smoothingTimeConstant = 0.8;
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0;
      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    return this.audioContext;
  }

  public async startMicrophone(): Promise<boolean> {
    try {
      this.stop();
      const ctx = await this.ensureContext();
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaSource = ctx.createMediaStreamSource(this.microphoneStream);
      this.mediaSource.connect(this.analyser!);
      this.currentSource = 'mic';
      this.running = true;
      this.startLoop();
      return true;
    } catch (err) {
      console.error('Microphone access denied:', err);
      return false;
    }
  }

  public async loadAudioFile(file: File): Promise<boolean> {
    try {
      this.stop();
      const ctx = await this.ensureContext();
      
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.remove();
      }
      
      this.audioElement = new Audio();
      this.audioElement.src = URL.createObjectURL(file);
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.loop = true;
      
      this.audioSource = ctx.createMediaElementSource(this.audioElement);
      this.audioSource.connect(this.analyser!);
      
      await this.audioElement.play();
      this.currentSource = 'file';
      this.running = true;
      this.startLoop();
      return true;
    } catch (err) {
      console.error('Audio file load failed:', err);
      return false;
    }
  }

  public stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(t => t.stop());
      this.microphoneStream = null;
    }
    if (this.mediaSource) {
      try { this.mediaSource.disconnect(); } catch {}
      this.mediaSource = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.remove();
      this.audioElement = null;
    }
    if (this.audioSource) {
      try { this.audioSource.disconnect(); } catch {}
      this.audioSource = null;
    }
    this.currentSource = null;
    this.energyHistory = [];
    this.frameData.isActive = false;
  }

  public onFrame(callback: (data: AudioFrameData) => void): void {
    this.listeners.push(callback);
  }

  public getCurrentSource(): AudioSource | null {
    return this.currentSource;
  }

  public isRunning(): boolean {
    return this.running;
  }

  private startLoop(): void {
    const loop = (time: number) => {
      if (!this.running || !this.analyser) return;
      
      if (time - this.lastFrameTime >= this.frameInterval) {
        this.analyseFrame();
        this.lastFrameTime = time;
        this.emitFrame();
      }
      
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private analyseFrame(): void {
    if (!this.analyser) return;

    const freqData = new Float32Array(BIN_COUNT);
    const timeData = new Float32Array(BIN_COUNT);
    this.analyser.getFloatFrequencyData(freqData);
    this.analyser.getFloatTimeDomainData(timeData);

    for (let i = 0; i < BIN_COUNT; i++) {
      const normalized = (freqData[i] + 100) / 100;
      freqData[i] = Math.max(0, Math.min(1, normalized));
    }

    const sampleRate = this.audioContext?.sampleRate || 44100;
    const binHz = sampleRate / FFT_SIZE;

    const lowStart = Math.floor(20 / binHz);
    const lowEnd = Math.floor(250 / binHz);
    const midStart = lowEnd;
    const midEnd = Math.floor(2000 / binHz);
    const highStart = midEnd;
    const highEnd = Math.min(BIN_COUNT - 1, Math.floor(20000 / binHz));

    let lowSum = 0, midSum = 0, highSum = 0;
    for (let i = lowStart; i < lowEnd; i++) lowSum += freqData[i];
    for (let i = midStart; i < midEnd; i++) midSum += freqData[i];
    for (let i = highStart; i < highEnd; i++) highSum += freqData[i];

    const lowCount = Math.max(1, lowEnd - lowStart);
    const midCount = Math.max(1, midEnd - midStart);
    const highCount = Math.max(1, highEnd - highStart);

    const lowEnergy = lowSum / lowCount;
    const midEnergy = midSum / midCount;
    const highEnergy = highSum / highCount;
    const totalEnergy = (lowEnergy + midEnergy + highEnergy) / 3;

    this.energyHistory.push(totalEnergy);
    if (this.energyHistory.length > BEAT_HISTORY_SIZE) {
      this.energyHistory.shift();
    }

    let beatDetected = false;
    let beatEnergy = 0;
    if (this.energyHistory.length >= BEAT_HISTORY_SIZE) {
      const avg = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;
      const variance = this.energyHistory.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / this.energyHistory.length;
      const threshold = avg * BEAT_THRESHOLD + Math.sqrt(variance) * 0.3;
      if (totalEnergy > threshold && lowEnergy > avg * 1.2) {
        beatDetected = true;
        beatEnergy = Math.min(1, totalEnergy / Math.max(0.3, threshold));
        this.energyHistory = [];
      }
    }

    this.frameData.frequencyData = freqData;
    this.frameData.timeDomainData = timeData;
    this.frameData.lowEnergy = lowEnergy;
    this.frameData.midEnergy = midEnergy;
    this.frameData.highEnergy = highEnergy;
    this.frameData.totalEnergy = totalEnergy;
    this.frameData.beatDetected = beatDetected;
    this.frameData.beatEnergy = beatEnergy;
    this.frameData.isActive = this.running;
  }

  private emitFrame(): void {
    for (const cb of this.listeners) {
      cb(this.frameData);
    }
  }

  public getBinCount(): number {
    return BIN_COUNT;
  }
}
