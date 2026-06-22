import { SoundType, BeatSignal } from './types';

export class SoundEngine {
  private audioContext: AudioContext | null = null;
  private soundType: SoundType = 'click';
  private volume: number = 0.7;
  private masterGain: GainNode | null = null;

  constructor() {}

  private ensureContext(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioContext.destination);
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  setSoundType(type: SoundType): void {
    this.soundType = type;
  }

  getSoundType(): SoundType {
    return this.soundType;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  getVolume(): number {
    return this.volume;
  }

  playBeat(signal: BeatSignal): void {
    if (signal.beatType === 'mute') return;

    this.ensureContext();

    if (!this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;
    const intensity = signal.intensity;

    switch (this.soundType) {
      case 'click':
        this.playClick(now, intensity);
        break;
      case 'shake':
        this.playShake(now, intensity);
        break;
      case 'woodblock':
        this.playWoodblock(now, intensity);
        break;
    }
  }

  private playClick(time: number, intensity: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const highPass = this.audioContext.createBiquadFilter();

    highPass.type = 'highpass';
    highPass.frequency.value = 800;

    osc.type = 'square';
    osc.frequency.setValueAtTime(1500 + intensity * 500, time);
    osc.frequency.exponentialRampToValueAtTime(400, time + 0.08);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.5 * intensity, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(highPass);
    highPass.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  private playShake(time: number, intensity: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const bufferSize = this.audioContext.sampleRate * 0.15;
    const noiseBuffer = this.audioContext.createBuffer(
      1,
      bufferSize,
      this.audioContext.sampleRate
    );
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;

    const highPass = this.audioContext.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 2000 + intensity * 1000;
    highPass.Q.value = 0.5;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.4 * intensity, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    noise.connect(highPass);
    highPass.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.2);
  }

  private playWoodblock(time: number, intensity: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    const baseFreq = 800 + intensity * 400;

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, time);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, time + 0.1);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq * 1.5, time);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, time + 0.08);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.6 * intensity, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.15);
    osc2.stop(time + 0.15);
  }

  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
    }
  }
}
