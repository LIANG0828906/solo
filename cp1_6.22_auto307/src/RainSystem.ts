import { CloudParams, RainDrop, CloudBounds, CloudStatus } from './types';

const GRAVITY = 9.8;
const MAX_RAIN_DROPS = 300;
const STOP_DURATION = 1;
const RAIN_START_HUMIDITY = 60;
const RAIN_START_TEMP = 20;
const RAIN_STOP_HUMIDITY = 50;
const RAIN_STOP_TEMP = 25;

export class RainSystem {
  private rainDrops: RainDrop[] = [];
  private params: CloudParams;
  private cloudBounds: CloudBounds | null = null;
  private emissionAccumulator = 0;
  private rainDropIdCounter = 0;
  private isRaining = false;
  private stopProgress = 1;
  private startProgress = 0;

  constructor(initialParams: CloudParams) {
    this.params = { ...initialParams };
  }

  setCloudBounds(bounds: CloudBounds): void {
    this.cloudBounds = bounds;
  }

  setParams(params: CloudParams): void {
    this.params = { ...params };

    const shouldRain = params.humidity > RAIN_START_HUMIDITY && params.temperature < RAIN_START_TEMP;
    const shouldStop = params.humidity < RAIN_STOP_HUMIDITY || params.temperature > RAIN_STOP_TEMP;

    if (shouldRain && !this.isRaining) {
      this.isRaining = true;
      this.startProgress = 0;
      this.stopProgress = 1;
    } else if (shouldStop && this.isRaining) {
      this.isRaining = false;
      this.stopProgress = 0;
    }
  }

  update(deltaTime: number): void {
    if (this.isRaining && this.startProgress < 1) {
      this.startProgress = Math.min(1, this.startProgress + deltaTime / STOP_DURATION);
    }
    if (!this.isRaining && this.stopProgress < 1) {
      this.stopProgress = Math.min(1, this.stopProgress + deltaTime / STOP_DURATION);
    }

    if (this.isRaining && this.cloudBounds) {
      const emissionRate = this.calculateEmissionRate();
      const activeEmissionRate = emissionRate * this.startProgress * (1 - this.stopProgress);
      this.emissionAccumulator += activeEmissionRate * deltaTime;

      while (this.emissionAccumulator >= 1 && this.rainDrops.length < MAX_RAIN_DROPS) {
        this.emitRainDrop();
        this.emissionAccumulator -= 1;
      }
    }

    this.rainDrops = this.rainDrops.filter((drop) => {
      drop.velocityY += GRAVITY * deltaTime;
      drop.y -= drop.velocityY * deltaTime;
      drop.x += drop.windOffsetX * deltaTime;
      drop.z += drop.windOffsetZ * deltaTime;
      return drop.y > 0;
    });
  }

  getRainDrops(): RainDrop[] {
    return this.rainDrops;
  }

  getRainProbability(): number {
    const humidityFactor = Math.max(0, (this.params.humidity - 50) / 40);
    const tempFactor = Math.max(0, (25 - this.params.temperature) / 35);
    const updraftFactor = Math.max(0, (this.params.updraft - 3) / 7);
    const probability = Math.min(100, humidityFactor * tempFactor * updraftFactor * 100);
    return Math.round(probability);
  }

  getStatus(): CloudStatus {
    if (this.isRaining || this.rainDrops.length > 0) {
      return 'raining';
    }
    if (this.params.humidity > 55) {
      return 'active';
    }
    return 'generating';
  }

  private emitRainDrop(): void {
    if (!this.cloudBounds) return;

    const x = this.cloudBounds.centerX + (Math.random() - 0.5) * (this.cloudBounds.maxX - this.cloudBounds.minX) * 0.6;
    const z = this.cloudBounds.centerZ + (Math.random() - 0.5) * (this.cloudBounds.maxZ - this.cloudBounds.minZ) * 0.6;
    const y = this.cloudBounds.minY + Math.random() * 0.5;

    this.rainDrops.push({
      id: this.rainDropIdCounter++,
      x,
      y,
      z,
      velocityY: 2 + Math.random() * 3,
      windOffsetX: (Math.random() - 0.5) * 0.5,
      windOffsetZ: (Math.random() - 0.5) * 0.5,
    });
  }

  private calculateEmissionRate(): number {
    const humidityFactor = (this.params.humidity / 100 - 0.6) * 10;
    const tempFactor = 1 - this.params.temperature / 30;
    return Math.min(50, Math.max(0, humidityFactor * tempFactor));
  }
}
