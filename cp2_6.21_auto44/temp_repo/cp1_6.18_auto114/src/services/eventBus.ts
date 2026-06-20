import type { Beat } from '../types';

type EventMap = {
  'audio:uploaded': File;
  'audio:analyzed': { bpm: number; beats: Beat[] };
  'game:start': void;
  'game:over': { score: number; maxCombo: number };
  'note:hit': { track: number; accuracy: number };
  'note:miss': { track: number };
  'combo:milestone': { combo: number };
  'player:attack': { track: number };
  'player:stun': { duration: number };
  'enemy:hit': { damage: number };
  'player:hit': { damage: number };
  'sound:hit': void;
};

type EventKey = keyof EventMap;

type Listener<T extends EventKey> = (data: EventMap[T]) => void;

class EventBus {
  private listeners: Map<EventKey, Set<Listener<EventKey>>> = new Map();

  on<T extends EventKey>(event: T, listener: Listener<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener<EventKey>);
  }

  off<T extends EventKey>(event: T, listener: Listener<T>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener as Listener<EventKey>);
    }
  }

  emit<T extends EventKey>(event: T, data: EventMap[T]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => listener(data));
    }
  }

  once<T extends EventKey>(event: T, listener: Listener<T>): void {
    const onceListener: Listener<T> = (data) => {
      this.off(event, onceListener);
      listener(data);
    };
    this.on(event, onceListener);
  }
}

export default new EventBus();
