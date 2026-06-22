export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface SoundWaveData {
  frequency: number;
  amplitude: number;
  waveform: WaveformType;
  time: number;
}

export class SoundWave {
  private frequency: number = 440;
  private amplitude: number = 0.5;
  private waveform: WaveformType = 'sine';
  private time: number = 0;

  constructor(frequency: number = 440, amplitude: number = 0.5, waveform: WaveformType = 'sine') {
    this.frequency = frequency;
    this.amplitude = amplitude;
    this.waveform = waveform;
  }

  setFrequency(freq: number): void {
    this.frequency = Math.max(20, Math.min(2000, freq));
  }

  getFrequency(): number {
    return this.frequency;
  }

  setAmp(amp: number): void {
    this.amplitude = Math.max(0, Math.min(1, amp));
  }

  getAmplitude(): number {
    return this.amplitude;
  }

  setWaveform(type: WaveformType): void {
    this.waveform = type;
  }

  getWaveform(): WaveformType {
    return this.waveform;
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
  }

  getValue(phase: number = 0): number {
    const t = 2 * Math.PI * this.frequency * this.time + phase;
    let value = 0;

    switch (this.waveform) {
      case 'sine':
        value = Math.sin(t);
        break;
      case 'square':
        value = Math.sin(t) >= 0 ? 1 : -1;
        break;
      case 'sawtooth':
        value = 2 * (t / (2 * Math.PI) - Math.floor(t / (2 * Math.PI) + 0.5));
        break;
      case 'triangle':
        value = 2 * Math.abs(2 * (t / (2 * Math.PI) - Math.floor(t / (2 * Math.PI) + 0.5))) - 1;
        break;
    }

    return this.amplitude * value;
  }

  getData(): SoundWaveData {
    return {
      frequency: this.frequency,
      amplitude: this.amplitude,
      waveform: this.waveform,
      time: this.time
    };
  }

  getWaveformColor(): string {
    switch (this.waveform) {
      case 'sine':
        return '#4FC3F7';
      case 'square':
        return '#F06292';
      case 'sawtooth':
        return '#BA68C8';
      case 'triangle':
        return '#AED581';
    }
  }

  getWaveformSymbol(): string {
    switch (this.waveform) {
      case 'sine':
        return '~';
      case 'square':
        return '□';
      case 'sawtooth':
        return '△';
      case 'triangle':
        return '▲';
    }
  }
}
