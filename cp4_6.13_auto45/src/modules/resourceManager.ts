import type {
  Resources,
  ResourceType,
  WorkerAssignment,
  WorkerType,
} from '@/types';
import { RESOURCE_CAP, WORKER_RATES, WORKER_FOOD_COST } from '@/types';

export function calculateResourceProduction(workers: WorkerAssignment): Resources {
  return {
    stone: workers.miners * WORKER_RATES.stone,
    wood: workers.woodcutters * WORKER_RATES.wood,
    gold: workers.goldPanners * WORKER_RATES.gold,
    food: workers.farmers * WORKER_RATES.food,
  };
}

export function getResourceCost(phaseIndex: number, phasesLength: number): Partial<Resources> {
  const multiplier = 1 + (phaseIndex / phasesLength) * 0.5;
  const base: Resources = {
    stone: Math.floor(100 * multiplier),
    wood: Math.floor(50 * multiplier),
    gold: Math.floor(20 * multiplier),
    food: Math.floor(40 * multiplier),
  };
  return base;
}

export function deductResources(
  current: Resources,
  cost: Partial<Resources>
): { success: boolean; remaining: Resources } {
  const remaining: Resources = { ...current };

  for (const key of Object.keys(cost) as ResourceType[]) {
    const needed = cost[key] ?? 0;
    if ((remaining[key] ?? 0) < needed) {
      return { success: false, remaining: current };
    }
  }

  for (const key of Object.keys(cost) as ResourceType[]) {
    const needed = cost[key] ?? 0;
    remaining[key] = (remaining[key] ?? 0) - needed;
  }

  return { success: true, remaining };
}

export function addResources(
  current: Resources,
  gains: Partial<Resources>
): Resources {
  const result: Resources = { ...current };
  for (const key of Object.keys(gains) as ResourceType[]) {
    const gain = gains[key] ?? 0;
    const cap = RESOURCE_CAP[key] ?? Infinity;
    result[key] = Math.min((result[key] ?? 0) + gain, cap);
  }
  return result;
}

export function hasEnoughResources(
  current: Resources,
  required: Partial<Resources>
): boolean {
  for (const key of Object.keys(required) as ResourceType[]) {
    const needed = required[key] ?? 0;
    if ((current[key] ?? 0) < needed) return false;
  }
  return true;
}

export function dispatchWorker(
  workers: WorkerAssignment,
  workerType: WorkerType,
  count: number
): { success: boolean; updated: WorkerAssignment } {
  if (count <= 0) return { success: false, updated: workers };
  if (workers.idle < count) return { success: false, updated: workers };

  const updated: WorkerAssignment = { ...workers };
  updated.idle -= count;

  switch (workerType) {
    case 'miner':
      updated.miners += count;
      break;
    case 'woodcutter':
      updated.woodcutters += count;
      break;
    case 'goldPanner':
      updated.goldPanners += count;
      break;
    case 'farmer':
      updated.farmers += count;
      break;
  }

  return { success: true, updated };
}

export function recallWorker(
  workers: WorkerAssignment,
  workerType: WorkerType,
  count: number
): { success: boolean; updated: WorkerAssignment } {
  if (count <= 0) return { success: false, updated: workers };

  const updated: WorkerAssignment = { ...workers };

  switch (workerType) {
    case 'miner':
      if (updated.miners < count) return { success: false, updated: workers };
      updated.miners -= count;
      break;
    case 'woodcutter':
      if (updated.woodcutters < count) return { success: false, updated: workers };
      updated.woodcutters -= count;
      break;
    case 'goldPanner':
      if (updated.goldPanners < count) return { success: false, updated: workers };
      updated.goldPanners -= count;
      break;
    case 'farmer':
      if (updated.farmers < count) return { success: false, updated: workers };
      updated.farmers -= count;
      break;
  }

  updated.idle += count;
  return { success: true, updated };
}

export function hireWorkers(
  workers: WorkerAssignment,
  resources: Resources,
  count: number
): { success: boolean; updatedWorkers: WorkerAssignment; updatedResources: Resources } {
  if (count <= 0) return { success: false, updatedWorkers: workers, updatedResources: resources };

  const totalCost = WORKER_FOOD_COST * count;
  if (resources.food < totalCost) {
    return { success: false, updatedWorkers: workers, updatedResources: resources };
  }

  const updatedWorkers: WorkerAssignment = {
    ...workers,
    idle: workers.idle + count,
    total: workers.total + count,
  };

  const updatedResources: Resources = {
    ...resources,
    food: resources.food - totalCost,
  };

  return { success: true, updatedWorkers, updatedResources };
}
