export interface Herb {
  id: string;
  name: string;
  alias: string;
  smell: string;
  shape: string;
  effect: string;
  emoji: string;
  category: string;
}

export interface Task {
  id: string;
  herbId: string;
  description: {
    smell: string;
    shape: string;
    effect: string;
  };
  timeLimit: number;
  deadline: number;
}

export interface SubmitAnswerRequest {
  taskId: string;
  herbId: string;
}

export interface SubmitAnswerResponse {
  correct: boolean;
  knowledgeChange: number;
  currentKnowledge: number;
  correctHerb?: Herb;
}

export interface GameEvent {
  id: string;
  type: 'shortage' | 'poison' | 'bookworm' | 'plague';
  title: string;
  description: string;
  options: EventOption[];
}

export interface EventOption {
  id: string;
  text: string;
  effect: {
    knowledge?: number;
    score?: number;
    timeBonus?: number;
  };
}

export interface ScoreReport {
  period: number;
  accuracy: number;
  completionRate: number;
  eventHandling: number;
  totalScore: number;
  grade: '下工' | '中工' | '上工' | '神医';
  comment: string;
}

export interface ResolveEventRequest {
  eventId: string;
  optionId: string;
}

export interface ResolveEventResponse {
  success: boolean;
  effect: {
    knowledge?: number;
    score?: number;
    timeBonus?: number;
  };
  message: string;
}

export interface EndPeriodResponse {
  report: ScoreReport;
}

export interface DragPosition {
  x: number;
  y: number;
}
