export enum EventType {
  CELL_CREATED = 'cell:created',
  CELL_UPDATED = 'cell:updated',
  CELL_REMOVED = 'cell:removed',
  CELL_SELECTED = 'cell:selected',
  SPLIT_REQUESTED = 'split:requested',
  SPLIT_STARTED = 'split:started',
  SPLIT_COMPLETED = 'split:completed',
  DIFFERENTIATE_REQUESTED = 'differentiate:requested',
  DIFFERENTIATE_COMPLETED = 'differentiate:completed',
  RECORD_SAVE_REQUESTED = 'record:saveRequested',
  RECORD_RESTORE_REQUESTED = 'record:restoreRequested',
  RECORD_SAVED = 'record:saved',
  RECORD_RESTORED = 'record:restored',
  STATE_SNAPSHOT_REQUESTED = 'state:snapshotRequested',
  STATE_SNAPSHOT_RESPONSE = 'state:snapshotResponse',
  SCENE_CELL_CLICKED = 'scene:cellClicked',
  SCENE_READY = 'scene:ready',
}

export type CellType = 'default' | 'neuron' | 'muscle' | 'epithelial';

export interface CellData {
  id: string;
  position: { x: number; y: number; z: number };
  color: string;
  type: CellType;
  scale: { x: number; y: number; z: number };
  parentId: string | null;
  generation: number;
}

export interface RecordData {
  id: string;
  timestamp: number;
  cells: CellData[];
  splitCount: number;
  thumbnail: string;
}

export interface SplitStartPayload {
  parentId: string;
  parentPosition: { x: number; y: number; z: number };
  parentColor: string;
  child1: CellData;
  child2: CellData;
}

export interface DifferentiatePayload {
  cellId: string;
  cellType: CellType;
  targetColor: string;
  targetScale: { x: number; y: number; z: number };
}

type EventCallback = (payload?: unknown) => void;

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: EventType, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: EventType, callback: EventCallback): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
    }
  }

  emit(event: EventType, payload?: unknown): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach(cb => cb(payload));
    }
  }
}

export const eventBus = new EventBus();
