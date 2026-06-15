import { v4 as uuidv4 } from 'uuid';
import type { Roadmap, Stage, SubTask, SkillScore, DailyRecord } from '@/types/index';

const STORAGE_KEY = 'skill-roadmap-data';

const DEFAULT_STAGES: { name: string; targetDays: number; color: string }[] = [
  { name: '入门', targetDays: 7, color: '#B3D9F2' },
  { name: '基础', targetDays: 14, color: '#8BAFD4' },
  { name: '进阶', targetDays: 21, color: '#7B68AE' },
  { name: '精通', targetDays: 28, color: '#6B3FA0' },
];

const DEFAULT_SKILL_NAMES = ['理论理解', '动手实践', '项目经验'];

export function loadRoadmap(): Roadmap | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as Roadmap;
    }
  } catch (e) {
    console.error('Failed to load roadmap from localStorage:', e);
  }
  return null;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function saveRoadmap(roadmap: Roadmap): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roadmap));
    } catch (e) {
      console.error('Failed to save roadmap to localStorage:', e);
    }
    saveTimer = null;
  }, 300);
}

export function createRoadmap(
  skillName: string,
  description: string,
  targetDate: string
): Roadmap {
  const roadmapId = uuidv4();
  const stages: Stage[] = DEFAULT_STAGES.map((s, index) => ({
    id: uuidv4(),
    roadmapId,
    name: s.name,
    order: index,
    targetDays: s.targetDays,
    color: s.color,
    expanded: false,
    subTasks: [],
    skillScores: DEFAULT_SKILL_NAMES.map((skillName) => ({
      id: uuidv4(),
      stageId: '',
      skillName,
      score: 0,
    })),
  }));

  stages.forEach((stage) => {
    stage.skillScores.forEach((ss) => {
      ss.stageId = stage.id;
    });
  });

  const today = new Date().toISOString().split('T')[0];

  return {
    id: roadmapId,
    skillName,
    description,
    targetDate,
    createdAt: new Date().toISOString(),
    completed: false,
    stages,
    dailyRecords: [{ date: today, actualMinutes: 0, targetMinutes: 60 }],
  };
}

export function createSubTask(
  stageId: string,
  title: string,
  estimatedMinutes: number
): SubTask {
  return {
    id: uuidv4(),
    stageId,
    title,
    estimatedMinutes,
    actualMinutes: 0,
    completed: false,
    completedAt: null,
  };
}

export function getStageProgress(stage: Stage): number {
  if (stage.subTasks.length === 0) return 0;
  const completed = stage.subTasks.filter((st) => st.completed).length;
  return Math.round((completed / stage.subTasks.length) * 100);
}

export function getOverallProgress(roadmap: Roadmap): number {
  if (roadmap.stages.length === 0) return 0;
  const total = roadmap.stages.reduce((sum, stage) => sum + getStageProgress(stage), 0);
  return Math.round(total / roadmap.stages.length);
}

export function getTotalActualMinutes(roadmap: Roadmap): number {
  return roadmap.stages.reduce(
    (sum, stage) =>
      sum + stage.subTasks.reduce((s, st) => s + (st.completed ? st.actualMinutes : 0), 0),
    0
  );
}

export function getTotalEstimatedMinutes(roadmap: Roadmap): number {
  return roadmap.stages.reduce(
    (sum, stage) => sum + stage.subTasks.reduce((s, st) => s + st.estimatedMinutes, 0),
    0
  );
}

export function getStageStatus(
  stage: Stage
): 'not_started' | 'in_progress' | 'completed' {
  const progress = getStageProgress(stage);
  if (progress === 0) return 'not_started';
  if (progress === 100) return 'completed';
  return 'in_progress';
}

export function isRoadmapCompleted(roadmap: Roadmap): boolean {
  return roadmap.stages.every(
    (stage) => stage.subTasks.length > 0 && getStageProgress(stage) === 100
  );
}

export function getAggregatedSkillScores(roadmap: Roadmap): SkillScore[] {
  const scoreMap: Record<string, { total: number; count: number }> = {};

  roadmap.stages.forEach((stage) => {
    stage.skillScores.forEach((ss) => {
      if (!scoreMap[ss.skillName]) {
        scoreMap[ss.skillName] = { total: 0, count: 0 };
      }
      scoreMap[ss.skillName].total += ss.score;
      scoreMap[ss.skillName].count += 1;
    });
  });

  return Object.entries(scoreMap).map(([skillName, { total, count }]) => ({
    id: uuidv4(),
    stageId: '',
    skillName,
    score: count > 0 ? Math.round((total / count) * 10) / 10 : 0,
  }));
}

export function updateDailyRecord(
  roadmap: Roadmap,
  minutesToAdd: number
): DailyRecord[] {
  const today = new Date().toISOString().split('T')[0];
  const records = [...roadmap.dailyRecords];
  const existingIndex = records.findIndex((r) => r.date === today);

  if (existingIndex >= 0) {
    records[existingIndex] = {
      ...records[existingIndex],
      actualMinutes: records[existingIndex].actualMinutes + minutesToAdd,
    };
  } else {
    records.push({
      date: today,
      actualMinutes: minutesToAdd,
      targetMinutes: 60,
    });
  }

  return records.sort((a, b) => a.date.localeCompare(b.date));
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
}

export function getDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getAverageMasteryScore(roadmap: Roadmap): number {
  const scores = getAggregatedSkillScores(roadmap);
  if (scores.length === 0) return 0;
  const total = scores.reduce((sum, s) => sum + s.score, 0);
  return Math.round((total / scores.length) * 10) / 10;
}
