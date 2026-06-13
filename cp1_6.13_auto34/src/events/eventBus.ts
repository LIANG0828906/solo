export enum EventType {
  ECOSYSTEM_TICK = 'ecosystem:tick',
  ECOSYSTEM_SNAPSHOT = 'ecosystem:snapshot',
  ECOSYSTEM_PREDATION = 'ecosystem:predation',
  ECOSYSTEM_ANIMAL_SELECTED = 'ecosystem:animalSelected',
  ECOSYSTEM_STATE = 'ecosystem:state',
  UI_PLACE_PLANT = 'ui:placePlant',
  UI_REMOVE_PLANT = 'ui:removePlant',
  UI_SPAWN_ANIMAL = 'ui:spawnAnimal',
  UI_SELECT_ANIMAL = 'ui:selectAnimal',
  UI_CANVAS_CLICK = 'ui:canvasClick',
}

export interface PredationEventPayload {
  predatorId: string;
  preyId: string;
  preyX: number;
  preyY: number;
  predatorX: number;
  predatorY: number;
  success: boolean;
}

export interface CanvasClickPayload {
  x: number;
  y: number;
}

export interface PlacePlantPayload {
  x: number;
  y: number;
  plantType: string;
}

export interface RemovePlantPayload {
  x: number;
  y: number;
}

export interface SpawnAnimalPayload {
  x: number;
  y: number;
  animalType: string;
}

type EventPayloadMap = {
  [EventType.ECOSYSTEM_TICK]: unknown;
  [EventType.ECOSYSTEM_SNAPSHOT]: unknown;
  [EventType.ECOSYSTEM_PREDATION]: PredationEventPayload;
  [EventType.ECOSYSTEM_ANIMAL_SELECTED]: unknown;
  [EventType.ECOSYSTEM_STATE]: unknown;
  [EventType.UI_PLACE_PLANT]: PlacePlantPayload;
  [EventType.UI_REMOVE_PLANT]: RemovePlantPayload;
  [EventType.UI_SPAWN_ANIMAL]: SpawnAnimalPayload;
  [EventType.UI_SELECT_ANIMAL]: string | null;
  [EventType.UI_CANVAS_CLICK]: CanvasClickPayload;
};

type EventCallback<T> = (payload: T) => void;

export class EventBus {
  private listeners: Map<string, Set<EventCallback<unknown>>> = new Map();

  on<K extends EventType>(event: K, callback: EventCallback<EventPayloadMap[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback<unknown>);
  }

  off<K extends EventType>(event: K, callback: EventCallback<EventPayloadMap[K]>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback as EventCallback<unknown>);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit<K extends EventType>(event: K, payload: EventPayloadMap[K]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`[EventBus] Error in listener for ${event}:`, e);
        }
      });
    }
  }
}

export const eventBus = new EventBus();
