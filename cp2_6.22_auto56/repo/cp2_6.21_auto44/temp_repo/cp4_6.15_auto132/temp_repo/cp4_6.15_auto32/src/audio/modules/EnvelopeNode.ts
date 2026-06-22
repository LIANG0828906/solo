import { ModuleId } from '../../types/ModuleTypes';

export class EnvelopeAudioModule {
  private gainNode: GainNode | null = null;
  private context: AudioContext;
  public moduleId: ModuleId;
  private attack: number = 0.05;
  private decay: number = 0.2;
  private sustain: number = 0.5;
  private release: number = 0.3;

  constructor(context: AudioContext, moduleId: ModuleId) {
    this.context = context;
    this.moduleId = moduleId;
  }

  create(params: Record<string, number | string>): void {
    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = 0;
    this.attack = params.attack as number;
    this.decay = params.decay as number;
    this.sustain = params.sustain as number;
    this.release = params.release as number;
  }

  getControlOutputNode(): AudioNode | null {
    return this.gainNode;
  }

  trigger(): void {
    if (!this.gainNode) return;
    const now = this.context.currentTime;
    const gain = this.gainNode.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(0, now);
    gain.linearRampToValueAtTime(1, now + this.attack);
    gain.linearRampToValueAtTime(this.sustain, now + this.attack + this.decay);
  }

  releaseEnvelope(): void {
    if (!this.gainNode) return;
    const now = this.context.currentTime;
    const gain = this.gainNode.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(0, now + this.release);
  }

  updateParam(key: string, value: number | string): void {
    switch (key) {
      case 'attack':
        this.attack = value as number;
        break;
      case 'decay':
        this.decay = value as number;
        break;
      case 'sustain':
        this.sustain = value as number;
        break;
      case 'release':
        this.release = value as number;
        break;
    }
  }

  dispose(): void {
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
  }
}
