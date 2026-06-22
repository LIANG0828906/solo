export interface Roadmap {
  id: string;
  skillName: string;
  description: string;
  targetDate: string;
  createdAt: string;
  completed: boolean;
  stages: Stage[];
  dailyRecords: DailyRecord[];
}

export interface Stage {
  id: string;
  roadmapId: string;
  name: string;
  order: number;
  targetDays: number;
  color: string;
  expanded: boolean;
  subTasks: SubTask[];
  skillScores: SkillScore[];
}

export interface SubTask {
  id: string;
  stageId: string;
  title: string;
  estimatedMinutes: number;
  actualMinutes: number;
  completed: boolean;
  completedAt: string | null;
}

export interface SkillScore {
  id: string;
  stageId: string;
  skillName: string;
  score: number;
}

export interface DailyRecord {
  date: string;
  actualMinutes: number;
  targetMinutes: number;
}
