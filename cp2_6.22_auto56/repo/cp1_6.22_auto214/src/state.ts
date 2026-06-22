export type StateKey = 'colorSpeed' | 'flowSpeed' | 'brightness';

export type StateCallback = (value: number) => void;

export interface AppStateData {
  colorSpeed: number;
  flowSpeed: number;
  brightness: number;
}

class AppState {
  private static instance: AppState | null = null;

  private data: AppStateData;

  private subscribers: Map<StateKey, Set<StateCallback>>;

  private constructor() {
    this.data = {
      colorSpeed: 1.0,
      flowSpeed: 1.0,
      brightness: 0.8
    };
    this.subscribers = new Map();
    this.subscribers.set('colorSpeed', new Set());
    this.subscribers.set('flowSpeed', new Set());
    this.subscribers.set('brightness', new Set());
  }

  public static getInstance(): AppState {
    if (!AppState.instance) {
      AppState.instance = new AppState();
    }
    return AppState.instance;
  }

  public get<K extends StateKey>(key: K): AppStateData[K] {
    return this.data[key];
  }

  public set<K extends StateKey>(key: K, value: AppStateData[K]): void {
    if (this.data[key] !== value) {
      this.data[key] = value;
      this.notify(key, value);
    }
  }

  public subscribe(key: StateKey, callback: StateCallback): () => void {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.add(callback);
    }
    return () => {
      const cbs = this.subscribers.get(key);
      if (cbs) {
        cbs.delete(callback);
      }
    };
  }

  private notify<K extends StateKey>(key: K, value: AppStateData[K]): void {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach((cb) => cb(value));
    }
  }
}

export const appState = AppState.getInstance();
