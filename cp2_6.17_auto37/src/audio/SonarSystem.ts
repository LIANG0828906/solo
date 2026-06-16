import { useAudioStore, PulseType } from './audioStore';
import { useGameStore } from '../level/gameStore';

export class SonarSystem {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private initialized = false;
  private highFreqOscillators: OscillatorNode[] = [];
  private highFreqGain: GainNode | null = null;
  private highFreqActive = false;

  constructor() {}

  init(): void {
    if (this.initialized) return;
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = useAudioStore.getState().masterVolume;
      this.masterGain.connect(this.audioContext.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  resume(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  playPulse(type: PulseType): void {
    if (!this.initialized || !this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    switch (type) {
      case 'normal':
        this.playNormalPulse(ctx, now);
        break;
      case 'highFrequency':
        this.startHighFrequency(ctx, now);
        break;
      case 'echo':
        this.playEcho(ctx, now);
        break;
      case 'collect':
        this.playCollect(ctx, now);
        break;
      case 'exit':
        this.playExit(ctx, now);
        break;
      case 'gameover':
        this.playGameOver(ctx, now);
        break;
      case 'blind':
        this.playBlind(ctx, now);
        break;
    }
  }

  stopHighFrequency(): void {
    if (!this.highFreqActive) return;
    const ctx = this.audioContext;
    if (!ctx) return;
    const now = ctx.currentTime;

    if (this.highFreqGain) {
      this.highFreqGain.gain.cancelScheduledValues(now);
      this.highFreqGain.gain.setValueAtTime(this.highFreqGain.gain.value, now);
      this.highFreqGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    }

    setTimeout(() => {
      this.highFreqOscillators.forEach(osc => {
        try { osc.stop(); } catch (e) {}
      });
      this.highFreqOscillators = [];
      this.highFreqGain = null;
      this.highFreqActive = false;
    }, 150);
  }

  private playNormalPulse(ctx: AudioContext, now: number): void {
    const pulseGain = ctx.createGain();
    pulseGain.gain.setValueAtTime(0, now);
    pulseGain.gain.linearRampToValueAtTime(0.25, now + 0.01);
    pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    pulseGain.connect(this.masterGain!);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);
    osc.connect(pulseGain);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  private startHighFrequency(ctx: AudioContext, now: number): void {
    if (this.highFreqActive) return;
    this.highFreqActive = true;

    this.highFreqGain = ctx.createGain();
    this.highFreqGain.gain.setValueAtTime(0, now);
    this.highFreqGain.gain.linearRampToValueAtTime(0.18, now + 0.05);
    this.highFreqGain.connect(this.masterGain!);

    const freqs = [1800, 2200, 2600];
    freqs.forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 15;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 100;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.connect(this.highFreqGain!);
      osc.start(now);
      lfo.start(now);
      this.highFreqOscillators.push(osc, lfo);
    });
  }

  private playEcho(ctx: AudioContext, now: number): void {
    const echoGain = ctx.createGain();
    echoGain.gain.setValueAtTime(0, now);
    echoGain.gain.linearRampToValueAtTime(0.12, now + 0.02);
    echoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    echoGain.connect(this.masterGain!);

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.2);
    osc.connect(echoGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  private playCollect(ctx: AudioContext, now: number): void {
    const collectGain = ctx.createGain();
    collectGain.gain.setValueAtTime(0, now);
    collectGain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    collectGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    collectGain.connect(this.masterGain!);

    [660, 880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      osc.connect(collectGain);
      osc.start(now + i * 0.05);
      osc.stop(now + 0.35 + i * 0.05);
    });
  }

  private playExit(ctx: AudioContext, now: number): void {
    const exitGain = ctx.createGain();
    exitGain.gain.setValueAtTime(0, now);
    exitGain.gain.linearRampToValueAtTime(0.28, now + 0.1);
    exitGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    exitGain.connect(this.masterGain!);

    [440, 554, 659, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0, now + i * 0.1);
      oscGain.gain.linearRampToValueAtTime(0.3, now + i * 0.1 + 0.05);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      osc.connect(oscGain);
      oscGain.connect(exitGain);
      osc.start(now + i * 0.1);
      osc.stop(now + 1.1);
    });
  }

  private playGameOver(ctx: AudioContext, now: number): void {
    const goGain = ctx.createGain();
    goGain.gain.setValueAtTime(0, now);
    goGain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    goGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    goGain.connect(this.masterGain!);

    [440, 370, 294, 220].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.15);
      osc.connect(goGain);
      osc.start(now + i * 0.15);
      osc.stop(now + 1.3);
    });
  }

  private playBlind(ctx: AudioContext, now: number): void {
    const blindGain = ctx.createGain();
    blindGain.gain.setValueAtTime(0, now);
    blindGain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    blindGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    blindGain.connect(this.masterGain!);

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.4);
    osc.connect(blindGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  update(): void {
    const audioState = useAudioStore.getState();
    const gameState = useGameStore.getState();
    const now = performance.now();

    if (audioState.currentPulseType) {
      this.playPulse(audioState.currentPulseType);
      useAudioStore.getState().setCurrentPulseType(null);
    }

    if (gameState.highFrequencyActive) {
      if (!this.highFreqActive && now < gameState.highFrequencyEndTime) {
        this.playPulse('highFrequency');
      }
    } else {
      if (this.highFreqActive) {
        this.stopHighFrequency();
      }
    }
  }

  destroy(): void {
    this.stopHighFrequency();
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }
    this.initialized = false;
  }
}
