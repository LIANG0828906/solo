export type LightType = 'spot' | 'point' | 'directional';
export type HdrPreset = 'studio' | 'sunset' | 'forest' | 'night';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface BaseLight {
  id: string;
  type: LightType;
  color: string;
  intensity: number;
  position: Vec3;
}

export interface SpotLight extends BaseLight {
  type: 'spot';
  target: Vec3;
  angle: number;
}

export interface PointLight extends BaseLight {
  type: 'point';
  distance: number;
}

export interface DirectionalLight extends BaseLight {
  type: 'directional';
  direction: Vec3;
}

export type SceneLight = SpotLight | PointLight | DirectionalLight;

export interface EnvConfig {
  ambientIntensity: number;
  hdrPreset: HdrPreset;
  bloomEnabled: boolean;
  bloomIntensity: number;
}

export interface SceneState {
  lights: SceneLight[];
  env: EnvConfig;
}

type Listener = (state: SceneState) => void;

const DEFAULT_ENV: EnvConfig = {
  ambientIntensity: 0.5,
  hdrPreset: 'studio',
  bloomEnabled: false,
  bloomIntensity: 0.4,
};

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function createDefaultLight(type: LightType): SceneLight {
  const base = {
    id: generateId(),
    color: '#ffffff',
    intensity: 1.5,
    position: { x: 2, y: 3, z: 2 },
  };

  switch (type) {
    case 'spot':
      return {
        ...base,
        type: 'spot',
        target: { x: 0, y: 0, z: 0 },
        angle: 45,
      };
    case 'point':
      return {
        ...base,
        type: 'point',
        distance: 10,
      };
    case 'directional':
      return {
        ...base,
        type: 'directional',
        direction: { x: -1, y: -1, z: -1 },
        position: { x: 5, y: 5, z: 5 },
      };
  }
}

export class SceneController {
  private state: SceneState;
  private listeners: Set<Listener> = new Set();

  constructor(initialState?: Partial<SceneState>) {
    const defaultLight = createDefaultLight('directional');
    defaultLight.position = { x: 3, y: 5, z: 3 };
    defaultLight.intensity = 2;

    this.state = {
      lights: [defaultLight],
      env: { ...DEFAULT_ENV },
      ...initialState,
    };
  }

  getState(): SceneState {
    return this.state;
  }

  subscribe(callback: Listener): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.state));
  }

  addLight(type: LightType): SceneLight {
    const light = createDefaultLight(type);
    this.state = {
      ...this.state,
      lights: [...this.state.lights, light],
    };
    this.notify();
    return light;
  }

  updateLight(id: string, patch: Partial<SceneLight>): void {
    this.state = {
      ...this.state,
      lights: this.state.lights.map((l) =>
        l.id === id ? ({ ...l, ...patch } as SceneLight) : l,
      ),
    };
    this.notify();
  }

  removeLight(id: string): void {
    this.state = {
      ...this.state,
      lights: this.state.lights.filter((l) => l.id !== id),
    };
    this.notify();
  }

  updateEnv(patch: Partial<EnvConfig>): void {
    this.state = {
      ...this.state,
      env: { ...this.state.env, ...patch },
    };
    this.notify();
  }
}
