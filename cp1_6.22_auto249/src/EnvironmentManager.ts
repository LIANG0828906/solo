import { EnvironmentParams, EventHandler } from './types';
import { eventBus } from './EventBus';

export const DEFAULT_ENVIRONMENT: EnvironmentParams = {
  temperature: 25,
  humidity: 60,
  light: 1000,
};

export const ENVIRONMENT_LIMITS = {
  temperature: { min: -10, max: 50 },
  humidity: { min: 0, max: 100 },
  light: { min: 0, max: 2000 },
} as const;

export class EnvironmentManager {
  private params: EnvironmentParams;

  constructor(initialParams: Partial<EnvironmentParams> = {}) {
    this.params = { ...DEFAULT_ENVIRONMENT, ...initialParams };
  }

  getParams(): EnvironmentParams {
    return { ...this.params };
  }

  setParams(newParams: Partial<EnvironmentParams>): void {
    const { temperature, humidity, light } = ENVIRONMENT_LIMITS;

    if (newParams.temperature !== undefined) {
      newParams.temperature = Math.max(
        temperature.min,
        Math.min(temperature.max, newParams.temperature)
      );
    }
    if (newParams.humidity !== undefined) {
      newParams.humidity = Math.max(
        humidity.min,
        Math.min(humidity.max, newParams.humidity)
      );
    }
    if (newParams.light !== undefined) {
      newParams.light = Math.max(light.min, Math.min(light.max, newParams.light));
    }

    this.params = { ...this.params, ...newParams };
    eventBus.emit('env:change', this.getParams());
  }

  onEnvChange(handler: EventHandler<EnvironmentParams>): () => void {
    eventBus.on('env:change', handler);
    return () => eventBus.off('env:change', handler);
  }
}

export const environmentManager = new EnvironmentManager();
