import { clamp } from './utils';

class AudioManager {
  private static _instance: AudioManager | null = null;
  private _audioCtx: AudioContext | null = null;
  private _enabled: boolean = true;
  private _masterGain: GainNode | null = null;

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager._instance) {
      AudioManager._instance = new AudioManager();
    }
    return AudioManager._instance;
  }

  private _ensureCtx(): AudioContext {
    if (!this._audioCtx) {
      const CtxClass =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      this._audioCtx = new CtxClass();
      this._masterGain = this._audioCtx.createGain();
      this._masterGain.gain.value = 0.5;
      this._masterGain.connect(this._audioCtx.destination);
    }
    if (this._audioCtx.state === 'suspended') {
      this._audioCtx.resume();
    }
    return this._audioCtx;
  }

  public setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  public isEnabled(): boolean {
    return this._enabled;
  }

  private _playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType,
    volume: number = 0.3,
    attack: number = 0.005,
    release: number = 0.1
  ): void {
    if (!this._enabled) return;
    try {
      const ctx = this._ensureCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(freqStart, now);
      if (freqStart !== freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(
          clamp(freqEnd, 20, 20000),
          now + duration
        );
      }
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + attack);
      gain.gain.linearRampToValueAtTime(0, now + duration + release);
      osc.connect(gain);
      gain.connect(this._masterGain!);
      osc.start(now);
      osc.stop(now + duration + release + 0.05);
    } catch (e) {
      // 忽略音频错误
    }
  }

  public playSwap(): void {
    this._playTone(330, 523, 0.08, 'sine', 0.25, 0.005, 0.05);
  }

  public playInvalidSwap(): void {
    this._playTone(220, 165, 0.12, 'triangle', 0.2, 0.005, 0.08);
  }

  public playMatch(): void {
    const ctx = this._audioCtx;
    if (!this._enabled) return;
    try {
      this._ensureCtx();
      this._playTone(1046, 1318, 0.08, 'sine', 0.28, 0.005, 0.1);
      setTimeout(() => this._playTone(1318, 1568, 0.09, 'sine', 0.22, 0.005, 0.12), 40);
    } catch (e) {}
  }

  public playChain(level: number): void {
    if (!this._enabled) return;
    const baseFreq = 523;
    const freq = baseFreq * Math.pow(1.15, clamp(level, 0, 4));
    const duration = 0.18;
    try {
      this._ensureCtx();
      this._playTone(freq, freq * 1.5, duration, 'sine', 0.32, 0.01, 0.18);
      setTimeout(() => {
        this._playTone(freq * 1.25, freq * 1.8, duration * 0.8, 'triangle', 0.2, 0.005, 0.15);
      }, 30);
    } catch (e) {}
  }

  public playGameOver(): void {
    if (!this._enabled) return;
    try {
      this._ensureCtx();
      this._playTone(392, 196, 0.5, 'sawtooth', 0.22, 0.02, 0.4);
      setTimeout(() => this._playTone(261, 130, 0.6, 'sine', 0.25, 0.02, 0.5), 80);
    } catch (e) {}
  }

  public playStart(): void {
    if (!this._enabled) return;
    try {
      this._ensureCtx();
      this._playTone(392, 523, 0.1, 'sine', 0.25, 0.005, 0.1);
      setTimeout(() => this._playTone(523, 784, 0.12, 'sine', 0.28, 0.005, 0.12), 60);
    } catch (e) {}
  }
}

export default AudioManager;
