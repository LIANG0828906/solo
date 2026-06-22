export type FragmentColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

export type SlotPosition = '12' | '3' | '6' | '9';

export type SlotState = 'empty' | 'active' | 'error';

export type ParticleType = 'merge' | 'rain' | 'trail' | 'singularity';

export type AudioType = 'pendulum' | 'gears' | 'rain' | 'merge' | 'error' | 'singularity';

export type TimeOfDay = 'day' | 'night';

export type Weather = 'clear' | 'rain' | 'snow';

export interface Fragment {
  id: string;
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  color: FragmentColor;
  size: number;
  rotation: number;
  isDragging: boolean;
  mergedFrom: [string, string] | null;
  glowPhase: number;
  returnAnimation: { active: boolean; startX: number; startY: number; targetX: number; targetY: number; progress: number } | null;
}

export interface Slot {
  id: SlotPosition;
  x: number;
  y: number;
  requiredColors: FragmentColor[];
  state: SlotState;
  shakeOffset: { x: number; y: number };
  glowIntensity: number;
  errorTimer: number;
  shakeTimer: number;
}

export interface TimelineState {
  timeSpeed: number;
  timeOfDay: TimeOfDay;
  weather: Weather;
  skyGradient: [string, string];
  darkness: number;
  progress: number;
  speedBoostTimer: number;
  rainTimer: number;
  nightTimer: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
  type: ParticleType;
  angle?: number;
  length?: number;
}

export interface Gear {
  x: number;
  y: number;
  radius: number;
  teeth: number;
  rotation: number;
  speed: number;
}

export type GameEvent =
  | { type: 'fragment:created'; payload: Fragment }
  | { type: 'fragment:moved'; payload: { id: string; x: number; y: number } }
  | { type: 'fragment:merged'; payload: { fragmentIds: [string, string]; newFragment: Fragment } }
  | { type: 'slot:activated'; payload: { slotId: SlotPosition; colors: FragmentColor[] } }
  | { type: 'slot:error'; payload: { slotId: SlotPosition } }
  | { type: 'timeline:changed'; payload: Partial<TimelineState> }
  | { type: 'particles:spawn'; payload: Particle[] }
  | { type: 'audio:play'; payload: AudioType }
  | { type: 'audio:stop'; payload: AudioType }
  | { type: 'game:complete'; payload: { score: number } };

export type EventCallback<T = any> = (payload: T) => void;

export class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on<T = any>(eventType: string, callback: EventCallback<T>): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  off<T = any>(eventType: string, callback: EventCallback<T>): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit(event: GameEvent): void {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => callback(event.payload));
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const FRAGMENT_COLORS: Record<FragmentColor, string> = {
  red: '#FF4444',
  orange: '#FF8800',
  yellow: '#FFDD00',
  green: '#44DD44',
  blue: '#4488FF',
  purple: '#AA44FF'
};

export const FRAGMENT_COLOR_NAMES: Record<FragmentColor, string> = {
  red: '红',
  orange: '橙',
  yellow: '黄',
  green: '绿',
  blue: '蓝',
  purple: '紫'
};

export const SLOT_REQUIREMENTS: Record<SlotPosition, FragmentColor[]> = {
  '12': ['red', 'orange'],
  '3': ['yellow', 'green'],
  '6': ['blue', 'purple'],
  '9': ['red', 'orange', 'yellow', 'green', 'blue', 'purple']
};

export const CHINESE_HOURS: string[] = [
  '子', '丑', '寅', '卯', '辰', '巳',
  '午', '未', '申', '酉', '戌', '亥'
];

export const COLOR_MERGE_MAP: Record<string, FragmentColor> = {
  'red+orange': 'red',
  'orange+red': 'red',
  'yellow+green': 'yellow',
  'green+yellow': 'yellow',
  'blue+purple': 'blue',
  'purple+blue': 'blue'
};
