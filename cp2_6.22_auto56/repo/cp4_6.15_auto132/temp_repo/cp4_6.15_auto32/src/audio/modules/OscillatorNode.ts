import { ModuleId } from '../../types/ModuleTypes';

export class OscillatorAudioModule {
  private oscillator: OscillatorNode | null = null;
  private outputGain: GainNode | null = null;
  private context: AudioContext;
  public moduleId: ModuleId;

  constructor(context: AudioContext, moduleId: ModuleId) {
    this.context = context;
    this.moduleId = moduleId;
  }

  create(params: Record<string, number | string>): void {
    this.oscillator = this.context.createOscillator();
    this.outputGain = this.context.createGain();
    this.outputGain.gain.value = 0.3;

    this.oscillator.type = params.waveform as OscillatorType;
    this.oscillator.frequency.value = params.frequency as number;
    this.oscillator.detune.value = params.detune as number;

    this.oscillator.connect(this.outputGain);
    this.oscillator.start();
  }

  getAudioOutputNode(): AudioNode | null {
    return this.outputGain;
  }

  getControlInputNode(portName: string): AudioParam | null {
    if (!this.oscillator) return null;
    if (portName === '频率') return this.oscillator.frequency;
    return null;
  }

  updateParam(key: string, value: number | string): void {
    if (!this.oscillator) return;
    switch (key) {
      case 'waveform':
        this.oscillator.type = value as OscillatorType;
        break;
      case 'frequency':
        this.oscillator.frequency.setValueAtTime(value as number, this.context.currentTime);
        break;
      case 'detune':
        this.oscillator.detune.setValueAtTime(value as number, this.context.currentTime);
        break;
    }
  }

  dispose(): void {
    if (this.oscillator) {
      try { this.oscillator.stop(); } catch (_) { /* ignore */ }
      this.oscillator.disconnect();
      this.oscillator = null;
    }
    if (this.outputGain) {
      this.outputGain.disconnect();
      this.outputGain = null;
    }
  }
}
