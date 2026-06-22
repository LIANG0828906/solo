import { WaveType, ParticleConfig } from './types';

export const PARTICLE_COUNT = 2000;
const TRANSITION_DURATION = 0.15;
const GRID_SIZE = Math.ceil(Math.sqrt(PARTICLE_COUNT));

type WaveFunction = (x: number) => number;

const waveFunctions: Record<WaveType, WaveFunction> = {
  [WaveType.SINE]: (x: number) => Math.sin(x),
  [WaveType.SQUARE]: (x: number) => Math.sign(Math.sin(x)),
  [WaveType.TRIANGLE]: (x: number) => Math.asin(Math.sin(x)),
  [WaveType.SAWTOOTH]: (x: number) => (2 * Math.asin(Math.sin(x))) / Math.PI,
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export class WaveParticleEngine {
  private positions: Float32Array;
  private targetPositions: Float32Array;
  private config: ParticleConfig;
  private time: number = 0;
  private transitionProgress: number = 1;
  private lastConfig: ParticleConfig;

  constructor(initialConfig: ParticleConfig) {
    this.positions = new Float32Array(PARTICLE_COUNT * 3);
    this.targetPositions = new Float32Array(PARTICLE_COUNT * 3);
    this.config = { ...initialConfig };
    this.lastConfig = { ...initialConfig };
    this.computeTargetPositions();
    this.positions.set(this.targetPositions);
  }

  setConfig(newConfig: ParticleConfig): void {
    const changed =
      newConfig.frequency !== this.config.frequency ||
      newConfig.amplitude !== this.config.amplitude ||
      newConfig.waveType !== this.config.waveType;

    if (changed) {
      this.lastConfig = { ...this.config };
      this.config = { ...newConfig };
      this.transitionProgress = 0;
      this.computeTargetPositions();
    }
  }

  private computeTargetPositions(): void {
    const { frequency, amplitude, waveType } = this.config;
    const waveFn = waveFunctions[waveType];
    const halfGrid = GRID_SIZE / 2;
    const scale = 4 / GRID_SIZE;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const gridX = (i % GRID_SIZE) - halfGrid;
      const gridZ = Math.floor(i / GRID_SIZE) - halfGrid;

      const x = gridX * scale;
      const z = gridZ * scale;

      const distance = Math.sqrt(x * x + z * z);
      const phase = distance * frequency * 0.5;
      const y = waveFn(phase) * amplitude;

      const idx = i * 3;
      this.targetPositions[idx] = x;
      this.targetPositions[idx + 1] = y;
      this.targetPositions[idx + 2] = z;
    }
  }

  update(deltaTime: number): Float32Array {
    this.time += deltaTime;

    if (this.transitionProgress < 1) {
      this.transitionProgress = Math.min(1, this.transitionProgress + deltaTime / TRANSITION_DURATION);
      const t = this.transitionProgress;
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const { frequency: freq1, amplitude: amp1, waveType: wt1 } = this.lastConfig;
      const { frequency: freq2, amplitude: amp2, waveType: wt2 } = this.config;
      const waveFn1 = waveFunctions[wt1];
      const waveFn2 = waveFunctions[wt2];
      const halfGrid = GRID_SIZE / 2;
      const scale = 4 / GRID_SIZE;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const gridX = (i % GRID_SIZE) - halfGrid;
        const gridZ = Math.floor(i / GRID_SIZE) - halfGrid;

        const x = gridX * scale;
        const z = gridZ * scale;

        const distance = Math.sqrt(x * x + z * z);
        const phase1 = distance * freq1 * 0.5;
        const phase2 = distance * freq2 * 0.5;
        const y1 = waveFn1(phase1) * amp1;
        const y2 = waveFn2(phase2) * amp2;

        const idx = i * 3;
        this.positions[idx] = x;
        this.positions[idx + 1] = lerp(y1, y2, easeT);
        this.positions[idx + 2] = z;
      }
    } else {
      const { frequency, amplitude, waveType } = this.config;
      const waveFn = waveFunctions[waveType];
      const halfGrid = GRID_SIZE / 2;
      const scale = 4 / GRID_SIZE;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const gridX = (i % GRID_SIZE) - halfGrid;
        const gridZ = Math.floor(i / GRID_SIZE) - halfGrid;

        const x = gridX * scale;
        const z = gridZ * scale;

        const distance = Math.sqrt(x * x + z * z);
        const phase = distance * frequency * 0.5 + this.time * 2;
        const y = waveFn(phase) * amplitude;

        const idx = i * 3;
        this.positions[idx] = x;
        this.positions[idx + 1] = y;
        this.positions[idx + 2] = z;
      }
    }

    return this.positions;
  }

  getPositions(): Float32Array {
    return this.positions;
  }
}
