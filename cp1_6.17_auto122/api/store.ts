import type { Garden, WaterLog } from '../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

let gardens: Garden[] = [];

export function initGardens(): void {
  gardens = Array.from({ length: 6 }, (_, i) => ({
    id: `garden-${i + 1}`,
    claimed: false,
    waterLogs: [],
    progress: 0,
    harvested: false,
  }));
}

export function getAllGardens(): Garden[] {
  return gardens.map(calcProgress);
}

export function getGardenById(id: string): Garden | undefined {
  const g = gardens.find((g) => g.id === id);
  return g ? calcProgress(g) : undefined;
}

export function claimGarden(
  id: string,
  ownerName: string,
  cropType: Garden['cropType'],
): Garden | undefined {
  const idx = gardens.findIndex((g) => g.id === id);
  if (idx === -1) return undefined;
  const now = Date.now();
  const expectedHarvestAt = now + 14 * 24 * 60 * 60 * 1000;
  gardens[idx] = {
    ...gardens[idx],
    claimed: true,
    ownerName,
    cropType,
    plantedAt: now,
    expectedHarvestAt,
    progress: 0,
    harvested: false,
    waterLogs: [],
  };
  return calcProgress(gardens[idx]);
}

export function addWaterLog(
  id: string,
  amount: number,
): { garden: Garden; log: WaterLog } | undefined {
  const idx = gardens.findIndex((g) => g.id === id);
  if (idx === -1) return undefined;
  const log: WaterLog = {
    id: uuidv4(),
    timestamp: Date.now(),
    amount,
  };
  gardens[idx] = {
    ...gardens[idx],
    waterLogs: [...gardens[idx].waterLogs, log],
  };
  return { garden: calcProgress(gardens[idx]), log };
}

export function harvestGarden(id: string): Garden | undefined {
  const idx = gardens.findIndex((g) => g.id === id);
  if (idx === -1) return undefined;
  gardens[idx] = {
    id: gardens[idx].id,
    claimed: false,
    waterLogs: [],
    progress: 0,
    harvested: false,
  };
  return gardens[idx];
}

export function updateGarden(id: string, patch: Partial<Garden>): Garden | undefined {
  const idx = gardens.findIndex((g) => g.id === id);
  if (idx === -1) return undefined;
  gardens[idx] = { ...gardens[idx], ...patch };
  return calcProgress(gardens[idx]);
}

function calcProgress(garden: Garden): Garden {
  if (!garden.claimed || !garden.plantedAt) {
    return { ...garden, progress: 0 };
  }
  const days = Math.floor((Date.now() - garden.plantedAt) / (7 * 24 * 60 * 60 * 1000)) * 15;
  const waterBonus = garden.waterLogs.length * 5;
  const progress = Math.min(100, days + waterBonus);
  return { ...garden, progress };
}

initGardens();
