export type StarDustColor = 'red' | 'blue' | 'gold' | 'purple' | 'green';

export interface StarDust {
  id: string;
  color: StarDustColor;
  rarity: 'common' | 'rare' | 'legendary';
  name: string;
}

export interface InspirationTask {
  id: string;
  name: string;
  description: string;
  requiredColors: StarDustColor[];
  constellation: string;
  points: number;
  timeLimit: number;
}

export interface InspirationLogEntry {
  id: string;
  taskName: string;
  combination: StarDustColor[];
  success: boolean;
  points: number;
  timestamp: number;
}

export interface DailyBreakdown {
  date: string;
  tasksCompleted: number;
  pointsEarned: number;
}

export interface TenDayReport {
  periodStart: string;
  periodEnd: string;
  totalTasks: number;
  completedTasks: number;
  totalPoints: number;
  dailyBreakdown: DailyBreakdown[];
  achievements: string[];
}

export interface CombineRequest {
  taskId: string;
  colors: StarDustColor[];
}

export interface CombineResponse {
  success: boolean;
  points: number;
  message: string;
  constellation: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'sparkle' | 'trail' | 'burst';
}
