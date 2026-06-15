export type BrushType = 'wolf' | 'goat' | 'mixed';

export interface BrushTipShape {
  widthFactor: number;
  heightFactor: number;
  roundness: number;
}

export interface BrushConfig {
  name: string;
  tipShape: BrushTipShape;
  inkColor: string;
  minSize: number;
  maxSize: number;
  baseInkAmount: number;
  bleedRate: number;
}

export const BRUSH_CONFIGS: Record<BrushType, BrushConfig> = {
  wolf: {
    name: '狼毫小楷',
    tipShape: { widthFactor: 0.6, heightFactor: 1.2, roundness: 0.3 },
    inkColor: '#1A1A1A',
    minSize: 2,
    maxSize: 12,
    baseInkAmount: 0.9,
    bleedRate: 2.0,
  },
  goat: {
    name: '羊毫中楷',
    tipShape: { widthFactor: 1.0, heightFactor: 1.0, roundness: 1.0 },
    inkColor: '#3A3A3A',
    minSize: 5,
    maxSize: 22,
    baseInkAmount: 0.7,
    bleedRate: 3.5,
  },
  mixed: {
    name: '兼毫大楷',
    tipShape: { widthFactor: 1.4, heightFactor: 0.7, roundness: 0.6 },
    inkColor: '#2A2A2A',
    minSize: 8,
    maxSize: 32,
    baseInkAmount: 0.8,
    bleedRate: 5.0,
  },
};

export interface StrokeState {
  pressure: number;
  velocity: number;
  lastX: number;
  lastY: number;
  lastTime: number;
  inkRemaining: number;
}

export class BrushModel {
  private type: BrushType;
  private config: BrushConfig;

  constructor(type: BrushType = 'wolf') {
    this.type = type;
    this.config = BRUSH_CONFIGS[type];
  }

  setType(type: BrushType): void {
    this.type = type;
    this.config = BRUSH_CONFIGS[type];
  }

  getType(): BrushType {
    return this.type;
  }

  getConfig(): BrushConfig {
    return this.config;
  }

  getInkColor(): string {
    return this.config.inkColor;
  }

  parseColor(hex: string): { r: number; g: number; b: number } {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  }

  calculateStrokeWidth(pressure: number): number {
    const { minSize, maxSize } = this.config;
    const p = Math.max(0, Math.min(1, pressure));
    return minSize + (maxSize - minSize) * p;
  }

  calculatePorosity(velocity: number): number {
    const minP = 0.05;
    const maxP = 0.15;
    const v = Math.min(1, velocity / 800);
    return minP + (maxP - minP) * v;
  }

  calculateBleedRadius(pressure: number, elapsedMs: number): number {
    const baseRate = this.config.bleedRate;
    const pressureFactor = 0.5 + pressure * 0.5;
    const rate = baseRate * pressureFactor;
    const t = elapsedMs / 1000;
    const radius = rate * (1 - Math.exp(-t * 2)) * 10;
    return Math.min(20, radius);
  }

  createStrokeState(startX: number, startY: number): StrokeState {
    return {
      pressure: 0.1,
      velocity: 0,
      lastX: startX,
      lastY: startY,
      lastTime: performance.now(),
      inkRemaining: this.config.baseInkAmount,
    };
  }

  updateStrokeState(
    state: StrokeState,
    x: number,
    y: number,
    pressureDelta: number
  ): { width: number; porosity: number; dx: number; dy: number } {
    const now = performance.now();
    const dt = Math.max(1, now - state.lastTime);
    const dx = x - state.lastX;
    const dy = y - state.lastY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    state.velocity = (dist / dt) * 1000;
    state.pressure = Math.max(0.05, Math.min(1, state.pressure + pressureDelta));
    state.inkRemaining = Math.max(0.3, state.inkRemaining - dist * 0.001);
    state.lastX = x;
    state.lastY = y;
    state.lastTime = now;

    return {
      width: this.calculateStrokeWidth(state.pressure),
      porosity: this.calculatePorosity(state.velocity),
      dx,
      dy,
    };
  }
}
