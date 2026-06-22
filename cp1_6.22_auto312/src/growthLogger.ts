import { v4 as uuidv4 } from 'uuid';
import { getPlantById, addGrowthRecord } from './plantManager';
import type { GrowthRecord, EventType, FertilizerType } from './types';

const TWO_HOURS = 2 * 60 * 60 * 1000;

const getRecords = (plantId: string): GrowthRecord[] => {
  const plant = getPlantById(plantId);
  return plant ? [...plant.growthRecords] : [];
};

const addRecord = (
  plantId: string,
  recordData: {
    eventType: EventType;
    timestamp: string;
    height?: number;
    leaves?: number;
    fertilizerType?: FertilizerType;
    note?: string;
  }
): GrowthRecord | null => {
  const plant = getPlantById(plantId);
  if (!plant) return null;

  const newRecord: GrowthRecord = {
    id: uuidv4(),
    plantId,
    eventType: recordData.eventType,
    timestamp: recordData.timestamp,
    height: recordData.height,
    leaves: recordData.leaves,
    fertilizerType: recordData.fertilizerType,
    note: recordData.note,
  };

  const success = addGrowthRecord(plantId, newRecord);
  return success ? newRecord : null;
};

const canWater = (plantId: string): boolean => {
  const lastWatering = getLastWatering(plantId);
  if (!lastWatering) return true;

  const now = Date.now();
  const lastWaterTime = new Date(lastWatering.timestamp).getTime();
  return now - lastWaterTime >= TWO_HOURS;
};

const getLastWatering = (plantId: string): GrowthRecord | null => {
  const records = getRecords(plantId);
  const wateringRecords = records.filter((r) => r.eventType === '浇水');
  return wateringRecords.length > 0 ? wateringRecords[0] : null;
};

const getLastFertilizing = (plantId: string): GrowthRecord | null => {
  const records = getRecords(plantId);
  const fertilizingRecords = records.filter((r) => r.eventType === '施肥');
  return fertilizingRecords.length > 0 ? fertilizingRecords[0] : null;
};

const getCurrentHeight = (plantId: string): number => {
  const plant = getPlantById(plantId);
  if (!plant) return 0;

  const heightRecords = plant.growthRecords
    .filter((r) => r.height !== undefined)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return heightRecords.length > 0 && heightRecords[0].height !== undefined
    ? heightRecords[0].height
    : plant.initialHeight;
};

const getCurrentLeaves = (plantId: string): number => {
  const plant = getPlantById(plantId);
  if (!plant) return 0;

  const leavesRecords = plant.growthRecords
    .filter((r) => r.leaves !== undefined)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return leavesRecords.length > 0 && leavesRecords[0].leaves !== undefined
    ? leavesRecords[0].leaves
    : plant.initialLeaves;
};

export {
  getRecords,
  addRecord,
  canWater,
  getLastWatering,
  getLastFertilizing,
  getCurrentHeight,
  getCurrentLeaves,
};
