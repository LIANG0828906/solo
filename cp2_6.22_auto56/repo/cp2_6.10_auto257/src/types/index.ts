export interface Herb {
  id: string;
  name: string;
  pinyin: string;
  shape: string;
  odor: string;
  effect: string;
  nature: string;
  meridian: string[];
  image: string;
  color: string;
}

export interface Task {
  id: string;
  day: number;
  description: {
    shape: string;
    odor: string;
    effect: string;
  };
  targetHerbId: string;
  timeLimit: number;
  status: 'pending' | 'active' | 'completed' | 'failed';
}

export interface RecipeSlot {
  monarch: Herb | null;
  minister: Herb | null;
  assistant: Herb | null;
  guide: Herb | null;
}

export interface Recipe {
  id: string;
  name: string;
  monarch: string[];
  minister: string[];
  assistant: string[];
  guide: string[];
  effect: string;
}

export interface GameEvent {
  id: string;
  type: 'plague' | 'pest' | 'poison' | 'worm';
  title: string;
  description: string;
  options: {
    id: string;
    text: string;
    scoreEffect: number;
    knowledgeEffect: number;
  }[];
  timeLimit: number;
}

export interface ScoreReport {
  period: number;
  accuracy: number;
  recipeCompletion: number;
  eventHandling: number;
  totalScore: number;
  knowledge: number;
  grade: '甲' | '乙' | '丙' | '丁';
  comments: string;
}

export interface GameState {
  day: number;
  period: number;
  knowledge: number;
  correctCount: number;
  wrongCount: number;
  completedRecipes: number;
  eventScore: number;
  currentTask: Task | null;
  availableHerbs: Herb[];
  collectedHerbs: Herb[];
  recipeSlots: RecipeSlot;
  currentEvent: GameEvent | null;
  showScoreReport: boolean;
  scoreReport: ScoreReport | null;
  feedback: {
    type: 'success' | 'error' | null;
    message: string;
    herbId: string | null;
  };
}

export interface SubmitResponse {
  correct: boolean;
  knowledge: number;
  message: string;
}

export interface RecipeSubmitResponse {
  valid: boolean;
  score: number;
  message: string;
}

export interface EventHandleResponse {
  scoreEffect: number;
  knowledgeEffect: number;
  message: string;
}
