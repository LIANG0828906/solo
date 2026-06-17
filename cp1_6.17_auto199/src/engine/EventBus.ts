type EventCallback = (...args: any[]) => void;

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(...args);
      } catch (e) {
        console.error(`EventBus error on '${event}':`, e);
      }
    });
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();

export interface GameEvents {
  levelStart: { level: number; mazeSize: number };
  playerMove: { x: number; z: number };
  energyCollect: { color: string; x: number; z: number; sameColor: boolean };
  interferenceHit: { x: number; z: number };
  playerCollision: { x: number; z: number };
  levelComplete: { level: number; score: number };
  gameOver: { score: number };
  scoreUpdate: { score: number };
  energyUpdate: { energy: number; maxEnergy: number };
  playerState: { radius: number; isPowered: boolean; isSlowed: boolean };
  shake: { duration: number; amplitude: number };
  flashRed: { duration: number };
}

export function emitEvent<K extends keyof GameEvents>(
  event: K,
  data: GameEvents[K]
): void {
  eventBus.emit(event, data);
}

export function onEvent<K extends keyof GameEvents>(
  event: K,
  callback: (data: GameEvents[K]) => void
): () => void {
  return eventBus.on(event, callback as EventCallback);
}
