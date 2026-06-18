import type { EventBus } from '../eventBus';

export enum WeatherType {
  Sunny = '晴天',
  Rainstorm = '暴雨',
  Heatwave = '高温',
  ColdWave = '寒潮',
}

export interface WeatherEvent {
  type: WeatherType;
  duration: number;
  startTime: number;
  effects: {
    tempDelta: number;
    oxygenDelta: number;
    qualityDelta: number;
  };
}

interface WeatherConfigEntry {
  duration: [number, number];
  initialEffects: {
    tempDelta: number;
    oxygenDelta: number;
    qualityDelta: number;
  };
  perSecondEffects: {
    tempDelta: number;
    oxygenDelta: number;
    qualityDelta: number;
  };
  speedMultiplier: number;
  description: string;
  gatherBottom?: boolean;
}

export const WEATHER_CONFIG: Record<WeatherType, WeatherConfigEntry> = {
  [WeatherType.Sunny]: {
    duration: [30, 60],
    initialEffects: { tempDelta: 0, oxygenDelta: 0, qualityDelta: 0 },
    perSecondEffects: { tempDelta: 0, oxygenDelta: 0, qualityDelta: 0 },
    speedMultiplier: 1.0,
    description: '阳光明媚，一切正常',
  },
  [WeatherType.Rainstorm]: {
    duration: [15, 15],
    initialEffects: { tempDelta: -3, oxygenDelta: 10, qualityDelta: -15 },
    perSecondEffects: { tempDelta: 0, oxygenDelta: 0, qualityDelta: -0.5 },
    speedMultiplier: 1.5,
    description: '暴雨倾盆，鱼群活跃但水质下降',
  },
  [WeatherType.Heatwave]: {
    duration: [20, 20],
    initialEffects: { tempDelta: 5, oxygenDelta: -20, qualityDelta: -10 },
    perSecondEffects: { tempDelta: 0.2, oxygenDelta: -0.8, qualityDelta: -0.3 },
    speedMultiplier: 0.5,
    description: '高温炙烤，氧气骤减，鱼群游动缓慢',
  },
  [WeatherType.ColdWave]: {
    duration: [25, 25],
    initialEffects: { tempDelta: -8, oxygenDelta: -15, qualityDelta: 0 },
    perSecondEffects: { tempDelta: -0.1, oxygenDelta: -0.5, qualityDelta: 0 },
    speedMultiplier: 0.7,
    description: '寒潮来袭，鱼群聚集水底',
    gatherBottom: true,
  },
};

export class WeatherSystem {
  public current: WeatherEvent | undefined;
  public nextTriggerTimer: number;
  public weatherHistory: WeatherEvent[];

  private readonly eventBus: EventBus;
  private elapsedInCurrent: number;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.nextTriggerTimer = this.randomBetween(30, 60);
    this.weatherHistory = [];
    this.elapsedInCurrent = 0;
    this.current = {
      type: WeatherType.Sunny,
      duration: this.randomDuration(WEATHER_CONFIG[WeatherType.Sunny].duration),
      startTime: 0,
      effects: { ...WEATHER_CONFIG[WeatherType.Sunny].initialEffects },
    };
  }

  public update(deltaTime: number): void {
    if (this.current) {
      this.elapsedInCurrent += deltaTime;

      const cfg = WEATHER_CONFIG[this.current.type];
      if (cfg.perSecondEffects.tempDelta !== 0 || cfg.perSecondEffects.oxygenDelta !== 0 || cfg.perSecondEffects.qualityDelta !== 0) {
        this.current.effects.tempDelta += cfg.perSecondEffects.tempDelta * deltaTime;
        this.current.effects.oxygenDelta += cfg.perSecondEffects.oxygenDelta * deltaTime;
        this.current.effects.qualityDelta += cfg.perSecondEffects.qualityDelta * deltaTime;
      }

      if (this.elapsedInCurrent >= this.current.duration) {
        this.endCurrentWeather();
      }
    } else {
      this.nextTriggerTimer -= deltaTime;
      if (this.nextTriggerTimer <= 0) {
        this.triggerRandom();
        this.nextTriggerTimer = this.randomBetween(30, 60);
      }
    }
  }

  public triggerRandom(): void {
    const nonSunnyTypes = [WeatherType.Rainstorm, WeatherType.Heatwave, WeatherType.ColdWave];
    const randomType = nonSunnyTypes[Math.floor(Math.random() * nonSunnyTypes.length)];
    this.startWeather(randomType);
  }

  public getSpeedMultiplier(): number {
    if (!this.current) return 1.0;
    return WEATHER_CONFIG[this.current.type].speedMultiplier;
  }

  public isGatherBottom(): boolean {
    if (!this.current) return false;
    return WEATHER_CONFIG[this.current.type].gatherBottom === true;
  }

  private startWeather(type: WeatherType): void {
    const cfg = WEATHER_CONFIG[type];
    const duration = this.randomDuration(cfg.duration);
    const event: WeatherEvent = {
      type,
      duration,
      startTime: Date.now(),
      effects: { ...cfg.initialEffects },
    };

    this.current = event;
    this.elapsedInCurrent = 0;
    this.weatherHistory.push(event);
    if (this.weatherHistory.length > 10) {
      this.weatherHistory.shift();
    }

    this.eventBus.emit('weather:changed', {
      type: event.type,
      duration: event.duration,
      effects: event.effects,
    });
  }

  private endCurrentWeather(): void {
    if (!this.current) return;

    const endedType = this.current.type;
    this.eventBus.emit('weather:ended', { type: endedType });
    this.current = undefined;
    this.elapsedInCurrent = 0;
    this.nextTriggerTimer = this.randomBetween(30, 60);
  }

  private randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private randomDuration(range: [number, number]): number {
    const [min, max] = range;
    if (min === max) return min;
    return this.randomBetween(min, max);
  }
}
