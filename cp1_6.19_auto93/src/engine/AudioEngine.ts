import { Howl } from 'howler';
import type { NoiseParams } from '../types';
import { staticSimulator } from '../services/StaticSimulator';

const FFT_SIZE = 64;

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private spectrumData: Uint8Array;
  private currentSound: Howl | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private signalGain: GainNode | null = null;
  private bandpassFilter: BiquadFilterNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private currentAudioUrl: string | null = null;
  private isInitialized: boolean = false;
  private onSpectrumUpdate: ((data: Uint8Array) => void) | null = null;
  private animationFrameId: number | null = null;

  constructor() {
    this.spectrumData = new Uint8Array(FFT_SIZE);
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.7;
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = FFT_SIZE * 2;
    this.noiseGain = this.audioContext.createGain();
    this.noiseGain.gain.value = 0;
    this.signalGain = this.audioContext.createGain();
    this.signalGain.gain.value = 1;
    this.bandpassFilter = this.audioContext.createBiquadFilter();
    this.bandpassFilter.type = 'bandpass';
    this.bandpassFilter.frequency.value = 5000;
    this.bandpassFilter.Q.value = 1;

    this.noiseBuffer = staticSimulator.generateNoiseBuffer(this.audioContext, 5);

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    this.noiseGain.connect(this.masterGain);
    this.bandpassFilter.connect(this.signalGain);
    this.signalGain.connect(this.masterGain);

    this.startNoiseLoop();
    this.startSpectrumAnalysis();

    this.isInitialized = true;
  }

  private startNoiseLoop(): void {
    if (!this.audioContext || !this.noiseBuffer || !this.noiseGain) return;

    const playNoise = () => {
      if (!this.audioContext || !this.noiseBuffer || !this.noiseGain) return;

      this.noiseSource = this.audioContext.createBufferSource();
      this.noiseSource.buffer = this.noiseBuffer;
      this.noiseSource.loop = true;
      this.noiseSource.connect(this.noiseGain);
      this.noiseSource.start();
    };

    playNoise();
  }

  private startSpectrumAnalysis(): void {
    const analyse = () => {
      if (this.analyser && this.onSpectrumUpdate) {
        this.analyser.getByteFrequencyData(this.spectrumData);
        this.onSpectrumUpdate(this.spectrumData);
      }
      this.animationFrameId = requestAnimationFrame(analyse);
    };
    analyse();
  }

  setOnSpectrumUpdate(callback: (data: Uint8Array) => void): void {
    this.onSpectrumUpdate = callback;
  }

  playChannel(audioUrl: string): void {
    if (this.currentAudioUrl === audioUrl && this.currentSound?.playing()) {
      return;
    }

    if (this.currentSound) {
      this.currentSound.stop();
      this.currentSound.unload();
      this.currentSound = null;
    }

    this.currentAudioUrl = audioUrl;
    this.currentSound = new Howl({
      src: [audioUrl],
      html5: true,
      loop: true,
      volume: 1,
      onplay: () => {
        if (this.audioContext && this.bandpassFilter && this.currentSound) {
          const soundNode = (this.currentSound as unknown as { _sounds: Array<{ _node: MediaElementAudioSourceNode }> })._sounds[0]?._node;
          if (soundNode) {
            try {
              soundNode.connect(this.bandpassFilter);
            } catch {
              console.warn('Could not connect audio node, using Howl volume control');
            }
          }
        }
      },
    });

    this.currentSound.play();
  }

  stopChannel(): void {
    if (this.currentSound) {
      this.currentSound.stop();
      this.currentSound.unload();
      this.currentSound = null;
      this.currentAudioUrl = null;
    }
  }

  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(clampedVolume, this.audioContext?.currentTime || 0, 0.05);
    }
    if (this.currentSound) {
      this.currentSound.volume(clampedVolume);
    }
  }

  setNoiseParams(params: NoiseParams): void {
    if (!this.noiseGain || !this.bandpassFilter || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    this.noiseGain.gain.setTargetAtTime(params.intensity, now, 0.05);
    this.bandpassFilter.frequency.setTargetAtTime(params.frequency, now, 0.1);
    this.bandpassFilter.Q.setTargetAtTime(params.filterQ, now, 0.1);
  }

  setSignalMix(signalStrength: number): void {
    if (!this.signalGain || !this.audioContext) return;

    const normalizedStrength = signalStrength / 100;
    const now = this.audioContext.currentTime;
    this.signalGain.gain.setTargetAtTime(normalizedStrength, now, 0.05);
  }

  getSpectrumData(): Uint8Array {
    return this.spectrumData;
  }

  isPlaying(): boolean {
    return this.currentSound?.playing() ?? false;
  }

  async resumeAudioContext(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.stopChannel();

    if (this.noiseSource) {
      this.noiseSource.stop();
      this.noiseSource.disconnect();
    }

    if (this.audioContext) {
      this.audioContext.close();
    }

    this.isInitialized = false;
    this.onSpectrumUpdate = null;
  }
}

export const audioEngine = new AudioEngine();
