export type Priority = 'high' | 'medium' | 'low';

export interface Project {
  id: string;
  name: string;
  deadline: string;
  totalTasks: number;
  completedTasks: number;
  priority: Priority;
  hoursInvested: number;
  createdAt: string;
}

export interface AllocationResult {
  projectId: string;
  projectName: string;
  recommendedHours: number;
  actualHours: number;
  deviationPercent: number;
}

const PRIORITY_WEIGHTS: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const TASK_ESTIMATE_HOURS = 1.5;

function getDaysRemaining(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(diffDays, 1);
}

function roundToHalfHour(hours: number): number {
  return Math.round(hours * 2) / 2;
}

export function allocateTime(
  projects: Project[],
  dailyAvailableHours: number
): AllocationResult[] {
  const activeProjects = projects.filter(
    (p) => p.completedTasks < p.totalTasks
  );

  if (activeProjects.length === 0) {
    return [];
  }

  const scoredProjects = activeProjects.map((project) => {
    const daysRemaining = getDaysRemaining(project.deadline);
    const remainingTasks = project.totalTasks - project.completedTasks;
    const estimatedHoursNeeded = remainingTasks * TASK_ESTIMATE_HOURS;
    const priorityWeight = PRIORITY_WEIGHTS[project.priority];
    const urgency = 1 / daysRemaining;
    const score = urgency * priorityWeight * estimatedHoursNeeded;

    return {
      project,
      score,
      estimatedHoursNeeded,
      daysRemaining,
    };
  });

  scoredProjects.sort((a, b) => b.score - a.score);

  const totalScore = scoredProjects.reduce((sum, p) => sum + p.score, 0);

  let allocatedHours = 0;
  const results: AllocationResult[] = [];

  for (let i = 0; i < scoredProjects.length; i++) {
    const { project, estimatedHoursNeeded, daysRemaining } = scoredProjects[i];
    const isLast = i === scoredProjects.length - 1;

    let recommendedHours: number;

    if (isLast) {
      recommendedHours = roundToHalfHour(dailyAvailableHours - allocatedHours);
    } else {
      const shareRatio = scoredProjects[i].score / totalScore;
      const baseHours = dailyAvailableHours * shareRatio;
      const dailyMinimum = Math.min(
        estimatedHoursNeeded / daysRemaining,
        baseHours
      );
      recommendedHours = roundToHalfHour(Math.max(dailyMinimum, 0.5));
    }

    recommendedHours = Math.max(0, Math.min(recommendedHours, dailyAvailableHours - allocatedHours));

    if (recommendedHours > 0) {
      allocatedHours += recommendedHours;
    }

    const deviationPercent =
      recommendedHours > 0
        ? Math.round(
            ((project.hoursInvested - recommendedHours) / recommendedHours) * 100
          )
        : 0;

    results.push({
      projectId: project.id,
      projectName: project.name,
      recommendedHours,
      actualHours: project.hoursInvested,
      deviationPercent,
    });
  }

  return results;
}
