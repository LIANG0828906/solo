import type { Objective, KeyResult, ObjectiveStatus } from '../../types';

export const calculateObjectiveProgress = (objective: Objective): number => {
  if (objective.keyResults.length === 0) return 0;
  const total = objective.keyResults.reduce((sum, kr) => {
    const progress = Math.min((kr.currentValue / kr.targetValue) * 100, 100);
    return sum + progress;
  }, 0);
  return Math.round(total / objective.keyResults.length);
};

export const calculateKRProgress = (kr: KeyResult): number => {
  return Math.min(Math.round((kr.currentValue / kr.targetValue) * 100), 100);
};

export const getProgressColor = (progress: number): string => {
  if (progress >= 80) return '#2e7d32';
  if (progress >= 50) return '#1565c0';
  if (progress >= 30) return '#f57c00';
  return '#d32f2f';
};

export const getStatusInfo = (status: ObjectiveStatus): { label: string; color: string; bgColor: string } => {
  const statusMap: Record<ObjectiveStatus, { label: string; color: string; bgColor: string }> = {
    completed: { label: '已达标', color: '#ffffff', bgColor: '#2e7d32' },
    in_progress: { label: '进行中', color: '#ffffff', bgColor: '#1565c0' },
    at_risk: { label: '有风险', color: '#ffffff', bgColor: '#f57c00' },
    not_started: { label: '未开始', color: '#ffffff', bgColor: '#757575' }
  };
  return statusMap[status];
};

export const getQuarterWeeks = (quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4', year: number): string[] => {
  const startMonth = (parseInt(quarter.slice(1)) - 1) * 3;
  const weeks: string[] = [];
  
  for (let i = 0; i < 13; i++) {
    const date = new Date(year, startMonth, 1);
    date.setDate(date.getDate() + i * 7);
    const weekNum = Math.floor(i + 1);
    weeks.push(`第${weekNum}周 (${date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })})`);
  }
  
  return weeks;
};

export const getWeekNumber = (dateStr: string, quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4', year: number): number => {
  const date = new Date(dateStr);
  const startMonth = (parseInt(quarter.slice(1)) - 1) * 3;
  const quarterStart = new Date(year, startMonth, 1);
  const diffTime = date.getTime() - quarterStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
};

export const getAvatarColor = (name: string): string => {
  const colors = ['#1a237e', '#3949ab', '#5c6bc0', '#7986cb', '#303f9f'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export const getInitials = (name: string): string => {
  return name.slice(0, 1).toUpperCase();
};

export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const getTeamProgress = (objectives: Objective[]): number => {
  if (objectives.length === 0) return 0;
  const total = objectives.reduce((sum, obj) => sum + calculateObjectiveProgress(obj), 0);
  return Math.round(total / objectives.length);
};

export const getRiskCount = (objectives: Objective[]): number => {
  return objectives.filter(obj => obj.status === 'at_risk').length;
};
