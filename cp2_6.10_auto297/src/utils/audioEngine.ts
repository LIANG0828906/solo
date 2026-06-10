import type { InstrumentType } from '../types';
import { INSTRUMENT_CONFIGS } from '../types';

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;

  init(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  playNote(instrument: InstrumentType, frequency: number): void {
    if (!this.audioContext) return;

    const config = INSTRUMENT_CONFIGS[instrument];
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.3, now + config.envelope.attack);
    masterGain.gain.linearRampToValueAtTime(
      0.3 * config.envelope.sustain,
      now + config.envelope.attack + config.envelope.decay
    );
    masterGain.gain.linearRampToValueAtTime(
      0,
      now + config.envelope.attack + config.envelope.decay + config.envelope.release
    );

    if (instrument === 'drum') {
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(frequency * 3, now);
      filter.frequency.exponentialRampToValueAtTime(40, now + 0.1);

      noise.connect(filter);
      filter.connect(masterGain);
      noise.start(now);
      noise.stop(now + 0.3);
    } else if (instrument === 'guitar') {
      for (let i = 1; i <= config.harmonicCount; i++) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(frequency * i, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3 / i, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + config.envelope.release);

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(100, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + config.envelope.release);
      }
    } else {
      for (let i = 1; i <= config.harmonicCount; i++) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency * i, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5 / i, now);
        gain.gain.linearRampToValueAtTime(
          0,
          now + config.envelope.attack + config.envelope.decay + config.envelope.release
        );

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + config.envelope.release);
      }
    }

    masterGain.connect(ctx.destination);
  }
}

export const audioEngine = new AudioEngine();
