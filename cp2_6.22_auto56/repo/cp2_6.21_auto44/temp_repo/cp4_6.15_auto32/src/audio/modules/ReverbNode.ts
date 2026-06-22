import { ModuleId } from '../../types/ModuleTypes';

export class ReverbAudioModule {
  private convolver: ConvolverNode | null = null;
  private wetGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private inputNode: GainNode | null = null;
  private outputNode: GainNode | null = null;
  private context: AudioContext;
  public moduleId: ModuleId;
  private currentDecay: number = 2;

  constructor(context: AudioContext, moduleId: ModuleId) {
    this.context = context;
    this.moduleId = moduleId;
  }

  create(params: Record<string, number | string>): void {
    this.currentDecay = params.decay as number;
    const wet = params.wet as number;

    this.inputNode = this.context.createGain();
    this.outputNode = this.context.createGain();
    this.convolver = this.context.createConvolver();
    this.wetGain = this.context.createGain();
    this.dryGain = this.context.createGain();

    this.convolver.buffer = this.generateImpulseResponse(this.currentDecay);
    this.wetGain.gain.value = wet;
    this.dryGain.gain.value = 1 - wet;

    this.inputNode.connect(this.dryGain);
    this.inputNode.connect(this.convolver);
    this.convolver.connect(this.wetGain);
    this.dryGain.connect(this.outputNode);
    this.wetGain.connect(this.outputNode);
  }

  private generateImpulseResponse(decay: number): AudioBuffer {
    const sampleRate = this.context.sampleRate;
    const length = sampleRate * Math.max(decay, 0.1);
    const buffer = this.context.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    return buffer;
  }

  getAudioInputNode(): AudioNode | null {
    return this.inputNode;
  }

  getAudioOutputNode(): AudioNode | null {
    return this.outputNode;
  }

  updateParam(key: string, value: number | string): void {
    if (!this.wetGain || !this.dryGain) return;
    switch (key) {
      case 'decay':
        this.currentDecay = value as number;
        if (this.convolver) {
          this.convolver.buffer = this.generateImpulseResponse(this.currentDecay);
        }
        break;
      case 'wet': {
        const w = value as number;
        this.wetGain.gain.setValueAtTime(w, this.context.currentTime);
        this.dryGain.gain.setValueAtTime(1 - w, this.context.currentTime);
        break;
      }
    }
  }

  dispose(): void {
    const nodes = [this.inputNode, this.convolver, this.wetGain, this.dryGain, this.outputNode];
    for (const node of nodes) {
      if (node) {
        node.disconnect();
      }
    }
    this.inputNode = null;
    this.convolver = null;
    this.wetGain = null;
    this.dryGain = null;
    this.outputNode = null;
  }
}
