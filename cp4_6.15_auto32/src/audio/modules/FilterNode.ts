import { ModuleId } from '../../types/ModuleTypes';

export class FilterAudioModule {
  private filter: BiquadFilterNode | null = null;
  private context: AudioContext;
  public moduleId: ModuleId;

  constructor(context: AudioContext, moduleId: ModuleId) {
    this.context = context;
    this.moduleId = moduleId;
  }

  create(params: Record<string, number | string>): void {
    this.filter = this.context.createBiquadFilter();
    this.filter.type = params.filterType as BiquadFilterType;
    this.filter.frequency.value = params.frequency as number;
    this.filter.Q.value = params.Q as number;
  }

  getAudioInputNode(): AudioNode | null {
    return this.filter;
  }

  getAudioOutputNode(): AudioNode | null {
    return this.filter;
  }

  getControlInputNode(portName: string): AudioParam | null {
    if (!this.filter) return null;
    if (portName === '频率') return this.filter.frequency;
    if (portName === 'Q值') return this.filter.Q;
    return null;
  }

  updateParam(key: string, value: number | string): void {
    if (!this.filter) return;
    switch (key) {
      case 'filterType':
        this.filter.type = value as BiquadFilterType;
        break;
      case 'frequency':
        this.filter.frequency.setValueAtTime(value as number, this.context.currentTime);
        break;
      case 'Q':
        this.filter.Q.setValueAtTime(value as number, this.context.currentTime);
        break;
    }
  }

  dispose(): void {
    if (this.filter) {
      this.filter.disconnect();
      this.filter = null;
    }
  }
}
