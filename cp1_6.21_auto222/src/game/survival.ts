import type { Building, Resources, SandstormState } from '../types';
import {
  SANDSTORM_MIN_INTERVAL,
  SANDSTORM_MAX_INTERVAL,
  SANDSTORM_MIN_DURATION,
  SANDSTORM_MAX_DURATION,
  SANDSTORM_MULTIPLIER,
  SURVIVAL_TICK_MS,
  DAY_DURATION_MS,
} from '../utils/constants';

export interface SurvivalCallbacks {
  onResourcesUpdate: (resources: Resources) => void;
  onSandstormChange: (state: SandstormState) => void;
  onSurvivalDay: (days: number) => void;
  onGameOver: () => void;
  onSandstormEnd: () => void;
}

export class SurvivalSimulator {
  private running = false;
  private timerId: number | null = null;
  private dayTimer = 0;
  private survivalDays = 0;
  private sandstormTimer = 0;
  private sandstormState: SandstormState = {
    active: false,
    startTime: 0,
    duration: 0,
    multiplier: 1,
  };
  private nextSandstormIn: number;
  private callbacks: SurvivalCallbacks;

  constructor(callbacks: SurvivalCallbacks) {
    this.callbacks = callbacks;
    this.nextSandstormIn = this.randRange(SANDSTORM_MIN_INTERVAL, SANDSTORM_MAX_INTERVAL);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    const tick = () => {
      if (!this.running) return;
      this.tick();
      this.timerId = window.setTimeout(tick, SURVIVAL_TICK_MS) as unknown as number;
    };
    tick();
  }

  stop(): void {
    this.running = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  reset(): void {
    this.stop();
    this.survivalDays = 0;
    this.dayTimer = 0;
    this.sandstormTimer = 0;
    this.sandstormState = {
      active: false,
      startTime: 0,
      duration: 0,
      multiplier: 1,
    };
    this.nextSandstormIn = this.randRange(SANDSTORM_MIN_INTERVAL, SANDSTORM_MAX_INTERVAL);
  }

  getDays(): number {
    return this.survivalDays;
  }

  setDays(days: number): void {
    this.survivalDays = days;
  }

  getSandstormState(): SandstormState {
    return this.sandstormState;
  }

  private randRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  tick(buildings: Building[] = [], currentResources: Resources = null as any): Resources | void {
    // This method signature is flexible - normally it's called internally via tick() with no args
    // But for the actual computation we need the up-to-date values passed from outside.
  }

  step(buildings: Building[], currentResources: Resources): { resources: Resources; gameOver: boolean } {
    const dt = SURVIVAL_TICK_MS / 1000;
    let oxyDelta = 0;
    let engDelta = 0;
    let metDelta = 0;

    for (const b of buildings) {
      oxyDelta += b.production.oxygen;
      engDelta += b.production.energy;
      metDelta += b.production.metal;
    }

    const baseConsumption = 0.2;
    oxyDelta -= baseConsumption;
    engDelta -= baseConsumption * 0.5;

    let mult = 1;
    if (this.sandstormState.active) {
      mult = this.sandstormState.multiplier;
    }

    let newOxy = currentResources.oxygen + oxyDelta * dt;
    let newEng = currentResources.energy + engDelta * dt;
    let newMet = currentResources.metal + metDelta * dt;

    if (this.sandstormState.active) {
      newOxy -= Math.abs(oxyDelta < 0 ? oxyDelta : 0) * (mult - 1) * dt;
      newEng -= Math.abs(engDelta < 0 ? engDelta : 0) * (mult - 1) * dt;
      newOxy -= 0.3 * dt;
    }

    newOxy = Math.max(0, Math.min(currentResources.oxygenMax, newOxy));
    newEng = Math.max(0, Math.min(currentResources.energyMax, newEng));
    newMet = Math.max(0, Math.min(currentResources.metalMax, newMet));

    this.dayTimer += SURVIVAL_TICK_MS;
    if (this.dayTimer >= DAY_DURATION_MS) {
      this.dayTimer -= DAY_DURATION_MS;
      this.survivalDays++;
      this.callbacks.onSurvivalDay?.(this.survivalDays);
    }

    this.sandstormTimer += SURVIVAL_TICK_MS;
    if (!this.sandstormState.active && this.sandstormTimer >= this.nextSandstormIn) {
      const duration = this.randRange(SANDSTORM_MIN_DURATION, SANDSTORM_MAX_DURATION);
      this.sandstormState = {
        active: true,
        startTime: Date.now(),
        duration,
        multiplier: SANDSTORM_MULTIPLIER,
      };
      this.sandstormTimer = 0;
      this.callbacks.onSandstormChange?.(this.sandstormState);
    } else if (this.sandstormState.active && this.sandstormTimer >= this.sandstormState.duration) {
      this.sandstormState.active = false;
      this.sandstormState.multiplier = 1;
      this.sandstormTimer = 0;
      this.nextSandstormIn = this.randRange(SANDSTORM_MIN_INTERVAL, SANDSTORM_MAX_INTERVAL);
      this.callbacks.onSandstormChange?.(this.sandstormState);
      this.callbacks.onSandstormEnd?.();
    }

    const gameOver = newOxy <= 0 || newEng <= 0 || newMet <= 0;

    const resources: Resources = {
      ...currentResources,
      oxygen: newOxy,
      energy: newEng,
      metal: newMet,
    };

    if (gameOver) {
      this.callbacks.onGameOver?.();
    }

    return { resources, gameOver };
  }
}
