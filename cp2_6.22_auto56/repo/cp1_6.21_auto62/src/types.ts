export interface Character {
  id: string;
  name: string;
  avatar: string;
  hunger: number;
  health: number;
  equipment: number;
  items: Item[];
  isDead: boolean;
  griefTurns: number;
}

export interface Item {
  id: string;
  name: string;
  icon: string;
  quantity: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'move' | 'combat' | 'collect' | 'event' | 'system';
  message: string;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  options: EventOption[];
  timeLimit: number;
}

export interface EventOption {
  id: string;
  text: string;
  effect: EventEffect;
}

export interface EventEffect {
  hungerChange?: number;
  healthChange?: number;
  equipmentChange?: number;
  message: string;
  logType: 'move' | 'combat' | 'collect' | 'event' | 'system';
}

export interface GameState {
  characters: Character[];
  position: { x: number; y: number };
  logs: LogEntry[];
  currentEvent: GameEvent | null;
  isEventActive: boolean;
  eventStartTime: number | null;
  turnCount: number;
}
