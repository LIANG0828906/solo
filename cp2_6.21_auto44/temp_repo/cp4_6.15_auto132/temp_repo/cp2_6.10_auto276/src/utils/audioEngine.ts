type SoundType = 'stream' | 'bird' | 'wind' | 'water_drop' | 'insect' | 'distant_bell';

type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface SoundConfig {
  minFrequency: number;
  maxFrequency: number;
  waveform: OscillatorType;
  volume: number;
  modulation: boolean;
  modulationFrequency?: number;
  modulationDepth?: number;
}

interface ActiveSound {
  id: string;
  type: SoundType;
  oscillator: OscillatorNode;
  gainNode: GainNode;
  modulator?: OscillatorNode;
  modulatorGain?: GainNode;
  startTime: number;
  sampleData: number[];
  animationFrameId: number;
}

interface SoundSample {
  id: string;
  type: SoundType;
  startTime: number;
  duration: number;
  peakVolume: number;
  averageFrequency: number;
}

type EventCallback = (...args: unknown[]) => void;

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  stream: {
    minFrequency: 200,
    maxFrequency: 800,
    waveform: 'triangle',
    volume: 0.15,
    modulation: true,
    modulationFrequency: 0.5,
    modulationDepth: 50,
  },
  bird: {
    minFrequency: 1500,
    maxFrequency: 4000,
    waveform: 'sine',
    volume: 0.2,
    modulation: true,
    modulationFrequency: 8,
    modulationDepth: 200,
  },
  wind: {
    minFrequency: 80,
    maxFrequency: 300,
    waveform: 'sawtooth',
    volume: 0.1,
    modulation: true,
    modulationFrequency: 0.3,
    modulationDepth: 30,
  },
  water_drop: {
    minFrequency: 600,
    maxFrequency: 1200,
    waveform: 'sine',
    volume: 0.25,
    modulation: false,
  },
  insect: {
    minFrequency: 3000,
    maxFrequency: 6000,
    waveform: 'square',
    volume: 0.08,
    modulation: true,
    modulationFrequency: 20,
    modulationDepth: 100,
  },
  distant_bell: {
    minFrequency: 300,
    maxFrequency: 500,
    waveform: 'sine',
    volume: 0.3,
    modulation: true,
    modulationFrequency: 2,
    modulationDepth: 5,
  },
};

class AudioEngine {
  private static instance: AudioEngine;
  private audioContext: AudioContext | null = null;
  private activeSounds: Map<string, ActiveSound> = new Map();
  private masterGain: GainNode | null = null;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private soundSamples: SoundSample[] = [];
  private isRecording: boolean = false;
  private resonanceTriggered: boolean = false;
  private readonly RESONANCE_THRESHOLD = 3;

  private constructor() {}

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  async init(): Promise<void> {
    if (this.audioContext) return;
    this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.audioContext.destination);
  }

  private ensureInitialized(): void {
    if (!this.audioContext || !this.masterGain) {
      throw new Error('AudioEngine not initialized. Call init() first.');
    }
  }

  private generateId(): string {
    return `sound_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getRandomFrequency(type: SoundType): number {
    const config = SOUND_CONFIGS[type];
    return config.minFrequency + Math.random() * (config.maxFrequency - config.minFrequency);
  }

  on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  emit(event: string, ...args: unknown[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(...args));
    }
  }

  private checkResonance(): void {
    const activeCount = this.activeSounds.size;
    if (activeCount >= this.RESONANCE_THRESHOLD && !this.resonanceTriggered) {
      this.resonanceTriggered = true;
      this.emit('resonance', { activeCount, sounds: Array.from(this.activeSounds.keys()) });
    } else if (activeCount < this.RESONANCE_THRESHOLD && this.resonanceTriggered) {
      this.resonanceTriggered = false;
    }
  }

  private recordSample(activeSound: ActiveSound): void {
    if (!this.audioContext) return;
    const currentTime = this.audioContext.currentTime;
    const currentGain = activeSound.gainNode.gain.value;
    activeSound.sampleData.push(currentGain);
    if (this.isRecording) {
      this.emit('sampleUpdate', {
        id: activeSound.id,
        type: activeSound.type,
        currentTime: currentTime - activeSound.startTime,
        volume: currentGain,
        samples: activeSound.sampleData,
      });
    }
  }

  async load(type: SoundType): Promise<string> {
    await this.init();
    this.ensureInitialized();
    const id = this.generateId();
    return id;
  }

  async play(type: SoundType, duration?: number): Promise<string> {
    await this.init();
    this.ensureInitialized();

    const ctx = this.audioContext!;
    const masterGain = this.masterGain!;
    const config = SOUND_CONFIGS[type];
    const id = this.generateId();
    const baseFrequency = this.getRandomFrequency(type);

    const oscillator = ctx.createOscillator();
    oscillator.type = config.waveform;
    oscillator.frequency.value = baseFrequency;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0;

    let modulator: OscillatorNode | undefined;
    let modulatorGain: GainNode | undefined;

    if (config.modulation && config.modulationFrequency && config.modulationDepth) {
      modulator = ctx.createOscillator();
      modulator.type = 'sine';
      modulator.frequency.value = config.modulationFrequency;

      modulatorGain = ctx.createGain();
      modulatorGain.gain.value = config.modulationDepth;

      modulator.connect(modulatorGain);
      modulatorGain.connect(oscillator.frequency);
    }

    oscillator.connect(gainNode);
    gainNode.connect(masterGain);

    const sampleData: number[] = [];

    const collectSample = (): void => {
      this.recordSample(activeSound);
      activeSound.animationFrameId = requestAnimationFrame(collectSample);
    };

    const activeSound: ActiveSound = {
      id,
      type,
      oscillator,
      gainNode,
      modulator,
      modulatorGain,
      startTime: ctx.currentTime,
      sampleData,
      animationFrameId: 0,
    };

    oscillator.start();
    if (modulator) {
      modulator.start();
    }

    gainNode.gain.linearRampToValueAtTime(config.volume, ctx.currentTime + 0.5);

    this.activeSounds.set(id, activeSound);
    activeSound.animationFrameId = requestAnimationFrame(collectSample);

    this.checkResonance();
    this.emit('play', { id, type });

    if (duration !== undefined) {
      setTimeout(() => {
        this.stop(id);
      }, duration * 1000);
    }

    return id;
  }

  stop(id: string): void {
    const activeSound = this.activeSounds.get(id);
    if (!activeSound || !this.audioContext) return;

    const ctx = this.audioContext;
    const { oscillator, gainNode, modulator, sampleData, type, startTime, animationFrameId } = activeSound;

    cancelAnimationFrame(animationFrameId);

    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

    const stopTime = ctx.currentTime + 0.35;
    oscillator.stop(stopTime);
    if (modulator) {
      modulator.stop(stopTime);
    }

    const duration = ctx.currentTime - startTime;
    const peakVolume = sampleData.length > 0 ? Math.max(...sampleData) : 0;
    const config = SOUND_CONFIGS[type];
    const averageFrequency = (config.minFrequency + config.maxFrequency) / 2;

    const soundSample: SoundSample = {
      id,
      type,
      startTime,
      duration,
      peakVolume,
      averageFrequency,
    };
    this.soundSamples.push(soundSample);

    setTimeout(() => {
      this.activeSounds.delete(id);
      this.checkResonance();
      this.emit('stop', { id, type, sample: soundSample });
    }, 400);
  }

  stopAll(): void {
    const ids = Array.from(this.activeSounds.keys());
    ids.forEach((id) => this.stop(id));
  }

  getActiveSounds(): string[] {
    return Array.from(this.activeSounds.keys());
  }

  getActiveSoundCount(): number {
    return this.activeSounds.size;
  }

  getSoundType(id: string): SoundType | undefined {
    return this.activeSounds.get(id)?.type;
  }

  startRecording(): void {
    this.isRecording = true;
    this.soundSamples = [];
    this.emit('recordingStart');
  }

  stopRecording(): SoundSample[] {
    this.isRecording = false;
    const samples = [...this.soundSamples];
    this.emit('recordingStop', { samples });
    return samples;
  }

  getSamples(): SoundSample[] {
    return [...this.soundSamples];
  }

  getSampleProgress(id: string): number | null {
    const activeSound = this.activeSounds.get(id);
    if (!activeSound || !this.audioContext) return null;
    return activeSound.sampleData.length;
  }

  getSampleData(id: string): number[] | null {
    const activeSound = this.activeSounds.get(id);
    if (!activeSound) return null;
    return [...activeSound.sampleData];
  }

  getMasterVolume(): number {
    return this.masterGain?.gain.value ?? 0;
  }

  setMasterVolume(value: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, value));
      this.emit('volumeChange', this.masterGain.gain.value);
    }
  }

  isInitialized(): boolean {
    return this.audioContext !== null;
  }

  async suspend(): Promise<void> {
    if (this.audioContext) {
      await this.audioContext.suspend();
      this.emit('suspend');
    }
  }

  async resume(): Promise<void> {
    if (this.audioContext) {
      await this.audioContext.resume();
      this.emit('resume');
    }
  }
}

export default AudioEngine.getInstance();
