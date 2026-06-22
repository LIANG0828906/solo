import { create } from 'zustand';
import type {
  Resources,
  WorkerAssignment,
  BuildPhase,
  BuildTask,
  ResourceType,
  WorkerType,
} from '@/types';
import { BUILD_PHASES } from '@/types';
import {
  calculateResourceProduction,
  addResources,
  dispatchWorker as dispatchWorkerFn,
  recallWorker as recallWorkerFn,
  hireWorkers as hireWorkersFn,
} from '@/modules/resourceManager';
import {
  advanceBuildQueue,
  createBuildTask,
  prepareBuildStart,
  reorderTasks,
  prioritizeTask,
  cancelTask,
  updatePhaseStatuses,
  canStartNextPhase,
  isPhaseInQueue,
} from '@/modules/buildScheduler';

interface GameState {
  resources: Resources;
  workers: WorkerAssignment;
  phases: BuildPhase[];
  buildQueue: BuildTask[];
  currentTick: number;

  tickResources: (deltaSeconds: number) => void;
  collectResource: (type: ResourceType, amount: number) => void;
  getProductionRate: () => Resources;

  dispatchWorker: (type: WorkerType, count: number) => boolean;
  recallWorker: (type: WorkerType, count: number) => boolean;
  hireWorker: (count: number) => boolean;

  addBuildTask: (phaseId: string) => { success: boolean; reason?: string };
  cancelBuildTask: (taskId: string) => void;
  prioritizeBuildTask: (taskId: string) => void;
  reorderBuildTasks: (fromIndex: number, toIndex: number) => void;
  advanceBuildStep: (deltaSeconds: number) => void;
}

const initialPhases: BuildPhase[] = BUILD_PHASES.map((phase, idx) => ({
  ...phase,
  status: idx === 0 ? 'available' : 'locked',
}));

export const useGameStore = create<GameState>((set, get) => ({
  resources: {
    stone: 500,
    wood: 300,
    gold: 100,
    food: 400,
  },
  workers: {
    miners: 2,
    woodcutters: 2,
    goldPanners: 1,
    farmers: 3,
    idle: 5,
    total: 13,
  },
  phases: initialPhases,
  buildQueue: [],
  currentTick: 0,

  tickResources: (deltaSeconds: number) => {
    const state = get();
    const production = calculateResourceProduction(state.workers);
    const gains: Partial<Resources> = {
      stone: production.stone * deltaSeconds,
      wood: production.wood * deltaSeconds,
      gold: production.gold * deltaSeconds,
      food: production.food * deltaSeconds,
    };
    set({
      resources: addResources(state.resources, gains),
      currentTick: state.currentTick + 1,
    });
  },

  collectResource: (type: ResourceType, amount: number) => {
    const state = get();
    set({
      resources: addResources(state.resources, { [type]: amount }),
    });
  },

  getProductionRate: () => {
    return calculateResourceProduction(get().workers);
  },

  dispatchWorker: (type: WorkerType, count: number) => {
    const state = get();
    const result = dispatchWorkerFn(state.workers, type, count);
    if (result.success) {
      set({ workers: result.updated });
    }
    return result.success;
  },

  recallWorker: (type: WorkerType, count: number) => {
    const state = get();
    const result = recallWorkerFn(state.workers, type, count);
    if (result.success) {
      set({ workers: result.updated });
    }
    return result.success;
  },

  hireWorker: (count: number) => {
    const state = get();
    const result = hireWorkersFn(state.workers, state.resources, count);
    if (result.success) {
      set({
        workers: result.updatedWorkers,
        resources: result.updatedResources,
      });
    }
    return result.success;
  },

  addBuildTask: (phaseId: string) => {
    const state = get();
    const phaseIndex = state.phases.findIndex((p) => p.id === phaseId);
    if (phaseIndex === -1) return { success: false, reason: '阶段不存在' };

    const check = canStartNextPhase(state.phases, phaseIndex, state.resources, state.workers);
    if (!check.canStart) {
      return { success: false, reason: check.reason };
    }

    if (isPhaseInQueue(state.buildQueue, phaseId)) {
      return { success: false, reason: '该阶段已在队列中' };
    }

    const phase = state.phases[phaseIndex];
    const prepResult = prepareBuildStart(state.resources, phase);
    if (!prepResult.success) {
      return { success: false, reason: '资源不足' };
    }

    const task = createBuildTask(phase, state.workers);
    const occupiedWorkers = phase.requiredWorkers;
    const updatedWorkers: WorkerAssignment = {
      ...state.workers,
      idle: state.workers.idle - occupiedWorkers,
    };
    const newPhases = state.phases.map((p, i) =>
      i === phaseIndex ? { ...p, status: 'building' as const } : p
    );

    set({
      resources: prepResult.updatedResources,
      buildQueue: [...state.buildQueue, task],
      workers: updatedWorkers,
      phases: newPhases,
    });

    return { success: true };
  },

  cancelBuildTask: (taskId: string) => {
    const state = get();
    const task = state.buildQueue.find((t) => t.taskId === taskId);
    if (!task) return;

    if (task.status === 'building') return;

    const phase = state.phases.find((p) => p.id === task.phaseId);
    const returnedResources = phase?.requiredResources ?? {};

    set({
      buildQueue: cancelTask(state.buildQueue, taskId),
      resources: addResources(state.resources, returnedResources),
      workers: {
        ...state.workers,
        idle: state.workers.idle + (phase?.requiredWorkers ?? 0),
      },
      phases: state.phases.map((p) =>
        p.id === task.phaseId ? { ...p, status: 'available' as const } : p
      ),
    });
  },

  prioritizeBuildTask: (taskId: string) => {
    const state = get();
    set({ buildQueue: prioritizeTask(state.buildQueue, taskId) });
  },

  reorderBuildTasks: (fromIndex: number, toIndex: number) => {
    const state = get();
    set({ buildQueue: reorderTasks(state.buildQueue, fromIndex, toIndex) });
  },

  advanceBuildStep: (deltaSeconds: number) => {
    const state = get();
    if (state.buildQueue.length === 0) return;

    let completedTask: BuildTask | null = null;
    const newQueue = advanceBuildQueue(state.buildQueue, deltaSeconds, (task) => {
      completedTask = task;
    });

    if (completedTask) {
      const completedPhase = state.phases.find((p) => p.id === completedTask!.phaseId);
      const releasedWorkers = completedPhase?.requiredWorkers ?? 0;
      const newPhases = updatePhaseStatuses(state.phases, completedTask.phaseId);

      set({
        buildQueue: newQueue,
        phases: newPhases,
        workers: {
          ...state.workers,
          idle: state.workers.idle + releasedWorkers,
        },
      });
    } else {
      set({ buildQueue: newQueue });
    }
  },
}));
