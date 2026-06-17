import { eventBus } from '../EcosystemModule/EcosystemService';
import useAppStore from '../AppStore';

export type GlitchType = 'pixelShift' | 'noiseOverlay' | 'dataLoss';

export interface GlitchEffect {
  id: string;
  type: GlitchType;
  startTime: number;
  duration: number;
  params: Record<string, any>;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;

export class GlitchEngine {
  private activeGlitches: GlitchEffect[] = [];
  private timerId: number | null = null;
  private frequency: number = 50;
  private isRepairActive: boolean = false;
  private repairStartTime: number = 0;
  private scanlineActive: boolean = false;
  private scanlineStartTime: number = 0;

  constructor() {
    this.updateFrequency(useAppStore.getState().frequency);
    useAppStore.subscribe((state) => {
      this.updateFrequency(state.frequency);
    });
  }

  start(): void {
    this.scheduleNextGlitch();
  }

  stop(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private updateFrequency(frequency: number): void {
    this.frequency = frequency;
  }

  private getTriggerInterval(): number {
    const minInterval = 2000;
    const maxInterval = 30000;
    const interval = maxInterval - (this.frequency / 100) * (maxInterval - minInterval);
    return interval + Math.random() * (interval * 0.3);
  }

  private scheduleNextGlitch(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
    }
    const interval = this.getTriggerInterval();
    this.timerId = window.setTimeout(() => {
      this.triggerRandomGlitch();
      this.scheduleNextGlitch();
    }, interval);
  }

  private triggerRandomGlitch(): void {
    const types: GlitchType[] = ['pixelShift', 'noiseOverlay', 'dataLoss'];
    const type = types[Math.floor(Math.random() * types.length)];
    const glitch = this.createGlitch(type);
    this.activeGlitches.push(glitch);
    useAppStore.getState().incrementGlitch();
    eventBus.emit('glitch', glitch);
  }

  private createGlitch(type: GlitchType): GlitchEffect {
    const baseId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = performance.now();

    switch (type) {
      case 'pixelShift':
        return {
          id: baseId,
          type: 'pixelShift',
          startTime: now,
          duration: 800,
          params: {
            x: Math.random() * (CANVAS_WIDTH - 60),
            y: Math.random() * (CANVAS_HEIGHT - 40),
            width: 60,
            height: 40,
            shiftX: 2 + Math.random() * 2,
            channelOffset: 1 + Math.random(),
          },
        };

      case 'noiseOverlay':
        const noiseCount = 20 + Math.floor(Math.random() * 21);
        const noises = [];
        const colors = ['#FF00FF', '#00FFFF', '#FFFF00'];
        for (let i = 0; i < noiseCount; i++) {
          noises.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            size: 2 + Math.random() * 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            blinkOffset: Math.random() * 0.05,
          });
        }
        return {
          id: baseId,
          type: 'noiseOverlay',
          startTime: now,
          duration: 1500,
          params: { noises },
        };

      case 'dataLoss':
        return {
          id: baseId,
          type: 'dataLoss',
          startTime: now,
          duration: 500,
          params: {
            x: Math.random() * (CANVAS_WIDTH - 40),
            y: Math.random() * (CANVAS_HEIGHT - 40),
            width: 40,
            height: 40,
          },
        };

      default:
        return this.createGlitch('noiseOverlay');
    }
  }

  triggerRepair(): void {
    this.isRepairActive = true;
    this.repairStartTime = performance.now();
    this.scanlineActive = true;
    this.scanlineStartTime = performance.now();
    useAppStore.getState().incrementRepair();
    eventBus.emit('repair', { startTime: this.repairStartTime });

    setTimeout(() => {
      this.isRepairActive = false;
    }, 1000);

    setTimeout(() => {
      this.scanlineActive = false;
    }, 1000);
  }

  getActiveGlitches(currentTime: number): GlitchEffect[] {
    const speedMultiplier = this.isRepairActive ? 2 : 1;

    this.activeGlitches = this.activeGlitches.filter((glitch) => {
      const elapsed = (currentTime - glitch.startTime) * speedMultiplier;
      return elapsed < glitch.duration;
    });

    return this.activeGlitches;
  }

  isScanlineActive(currentTime: number): boolean {
    if (!this.scanlineActive) return false;
    const elapsed = currentTime - this.scanlineStartTime;
    return elapsed < 1000;
  }

  getScanlineY(currentTime: number): number {
    if (!this.scanlineActive) return -1;
    const elapsed = currentTime - this.scanlineStartTime;
    const progress = Math.min(1, elapsed / 1000);
    return progress * CANVAS_HEIGHT;
  }

  getFrequency(): number {
    return this.frequency;
  }

  clearAllGlitches(): void {
    this.activeGlitches = [];
  }
}

export const glitchEngine = new GlitchEngine();
