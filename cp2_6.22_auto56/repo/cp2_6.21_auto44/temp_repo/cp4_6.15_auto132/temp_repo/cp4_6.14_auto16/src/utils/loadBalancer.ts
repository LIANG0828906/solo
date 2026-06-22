import type { TeamMember, Task, LoadData, AssignmentSuggestion } from './types';

const STANDARD_WEEKLY_HOURS = 40;
const OVERLOAD_THRESHOLD = 80;

export function calculateLoad(
  members: TeamMember[],
  tasks: Task[],
  standardWeeklyHours: number = STANDARD_WEEKLY_HOURS
): LoadData[] {
  return members.map((member) => {
    const memberTasks = tasks.filter(
      (t) => t.assigneeId === member.id && t.status !== 'done'
    );
    const taskCount = memberTasks.length;
    const totalHours = memberTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    const loadPercentage = Math.min(
      Math.round((totalHours / standardWeeklyHours) * 100),
      999
    );

    return {
      memberId: member.id,
      member,
      taskCount,
      totalHours,
      loadPercentage,
      tasks: memberTasks,
    };
  });
}

export function getOverloadedMembers(loadData: LoadData[]): LoadData[] {
  return loadData.filter((item) => item.loadPercentage > OVERLOAD_THRESHOLD);
}

export function getUnderloadedMembers(loadData: LoadData[]): LoadData[] {
  return loadData.filter((item) => item.loadPercentage < 50);
}

export function getBalancedMembers(loadData: LoadData[]): LoadData[] {
  return loadData.filter(
    (item) => item.loadPercentage >= 50 && item.loadPercentage <= OVERLOAD_THRESHOLD
  );
}

export function getAverageLoad(loadData: LoadData[]): number {
  if (loadData.length === 0) return 0;
  const total = loadData.reduce((sum, item) => sum + item.loadPercentage, 0);
  return Math.round(total / loadData.length);
}

export function getTotalUnassignedHours(tasks: Task[]): number {
  return tasks
    .filter((t) => !t.assigneeId && t.status !== 'done')
    .reduce((sum, t) => sum + t.estimatedHours, 0);
}

export function suggestAssignments(
  members: TeamMember[],
  tasks: Task[]
): AssignmentSuggestion[] {
  const suggestions: AssignmentSuggestion[] = [];
  const loadData = calculateLoad(members, tasks);

  const unassignedTasks = tasks.filter((t) => !t.assigneeId && t.status !== 'done');
  const sortedForAssignment = [...unassignedTasks].sort((a, b) => {
    const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
    return priorityWeight[b.priority] - priorityWeight[a.priority];
  });

  for (const task of sortedForAssignment) {
    const sortedMembers = [...loadData].sort(
      (a, b) => a.loadPercentage - b.loadPercentage
    );

    for (const candidate of sortedMembers) {
      const projectedLoad =
        candidate.loadPercentage +
        Math.round((task.estimatedHours / STANDARD_WEEKLY_HOURS) * 100);

      if (projectedLoad <= OVERLOAD_THRESHOLD) {
        const priorityLabel = { urgent: '紧急', high: '高', medium: '中', low: '低' };
        suggestions.push({
          taskId: task.id,
          taskTitle: task.title,
          fromMemberId: null,
          toMemberId: candidate.memberId,
          reason: `分配${priorityLabel[task.priority]}优先级任务(${task.estimatedHours}h)，预计负载将达到${projectedLoad}%`,
        });
        break;
      }
    }
  }

  const overloaded = getOverloadedMembers(loadData);
  for (const over of overloaded) {
    const overloadTasks = [...over.tasks].sort((a, b) => {
      const priorityWeight = { low: 4, medium: 3, high: 2, urgent: 1 };
      return priorityWeight[a.priority] - priorityWeight[b.priority];
    });

    for (const task of overloadTasks) {
      if (task.priority === 'urgent' || task.priority === 'high') continue;

      const underloaded = [...loadData]
        .filter(
          (item) =>
            item.memberId !== over.memberId &&
            item.loadPercentage < OVERLOAD_THRESHOLD
        )
        .sort((a, b) => a.loadPercentage - b.loadPercentage);

      if (underloaded.length > 0) {
        const target = underloaded[0];
        const projectTargetLoad =
          target.loadPercentage +
          Math.round((task.estimatedHours / STANDARD_WEEKLY_HOURS) * 100);

        if (projectTargetLoad <= OVERLOAD_THRESHOLD + 10) {
          suggestions.push({
            taskId: task.id,
            taskTitle: task.title,
            fromMemberId: over.memberId,
            toMemberId: target.memberId,
            reason: `从${over.member.name}转移任务(${task.estimatedHours}h)至${target.member.name}，缓解过载(${over.loadPercentage}%→${
              over.loadPercentage -
              Math.round((task.estimatedHours / STANDARD_WEEKLY_HOURS) * 100)
            }%)`,
          });
        }
      }
    }
  }

  return suggestions.slice(0, 10);
}

export function rebalanceTasks(
  members: TeamMember[],
  tasks: Task[]
): { taskId: string; newAssigneeId: string }[] {
  const loadData = calculateLoad(members, tasks);
  const averageLoad = getAverageLoad(loadData);
  const reassignments: { taskId: string; newAssigneeId: string }[] = [];

  const overloaded = loadData.filter((l) => l.loadPercentage > averageLoad + 10);
  const underloaded = loadData.filter((l) => l.loadPercentage < averageLoad - 10);

  for (const over of overloaded) {
    const movableTasks = over.tasks.filter(
      (t) => t.priority === 'low' || t.priority === 'medium'
    );

    for (const task of movableTasks) {
      if (over.loadPercentage <= averageLoad + 5) break;

      const targets = underloaded
        .filter((u) => u.loadPercentage < averageLoad + 5)
        .sort((a, b) => a.loadPercentage - b.loadPercentage);

      if (targets.length > 0) {
        const target = targets[0];
        reassignments.push({
          taskId: task.id,
          newAssigneeId: target.memberId,
        });

        const transferred = Math.round(
          (task.estimatedHours / STANDARD_WEEKLY_HOURS) * 100
        );
        over.loadPercentage -= transferred;
        target.loadPercentage += transferred;
      }
    }
  }

  return reassignments;
}

export { OVERLOAD_THRESHOLD, STANDARD_WEEKLY_HOURS };
