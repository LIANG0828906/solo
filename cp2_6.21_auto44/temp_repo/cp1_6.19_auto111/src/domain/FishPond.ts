import { Fish, FishSize, FISH_CONFIG, FishSpecies } from './Fish';
import { WeatherType } from '../events/WeatherSystem';

export interface PondEnvironment {
  oxygen: number;
  temperature: number;
  waterQuality: number;
  feedAmount: number;
}

const POND_WIDTH = 640;
const POND_HEIGHT = 480;
const TRAIL_MAX = 15;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class FishPond {
  fishes: Fish[] = [];
  environment: PondEnvironment = {
    oxygen: 85,
    temperature: 24,
    waterQuality: 90,
    feedAmount: 0,
  };
  readonly MAX_FISHES = 60;

  addFish(fish: Fish): boolean {
    if (this.fishes.length >= this.MAX_FISHES) {
      return false;
    }
    this.fishes.push(fish);
    return true;
  }

  removeFish(id: string): void {
    this.fishes = this.fishes.filter((f) => f.id !== id);
  }

  feed(amount: number = 1): void {
    this.environment.feedAmount += amount;
    this.environment.oxygen = clamp(this.environment.oxygen - 2, 0, 100);
    this.environment.waterQuality = clamp(this.environment.waterQuality - 3, 0, 100);
  }

  aerate(): void {
    this.environment.oxygen = clamp(this.environment.oxygen + 20, 0, 100);
  }

  changeWater(): void {
    this.environment.waterQuality = clamp(this.environment.waterQuality + 30, 0, 100);
    const targetTemp = 24;
    const diff = targetTemp - this.environment.temperature;
    if (Math.abs(diff) <= 5) {
      this.environment.temperature = targetTemp;
    } else {
      this.environment.temperature += diff > 0 ? 5 : -5;
    }
  }

  update(deltaTime: number, weather?: WeatherType): void {
    const aliveFishes = this.getAliveFishes();

    for (const fish of aliveFishes) {
      const config = FISH_CONFIG[fish.species];

      fish.growthProgress += config.growthRate * 5 * deltaTime;
      if (fish.growthProgress >= 100) {
        fish.growthProgress -= 100;
        if (fish.size === FishSize.Small) {
          fish.size = FishSize.Medium;
        } else if (fish.size === FishSize.Medium) {
          fish.size = FishSize.Large;
        } else {
          fish.growthProgress = 100;
        }
      }

      const tempOk =
        this.environment.temperature >= config.tempRange[0] &&
        this.environment.temperature <= config.tempRange[1];
      const oxygenOk = this.environment.oxygen > 70;
      const waterQualityOk = this.environment.waterQuality > 80;

      if (tempOk && oxygenOk && waterQualityOk) {
        fish.health = clamp(fish.health + 2 * deltaTime, 0, 100);
      } else {
        let damage = 5;
        if (!tempOk) damage += 3;
        if (!oxygenOk) damage += 4;
        if (!waterQualityOk) damage += 2;
        fish.health = clamp(fish.health - damage * deltaTime, 0, 100);
      }

      if (fish.health <= 0) {
        fish.isDead = true;
        continue;
      }

      let speedMultiplier = 1;
      if (weather === WeatherType.Rainstorm) {
        speedMultiplier = 1.5;
      } else if (weather === WeatherType.Heatwave) {
        speedMultiplier = 0.5;
      }

      if (weather === WeatherType.ColdWave) {
        const targetY = POND_HEIGHT - 40;
        fish.vy += (targetY - fish.y) * deltaTime;
      }

      fish.x += fish.vx * speedMultiplier * deltaTime;
      fish.y += fish.vy * speedMultiplier * deltaTime;

      const pixelSize = 3;
      if (fish.x < pixelSize) {
        fish.x = pixelSize;
        fish.vx = Math.abs(fish.vx);
      } else if (fish.x > POND_WIDTH - pixelSize) {
        fish.x = POND_WIDTH - pixelSize;
        fish.vx = -Math.abs(fish.vx);
      }
      if (fish.y < pixelSize) {
        fish.y = pixelSize;
        fish.vy = Math.abs(fish.vy);
      } else if (fish.y > POND_HEIGHT - pixelSize) {
        fish.y = POND_HEIGHT - pixelSize;
        fish.vy = -Math.abs(fish.vy);
      }

      fish.directionChangeTimer -= deltaTime;
      if (fish.directionChangeTimer <= 0) {
        fish.directionChangeTimer = 2 + Math.random();
        const currentSpeed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
        const angle = Math.random() * Math.PI * 2;
        fish.vx = Math.cos(angle) * currentSpeed;
        fish.vy = Math.sin(angle) * currentSpeed;
      }

      fish.trail.forEach((point) => {
        point.alpha *= 0.92;
      });
      fish.trail.push({ x: fish.x, y: fish.y, alpha: 1 });
      if (fish.trail.length > TRAIL_MAX) {
        fish.trail.shift();
      }
    }

    const baseConsumption = aliveFishes.length * 0.1;
    this.environment.oxygen = clamp(
      this.environment.oxygen - baseConsumption * deltaTime,
      0,
      100
    );
    this.environment.waterQuality = clamp(
      this.environment.waterQuality - aliveFishes.length * 0.05 * deltaTime,
      0,
      100
    );
    if (this.environment.feedAmount > 0) {
      this.environment.feedAmount = Math.max(
        0,
        this.environment.feedAmount - aliveFishes.length * 0.2 * deltaTime
      );
    }
  }

  getAliveFishes(): Fish[] {
    return this.fishes.filter((f) => !f.isDead);
  }
}
