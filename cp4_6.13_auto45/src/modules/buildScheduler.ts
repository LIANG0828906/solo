import type { BuildPhase, BuildTask, WorkerAssignment } from '@/types';
import type { PhaseStatus, TaskStatus } from '@/types';
import { deductResources, hasEnoughResources } from './resourceManager';
import { v4 as uuidv4 } from 'uuid';
import type { Resources } from '@/types';

export function calculateBuildTime(
  phase: { complexity: number; requiredWorkers: number },
  availableWorkers: number
): number {
  const effectiveWorkers = Math.max(1, Math.min(availableWorkers, phase.requiredWorkers));
  const workerEfficiency = effectiveWorkers / phase.requiredWorkers;
  const baseSeconds = phase.complexity * 15;
  return Math.ceil(baseSeconds / workerEfficiency);
}

export function canStartNextPhase(
  phases: BuildPhase[],
  phaseIndex: number,
  resources: Resources,
  workers: WorkerAssignment
): { canStart: boolean; reason?: string } {
  const phase = phases[phaseIndex];
  if (!phase) return { canStart: false, reason: '阶段不存在' };

  if (phase.status === 'completed') {
    return { canStart: false, reason: '阶段已完成' };
  }
  if (phase.status === 'locked') {
    return { canStart: false, reason: '前置阶段未完成' };
  }
  if (phase.status === 'building') {
    return { canStart: false, reason: '阶段正在建造中' };
  }

  if (!hasEnoughResources(resources, phase.requiredResources)) {
    return { canStart: false, reason: '资源不足' };
  }

  if (workers.idle < phase.requiredWorkers) {
    return { canStart: false, reason: `需要${phase.requiredWorkers}名空闲工人` };
  }

  return { canStart: true };
}

export function checkPhasePrerequisites(
  phases: BuildPhase[],
  currentIndex: number
): PhaseStatus {
  if (currentIndex === 0) return 'available';
  const prevPhase = phases[currentIndex - 1];
  if (prevPhase && prevPhase.status === 'completed') return 'available';
  return 'locked';
}

export function createBuildTask(phase: BuildPhase, workers: WorkerAssignment): BuildTask {
  const estimatedTime = calculateBuildTime(
    { complexity: phase.complexity, requiredWorkers: phase.requiredWorkers },
    workers.idle
  );

  return {
    taskId: uuidv4(),
    phaseId: phase.id,
    phaseName: phase.name,
    phaseIndex: phase.index,
    startTime: null,
    estimatedTime,
    remainingSeconds: estimatedTime,
    progress: 0,
    status: 'pending' as TaskStatus,
  };
}

export function prepareBuildStart(
  resources: Resources,
  phase: BuildPhase
): { success: boolean; updatedResources: Resources } {
  return deductResources(resources, phase.requiredResources);
}

export function advanceBuildQueue(
  queue: BuildTask[],
  deltaSeconds: number,
  onTaskComplete: (task: BuildTask) => void
): BuildTask[] {
  if (queue.length === 0) return queue;

  const newQueue = queue.map((t) => ({ ...t }));
  let firstTask = newQueue[0];

  if (firstTask.status === 'pending') {
    firstTask.status = 'building';
    firstTask.startTime = Date.now();
  }

  if (firstTask.status === 'building') {
    firstTask.remainingSeconds = Math.max(0, firstTask.remainingSeconds - deltaSeconds);
    firstTask.progress = Math.min(
      100,
      ((firstTask.estimatedTime - firstTask.remainingSeconds) / firstTask.estimatedTime) * 100
    );

    if (firstTask.remainingSeconds <= 0) {
      firstTask.progress = 100;
      firstTask.status = 'done';
      onTaskComplete(firstTask);
      newQueue.shift();
    }
  }

  return newQueue;
}

export function reorderTasks(
  tasks: BuildTask[],
  fromIndex: number,
  toIndex: number
): BuildTask[] {
  if (fromIndex < 0 || fromIndex >= tasks.length) return tasks;
  if (toIndex < 0 || toIndex >= tasks.length) return tasks;
  if (fromIndex === toIndex) return tasks;

  const result = [...tasks];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result;
}

export function prioritizeTask(tasks: BuildTask[], taskId: string): BuildTask[] {
  const taskIndex = tasks.findIndex((t) => t.taskId === taskId);
  if (taskIndex <= 0) return tasks;

  const result = [...tasks];
  const [moved] = result.splice(taskIndex, 1);
  result.unshift(moved);
  return result;
}

export function cancelTask(tasks: BuildTask[], taskId: string): BuildTask[] {
  return tasks.filter((t) => t.taskId !== taskId);
}

export function updatePhaseStatuses(
  phases: BuildPhase[],
  completedPhaseId: string
): BuildPhase[] {
  return phases.map((phase, index) => {
    if (phase.id === completedPhaseId) {
      return { ...phase, status: 'completed' as PhaseStatus };
    }
    if (phase.status === 'locked' && index > 0) {
      const prevPhase = phases[index - 1];
      const prevCompleted =
        prevPhase.id === completedPhaseId || prevPhase.status === 'completed';
      if (prevCompleted) {
        return { ...phase, status: 'available' as PhaseStatus };
      }
    }
    return phase;
  });
}

export function isPhaseInQueue(queue: BuildTask[], phaseId: string): boolean {
  return queue.some((t) => t.phaseId === phaseId);
}
