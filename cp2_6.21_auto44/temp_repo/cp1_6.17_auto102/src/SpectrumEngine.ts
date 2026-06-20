export interface BandParams {
  low: { frequency: number; intensity: number; phase: number };
  mid: { frequency: number; intensity: number; phase: number };
  high: { frequency: number; intensity: number; phase: number };
}

export interface WaveformData {
  points: number[];
  spectrum: number[];
  threatScore: number;
}

type EventCallback = (data: unknown) => void;

class EventBus {
  private listeners: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  emit(event: string, data: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
}

export const eventBus = new EventBus();

export enum EventType {
  WAVEFORM_UPDATED = 'waveform:updated',
  SECURITY_ALERT = 'security:alert',
  DEFENSE_BREACHED = 'defense:breached',
  PARAMS_CHANGED = 'params:changed',
  GAME_WON = 'game:won',
}

class SpectrumEngine {
  private params: BandParams;
  private time: number = 0;
  private readonly sampleCount: number = 256;
  private readonly spectrumBars: number = 48;

  constructor() {
    this.params = {
      low: { frequency: 5, intensity: 50, phase: 0 },
      mid: { frequency: 30, intensity: 50, phase: 0 },
      high: { frequency: 75, intensity: 50, phase: 0 },
    };
  }

  setParams(params: Partial<BandParams>): void {
    this.params = { ...this.params, ...params };
    eventBus.emit(EventType.PARAMS_CHANGED, this.params);
  }

  getParams(): BandParams {
    return { ...this.params };
  }

  generateWaveform(): WaveformData {
    this.time += 0.016;
    const points: number[] = [];
    const spectrum: number[] = new Array(this.spectrumBars).fill(0);

    for (let i = 0; i < this.sampleCount; i++) {
      const t = (i / this.sampleCount) * Math.PI * 2;
      let value = 0;

      value += this.generateBandWave(this.params.low, t);
      value += this.generateBandWave(this.params.mid, t);
      value += this.generateBandWave(this.params.high, t);

      points.push(value);
    }

    this.calculateSpectrum(points, spectrum);
    const threatScore = this.calculateThreatScore();

    const data: WaveformData = { points, spectrum, threatScore };
    eventBus.emit(EventType.WAVEFORM_UPDATED, data);

    return data;
  }

  private generateBandWave(
    band: { frequency: number; intensity: number; phase: number },
    t: number
  ): number {
    const phaseRad = (band.phase * Math.PI) / 180;
    return Math.sin(t * band.frequency + phaseRad + this.time) * (band.intensity / 100);
  }

  private calculateSpectrum(points: number[], spectrum: number[]): void {
    const n = points.length;
    for (let k = 0; k < this.spectrumBars; k++) {
      let real = 0;
      let imag = 0;
      for (let t = 0; t < n; t++) {
        const angle = (-2 * Math.PI * k * t) / n;
        real += points[t] * Math.cos(angle);
        imag += points[t] * Math.sin(angle);
      }
      spectrum[k] = Math.sqrt(real * real + imag * imag) / n;
    }

    const max = Math.max(...spectrum, 0.01);
    for (let i = 0; i < spectrum.length; i++) {
      spectrum[i] = spectrum[i] / max;
    }
  }

  private calculateThreatScore(): number {
    const { low, mid, high } = this.params;
    let score = 0;

    if (low.frequency >= 3 && low.frequency <= 7 && low.intensity > 30) {
      score += 30;
    }

    if (mid.frequency >= 20 && mid.frequency <= 40 && mid.intensity > 40) {
      score += 35;
    }

    if (high.intensity > 50 && mid.intensity > 50 && low.intensity > 50) {
      score += 35;
    }

    return Math.min(100, score);
  }

  resetEnergy(percentage: number): void {
    const factor = (100 - percentage) / 100;
    this.params.low.intensity *= factor;
    this.params.mid.intensity *= factor;
    this.params.high.intensity *= factor;
    eventBus.emit(EventType.PARAMS_CHANGED, this.params);
  }
}

export const spectrumEngine = new SpectrumEngine();
