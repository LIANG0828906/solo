export type RuneElement = 'fire' | 'water' | 'earth' | 'wind';

export interface RuneShard {
  id: string;
  element: RuneElement;
  x: number;
  y: number;
  contaminated: boolean;
}

export interface RuneCasting {
  id: string;
  elements: RuneElement[];
  name: string;
  attributes: Record<string, number>;
  score: number;
}

export interface OrderRequirements {
  minFire?: number;
  minWater?: number;
  minEarth?: number;
  minWind?: number;
  requiredElements?: RuneElement[];
}

export interface Order {
  id: string;
  title: string;
  description: string;
  requirements: OrderRequirements;
  timeLimit: number;
  difficulty: 1 | 2 | 3;
  reward: number;
  completed: boolean;
  remainingTime: number;
}

export type GameEventType = 'overheat' | 'contamination' | 'muse_silence';

export interface GameEvent {
  id: string;
  type: GameEventType;
  title: string;
  description: string;
  duration: number;
  startTime: number;
}

export interface EvaluationReport {
  period: number;
  orderCompletionRate: number;
  averageCastingAttributes: number;
  eventHandlingScore: number;
  totalScore: number;
  starRating: 1 | 2 | 3 | 4 | 5;
  summary: string;
}

export type LogType = 'success' | 'failure' | 'event' | 'info';

export interface LogEntry {
  id: string;
  message: string;
  type: LogType;
  timestamp: number;
}

export interface GameState {
  shards: RuneShard[];
  orders: Order[];
  currentPeriod: number;
  periodTimeRemaining: number;
  score: number;
  experience: number;
  level: number;
  currentEvent: GameEvent | null;
  logs: LogEntry[];
  isFusing: boolean;
  fusionShards: RuneShard[];
  isOverheated: boolean;
  lastCasting: RuneCasting | null;
  showEvaluation: boolean;
  evaluationReport: EvaluationReport | null;
  ordersCompleted: number;
  ordersFailed: number;
  totalCastingAttributes: number;
  castingCount: number;
  eventsHandled: number;
  eventsFailed: number;
}

export interface FusionResult {
  casting: RuneCasting;
  success: boolean;
  message: string;
}

export interface ElementColors {
  fire: string;
  water: string;
  earth: string;
  wind: string;
}

export const ELEMENT_COLORS: ElementColors = {
  fire: '#ff6600',
  water: '#00aaff',
  earth: '#8b4513',
  wind: '#90ee90',
};

export const ELEMENT_ICONS: Record<RuneElement, string> = {
  fire: '🔥',
  water: '💧',
  earth: '🪨',
  wind: '🌪️',
};

export const ELEMENT_NAMES: Record<RuneElement, string> = {
  fire: '火焰',
  water: '寒冰',
  earth: '大地',
  wind: '疾风',
};
