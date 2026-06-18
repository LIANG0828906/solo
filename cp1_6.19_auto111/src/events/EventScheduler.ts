import type { EventBus } from '../eventBus';
import type { FishSpecies } from '../domain/Fish';
import { WeatherSystem, WeatherType } from './WeatherSystem';

export enum GameSpeed {
  Normal = 1,
  Double = 2,
  Triple = 3,
}

export interface MarketAcquisitionEvent {
  species: FishSpecies;
  unitPrice: number;
  timestamp: number;
}

type PriceRange = { min: number; max: number };
type SizePriceRange = { small: PriceRange; medium: PriceRange; large: PriceRange };

const FISH_PRICE_TABLE: Record<FishSpecies, SizePriceRange> = {
  草鱼: {
    small: { min: 1, max: 3 },
    medium: { min: 4, max: 7 },
    large: { min: 8, max: 12 },
  },
  鲤鱼: {
    small: { min: 1, max: 3 },
    medium: { min: 4, max: 7 },
    large: { min: 8, max: 12 },
  },
  鲈鱼: {
    small: { min: 1, max: 3 },
    medium: { min: 4, max: 7 },
    large: { min: 8, max: 12 },
  },
  小龙虾: {
    small: { min: 1, max: 3 },
    medium: { min: 4, max: 7 },
    large: { min: 8, max: 12 },
  },
};

const ALL_SPECIES: FishSpecies[] = ['草鱼', '鲤鱼', '鲈鱼', '小龙虾'];
const ALL_SIZES: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
const MARKET_CYCLE_SECONDS = 45;

export class EventScheduler {
  public isPaused: boolean;
  public speed: GameSpeed;
  public gameTime: number;
  public weatherSystem: WeatherSystem;
  public marketTimer: number;
  public acquisitionHistory: MarketAcquisitionEvent[];

  private readonly eventBus: EventBus;

  constructor(eventBus: EventBus, weatherSystem: WeatherSystem) {
    this.eventBus = eventBus;
    this.isPaused = false;
    this.speed = GameSpeed.Normal;
    this.gameTime = 0;
    this.weatherSystem = weatherSystem;
    this.marketTimer = MARKET_CYCLE_SECONDS;
    this.acquisitionHistory = [];

    this.eventBus.on('game:togglePause', (data) => {
      const payload = data as { isPaused: boolean };
      this.setPaused(payload.isPaused);
    });

    this.eventBus.on('game:setSpeed', (data) => {
      const payload = data as { speed: GameSpeed };
      this.setSpeed(payload.speed);
    });
  }

  public update(deltaRealTime: number): void {
    if (this.isPaused) return;

    const scaledDelta = deltaRealTime * this.speed;
    this.gameTime += scaledDelta;
    this.weatherSystem.update(scaledDelta);

    this.marketTimer -= scaledDelta;
    if (this.marketTimer <= 0) {
      this.triggerMarketAcquisition();
      this.marketTimer = MARKET_CYCLE_SECONDS;
    }
  }

  public setPaused(p: boolean): void {
    this.isPaused = p;
  }

  public setSpeed(s: GameSpeed): void {
    this.speed = s;
  }

  public getElapsedTime(): string {
    const totalSeconds = Math.floor(this.gameTime);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const mm = minutes.toString().padStart(2, '0');
    const ss = seconds.toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }

  private triggerMarketAcquisition(): void {
    const species = ALL_SPECIES[Math.floor(Math.random() * ALL_SPECIES.length)];
    const size = ALL_SIZES[Math.floor(Math.random() * ALL_SIZES.length)];
    const priceRange = FISH_PRICE_TABLE[species][size];
    const unitPrice = this.randomBetween(priceRange.min, priceRange.max);
    const timestamp = Date.now();

    const event: MarketAcquisitionEvent = {
      species,
      unitPrice,
      timestamp,
    };

    this.acquisitionHistory.push(event);
    while (this.acquisitionHistory.length > 5) {
      this.acquisitionHistory.shift();
    }

    this.eventBus.emit('market:acquisitionStart', {
      species,
      unitPrice,
      size,
      priceRange,
      timestamp,
    });
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

export { WeatherType };
