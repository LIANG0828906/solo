export interface Ingredient {
  id: string;
  name: string;
  color: number;
  icon: string;
}

export interface StepConfig {
  type: 'prep' | 'cook' | 'plate';
  name: string;
  duration: number;
  perfectWindow: number;
}

export interface DishConfig {
  id: string;
  name: string;
  color: number;
  steps: StepConfig[];
  ingredients: Ingredient[];
  baseScore: number;
}

export interface Order {
  id: string;
  dishes: DishInstance[];
  currentDishIndex: number;
  timeRemaining: number;
  maxTime: number;
  createdAt: number;
  status: 'pending' | 'active' | 'completed' | 'failed';
  customerId: string;
}

export interface DishInstance {
  config: DishConfig;
  currentStepIndex: number;
  stepsCompleted: boolean[];
  isCompleted: boolean;
}

export interface GameState {
  score: number;
  perfectCount: number;
  totalDishes: number;
  satisfaction: number;
  level: number;
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  combo: number;
  maxCombo: number;
  totalResponseTime: number;
  responseCount: number;
}

export interface LevelConfig {
  level: number;
  name: string;
  orderInterval: number;
  maxOrders: number;
  timeMultiplier: number;
  dishCount: [number, number];
  stepsMultiplier: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
}
