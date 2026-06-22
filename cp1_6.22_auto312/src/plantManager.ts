import { v4 as uuidv4 } from 'uuid';
import type { Plant, PlantCategory } from './types';

const STORAGE_KEY = 'plantData';

let plants: Plant[] = [];

const loadPlants = (): Plant[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      plants = Array.isArray(data.plants) ? data.plants : [];
    }
  } catch {
    plants = [];
  }
  return plants;
};

const savePlants = (): void => {
  const data = {
    plants,
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const getPlants = (): Plant[] => {
  return [...plants];
};

const addPlant = (plantData: {
  name: string;
  category: PlantCategory;
  initialHeight: number;
  initialLeaves: number;
}): Plant => {
  const newPlant: Plant = {
    id: uuidv4(),
    name: plantData.name,
    category: plantData.category,
    initialHeight: plantData.initialHeight,
    initialLeaves: plantData.initialLeaves,
    createdAt: new Date().toISOString(),
    growthRecords: [],
  };
  plants = [newPlant, ...plants];
  savePlants();
  return newPlant;
};

const updatePlant = (id: string, updates: Partial<Plant>): Plant | null => {
  const index = plants.findIndex((p) => p.id === id);
  if (index === -1) return null;
  plants[index] = { ...plants[index], ...updates };
  savePlants();
  return plants[index];
};

const deletePlant = (id: string): boolean => {
  const index = plants.findIndex((p) => p.id === id);
  if (index === -1) return false;
  plants = plants.filter((p) => p.id !== id);
  savePlants();
  return true;
};

const getPlantById = (id: string): Plant | undefined => {
  return plants.find((p) => p.id === id);
};

const exportData = (): string => {
  const data = {
    plants,
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
};

const importData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (!data.plants || !Array.isArray(data.plants)) {
      return false;
    }
    plants = data.plants;
    savePlants();
    return true;
  } catch {
    return false;
  }
};

const addGrowthRecord = (plantId: string, record: Plant['growthRecords'][number]): boolean => {
  const plant = getPlantById(plantId);
  if (!plant) return false;
  plant.growthRecords = [record, ...plant.growthRecords];
  savePlants();
  return true;
};

loadPlants();

export {
  getPlants,
  addPlant,
  updatePlant,
  deletePlant,
  getPlantById,
  savePlants,
  loadPlants,
  exportData,
  importData,
  addGrowthRecord,
};
