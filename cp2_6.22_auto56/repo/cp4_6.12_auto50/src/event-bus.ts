type EventCallback<T = any> = (data: T) => void;

export class EventBus {
  private events: Map<string, Set<EventCallback>> = new Map();

  on<T = any>(event: string, callback: EventCallback<T>): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
  }

  off<T = any>(event: string, callback: EventCallback<T>): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit<T = any>(event: string, data?: T): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`EventBus error in "${event}":`, e);
        }
      });
    }
  }

  clear(): void {
    this.events.clear();
  }
}

export const eventBus = new EventBus();

export type WasteType = 'plastic' | 'paper' | 'metal' | 'electronic';

export interface TruckArrivedEvent {
  id: string;
  type: WasteType;
  items: number;
  timestamp: number;
}

export interface WasteItemEvent {
  id: string;
  type: WasteType;
  beltIndex: number;
  timestamp: number;
}

export interface SortResultEvent {
  id: string;
  correct: boolean;
  type: WasteType;
  score: number;
  buttonX?: number;
  buttonY?: number;
}

export interface ScoreUpdateEvent {
  score: number;
  totalItems: number;
  elapsedTime: number;
}

export interface StorageUpdateEvent {
  plastic: number;
  paper: number;
  metal: number;
  electronic: number;
  maxCapacity: number;
  type: WasteType;
  isFull: boolean;
}

export interface ResourcesUpdateEvent {
  plasticPellets: number;
  metalIngots: number;
  paperPulp: number;
}

export interface ProcessorActiveEvent {
  type: 'shredder' | 'furnace' | 'pulper';
  active: boolean;
}

export interface UpgradeEvent {
  equipment: 'belt' | 'processor' | 'storage';
  level: number;
  buttonX?: number;
  buttonY?: number;
}

export interface UpgradeAvailableEvent {
  belt: boolean;
  processor: boolean;
  storage: boolean;
  beltLevel: number;
  processorLevel: number;
  storageLevel: number;
  nextCost: { belt: number; processor: number; storage: number };
  score: number;
}

export interface GameWinEvent {
  elapsedTime: number;
  totalItems: number;
}

export interface GameResetEvent {}

export interface GameEvents {
  'truck:arrived': TruckArrivedEvent;
  'item:spawn': WasteItemEvent;
  'item:sort-result': SortResultEvent;
  'score:update': ScoreUpdateEvent;
  'storage:update': StorageUpdateEvent;
  'resources:update': ResourcesUpdateEvent;
  'processor:active': ProcessorActiveEvent;
  'upgrade:request': { equipment: 'belt' | 'processor' | 'storage' };
  'upgrade:done': UpgradeEvent;
  'upgrade:available': UpgradeAvailableEvent;
  'game:win': GameWinEvent;
  'game:reset': GameResetEvent;
  'player:sort': { itemId: string; type: WasteType; buttonX: number; buttonY: number };
  'item:timeout': { itemId: string };
}
