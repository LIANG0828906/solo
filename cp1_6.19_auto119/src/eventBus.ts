type EventHandler<T = unknown> = (data: T) => void;

type EventMap = {
  'formation:change': FormationType;
  'target:select': string | null;
  'fire:focus': string;
  'range:toggle': boolean;
  'weapon:update': { type: WeaponType; config: Partial<WeaponConfig> };
  'combat:record': void;
  'combat:play': void;
  'combat:pause': void;
  'combat:seek': number;
  'combat:speed': number;
  'ship:click': { shipId: string; isEnemy: boolean };
  'frame:update': CombatSnapshot;
  'selected-ship:change': string | null;
};

class EventBus {
  private handlers: Map<keyof EventMap, Set<EventHandler>> = new Map();

  on<E extends keyof EventMap>(event: E, handler: (data: EventMap[E]) => void): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as EventHandler);
    return () => this.off(event, handler as EventHandler);
  }

  off<E extends keyof EventMap>(event: E, handler: (data: EventMap[E]) => void): void {
    const set = this.handlers.get(event);
    if (set) {
      set.delete(handler as EventHandler);
    }
  }

  emit<E extends keyof EventMap>(event: E, data: EventMap[E]): void {
    const set = this.handlers.get(event);
    if (set) {
      set.forEach((handler) => handler(data));
    }
  }
}

export const eventBus = new EventBus();

export type FormationType = 'wedge' | 'cylinder' | 'diamond' | 'line';
export type WeaponType = 'laser' | 'missile' | 'railgun';
export type ShipType = 'destroyer' | 'cruiser' | 'capital';

export interface WeaponConfig {
  type: WeaponType;
  damage: number;
  range: number;
  fireRate: number;
  color: string;
}

export interface Ship {
  id: string;
  type: ShipType;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  weaponType: WeaponType;
  health: number;
  maxHealth: number;
  isFlashing?: boolean;
  flashStartTime?: number;
}

export interface AttackLine {
  id: string;
  fromShipId: string;
  toShipId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  createdAt: number;
  duration: number;
}

export interface CombatSnapshot {
  playerFleet: Ship[];
  enemyFleet: Ship[];
  attackLines: AttackLine[];
  timestamp: number;
}

export interface CombatState {
  playerFleet: Ship[];
  enemyFleet: Ship[];
  attackLines: AttackLine[];
  selectedTargetId: string | null;
  selectedShipId: string | null;
  showRange: boolean;
  isRecording: boolean;
  recordedFrames: CombatSnapshot[];
  currentFrame: number;
  isPlaying: boolean;
  playbackSpeed: number;
  weaponConfigs: Record<WeaponType, WeaponConfig>;
  currentFormation: FormationType;
}
