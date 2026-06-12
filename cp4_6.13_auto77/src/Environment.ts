export interface EnvironmentParams {
  light: number;
  water: number;
  nutrients: number;
}

export type ParamName = keyof EnvironmentParams;

type ChangeCallback = (params: EnvironmentParams) => void;

export class EnvironmentManager {
  private params: EnvironmentParams;
  private callbacks: Set<ChangeCallback> = new Set();

  constructor(initialParams?: Partial<EnvironmentParams>) {
    this.params = {
      light: 50,
      water: 50,
      nutrients: 50,
      ...initialParams
    };
  }

  getParams(): EnvironmentParams {
    return { ...this.params };
  }

  getParam(name: ParamName): number {
    return this.params[name];
  }

  validateParam(name: ParamName, value: number): boolean {
    return value >= 0 && value <= 100;
  }

  setParam(name: ParamName, value: number): boolean {
    if (!this.validateParam(name, value)) {
      return false;
    }

    const clampedValue = Math.max(0, Math.min(100, value));
    if (this.params[name] === clampedValue) {
      return true;
    }

    this.params = {
      ...this.params,
      [name]: clampedValue
    };

    this.notifyCallbacks();
    return true;
  }

  setParams(params: Partial<EnvironmentParams>): void {
    let changed = false;
    const newParams = { ...this.params };

    for (const key of Object.keys(params) as ParamName[]) {
      const value = params[key];
      if (value !== undefined && this.validateParam(key, value)) {
        const clampedValue = Math.max(0, Math.min(100, value));
        if (newParams[key] !== clampedValue) {
          newParams[key] = clampedValue;
          changed = true;
        }
      }
    }

    if (changed) {
      this.params = newParams;
      this.notifyCallbacks();
    }
  }

  subscribe(callback: ChangeCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  private notifyCallbacks(): void {
    const params = { ...this.params };
    this.callbacks.forEach((cb) => {
      try {
        cb(params);
      } catch (e) {
        console.error('Environment callback error:', e);
      }
    });
  }

  calculateEnvironmentScore(): number {
    return (this.params.light + this.params.water + this.params.nutrients) / 3;
  }
}

export const defaultEnvironment = new EnvironmentManager({
  light: 60,
  water: 50,
  nutrients: 45
});
