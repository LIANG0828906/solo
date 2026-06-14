import { ModuleId } from '../../types/ModuleTypes';

export class LFOAudioModule {
  private oscillator: OscillatorNode | null = null;
  private depthGain: GainNode | null = null;
  private context: AudioContext;
  public moduleId: ModuleId;

  constructor(context: AudioContext, moduleId: ModuleId) {
    this.context = context;
    this.moduleId = moduleId;
  }

  create(params: Record<string, number | string>): void {
    this.oscillator = this.context.createOscillator();
    this.depthGain = this.context.createGain();

    this.oscillator.type = params.waveform as OscillatorType;
    this.oscillator.frequency.value = params.frequency as number;
    this.depthGain.gain.value = params.depth as number;

    this.oscillator.connect(this.depthGain);
    this.oscillator.start();
  }

  getControlOutputNode(): AudioNode | null {
    return this.depthGain;
  }

  updateParam(key: string, value: number | string): void {
    if (!this.oscillator || !this.depthGain) return;
    switch (key) {
      case 'waveform':
        this.oscillator.type = value as OscillatorType;
        break;
      case 'frequency':
        this.oscillator.frequency.setValueAtTime(value as number, this.context.currentTime);
        break;
      case 'depth':
        this.depthGain.gain.setValueAtTime(value as number, this.context.currentTime);
        break;
    }
  }

  dispose(): void {
    if (this.oscillator) {
      try { this.oscillator.stop(); } catch (_) { /* ignore */ }
      this.oscillator.disconnect();
      this.oscillator = null;
    }
    if (this.depthGain) {
      this.depthGain.disconnect();
      this.depthGain = null;
    }
  }
}
