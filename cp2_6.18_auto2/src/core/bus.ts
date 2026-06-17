import type { CelestialBody, PhysicsParams } from '../utils/types';

export interface IBusEventMap {
  'params:update': PhysicsParams;
  'bodies:update': CelestialBody[];
  'body:hover': { bodyId: string | null };
  'body:click': { body: CelestialBody };
  'body:select': { bodyId: string | null };
  'camera:rotate': { azimuthAngle: number };
}

export interface IDataBus {
  on<K extends keyof IBusEventMap>(
    event: K,
    callback: (data: IBusEventMap[K]) => void
  ): () => void;
  emit<K extends keyof IBusEventMap>(event: K, data: IBusEventMap[K]): void;
  off<K extends keyof IBusEventMap>(
    event: K,
    callback: (data: IBusEventMap[K]) => void
  ): void;
  clear(): void;
}

type BusCallback<K extends keyof IBusEventMap> = (
  data: IBusEventMap[K]
) => void;

export class EventBus implements IDataBus {
  private listeners: Map<
    keyof IBusEventMap,
    Set<BusCallback<keyof IBusEventMap>>
  >;

  constructor() {
    this.listeners = new Map();
  }

  on<K extends keyof IBusEventMap>(
    event: K,
    callback: BusCallback<K>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event) as Set<BusCallback<K>>;
    set.add(callback);
    return () => {
      set.delete(callback);
    };
  }

  emit<K extends keyof IBusEventMap>(event: K, data: IBusEventMap[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        (cb as BusCallback<K>)(data);
      });
    }
  }

  off<K extends keyof IBusEventMap>(
    event: K,
    callback: BusCallback<K>
  ): void {
    const set = this.listeners.get(event) as
      | Set<BusCallback<K>>
      | undefined;
    if (set) {
      set.delete(callback);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
