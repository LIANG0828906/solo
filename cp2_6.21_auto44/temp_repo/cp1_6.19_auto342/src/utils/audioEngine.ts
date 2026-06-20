export type ToneType = 'piano' | 'synth' | 'xylophone';

interface ToneConfig {
  waveform: OscillatorType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterType?: BiquadFilterType;
  filterFrequency?: number;
  filterQ?: number;
  harmonicLevel?: number;
}

const toneConfigs: Record<ToneType, ToneConfig> = {
  piano: {
    waveform: 'sine',
    attack: 0.005,
    decay: 0.2,
    sustain: 0.3,
    release: 0.3,
    filterType: 'lowpass',
    filterFrequency: 5000,
    harmonicLevel: 0.3,
  },
  synth: {
    waveform: 'sawtooth',
    attack: 0.01,
    decay: 0.1,
    sustain: 0.5,
    release: 0.2,
    filterType: 'lowpass',
    filterFrequency: 3000,
    filterQ: 5,
  },
  xylophone: {
    waveform: 'triangle',
    attack: 0.001,
    decay: 0.15,
    sustain: 0.1,
    release: 0.1,
    filterType: 'highpass',
    filterFrequency: 1000,
  },
};

interface ActiveVoice {
  oscillator: OscillatorNode;
  harmonicOscillator?: OscillatorNode;
  gainNode: GainNode;
  harmonicGain?: GainNode;
  filter?: BiquadFilterNode;
}

class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeVoices: Map<string, ActiveVoice> = new Map();
  private currentTone: ToneType = 'piano';

  private ensureContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.6;
      this.masterGain.connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  setTone(tone: ToneType): void {
    this.currentTone = tone;
  }

  getTone(): ToneType {
    return this.currentTone;
  }

  playTone(frequency: number, velocity: number = 0.8, keyId: string): void {
    const ctx = this.ensureContext();
    const config = toneConfigs[this.currentTone];

    if (this.activeVoices.has(keyId)) {
      this.stopTone(keyId);
    }

    const gainNode = ctx.createGain();
    const oscillator = ctx.createOscillator();

    oscillator.type = config.waveform;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    let currentOutput: AudioNode = oscillator;
    let filter: BiquadFilterNode | undefined;

    if (config.filterType && config.filterFrequency) {
      filter = ctx.createBiquadFilter();
      filter.type = config.filterType;
      filter.frequency.setValueAtTime(config.filterFrequency, ctx.currentTime);
      if (config.filterQ) {
        filter.Q.setValueAtTime(config.filterQ, ctx.currentTime);
      }
      oscillator.connect(filter);
      currentOutput = filter;
    }

    currentOutput.connect(gainNode);
    gainNode.connect(this.masterGain!);

    const peakGain = velocity * 0.5;
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, ctx.currentTime + config.attack);
    gainNode.gain.linearRampToValueAtTime(
      peakGain * config.sustain,
      ctx.currentTime + config.attack + config.decay
    );

    let harmonicOscillator: OscillatorNode | undefined;
    let harmonicGain: GainNode | undefined;

    if (config.harmonicLevel && this.currentTone === 'piano') {
      harmonicOscillator = ctx.createOscillator();
      harmonicOscillator.type = 'sine';
      harmonicOscillator.frequency.setValueAtTime(frequency * 2, ctx.currentTime);

      harmonicGain = ctx.createGain();
      harmonicGain.gain.setValueAtTime(0, ctx.currentTime);
      harmonicGain.gain.linearRampToValueAtTime(
        peakGain * config.harmonicLevel,
        ctx.currentTime + config.attack
      );
      harmonicGain.gain.linearRampToValueAtTime(
        peakGain * config.harmonicLevel * config.sustain,
        ctx.currentTime + config.attack + config.decay
      );

      harmonicOscillator.connect(harmonicGain);
      harmonicGain.connect(this.masterGain!);
      harmonicOscillator.start(ctx.currentTime);
    }

    oscillator.start(ctx.currentTime);

    this.activeVoices.set(keyId, {
      oscillator,
      harmonicOscillator,
      gainNode,
      harmonicGain,
      filter,
    });
  }

  stopTone(keyId: string): void {
    const voice = this.activeVoices.get(keyId);
    if (!voice || !this.audioContext) return;

    const config = toneConfigs[this.currentTone];
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    try {
      voice.gainNode.gain.cancelScheduledValues(now);
      const currentGain = voice.gainNode.gain.value;
      voice.gainNode.gain.setValueAtTime(currentGain, now);
      voice.gainNode.gain.linearRampToValueAtTime(0, now + config.release);

      voice.oscillator.stop(now + config.release + 0.05);

      if (voice.harmonicOscillator && voice.harmonicGain) {
        voice.harmonicGain.gain.cancelScheduledValues(now);
        const currentHarmonicGain = voice.harmonicGain.gain.value;
        voice.harmonicGain.gain.setValueAtTime(currentHarmonicGain, now);
        voice.harmonicGain.gain.linearRampToValueAtTime(0, now + config.release);
        voice.harmonicOscillator.stop(now + config.release + 0.05);
      }
    } catch (e) {
      // ignore
    }

    this.activeVoices.delete(keyId);
  }

  stopAll(): void {
    for (const keyId of Array.from(this.activeVoices.keys())) {
      this.stopTone(keyId);
    }
  }

  getCurrentTime(): number {
    const ctx = this.ensureContext();
    return ctx.currentTime * 1000;
  }
}

export const audioEngine = new AudioEngine();
