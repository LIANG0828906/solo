import { v4 as uuidv4 } from 'uuid';
import {
  Plant,
  PlantSpecies,
  PlantStage,
  DiaryEntry,
  DiaryEntryType,
  PLANT_GROWTH_CONFIG,
} from './types';

export interface WaterResult {
  success: boolean;
  updatedPlant?: Plant;
  diaryEntry?: DiaryEntry;
  message?: string;
}

export class PlantManager {
  private plants: Map<string, Plant> = new Map();
  private diaries: Map<string, DiaryEntry[]> = new Map();
  private users: Map<string, { id: string; username: string; avatar: string }> = new Map();

  setUsers(users: Map<string, { id: string; username: string; avatar: string }>): void {
    this.users = users;
  }

  createPlant(ownerId: string, species: PlantSpecies, name: string): Plant {
    const id = uuidv4();
    const plant: Plant = {
      id,
      ownerId,
      species,
      name,
      stage: 'seed',
      progress: 0,
      health: {
        water: 50,
        light: 50,
        nutrition: 50,
      },
      createdAt: Date.now(),
      lastWateredBy: [],
      lastFertilizedBy: [],
    };
    this.plants.set(id, plant);
    this.diaries.set(id, []);
    this.addDiaryEntry(id, 'create', `植物「${name}」已种植`);
    return plant;
  }

  getPlant(plantId: string): Plant | undefined {
    return this.plants.get(plantId);
  }

  private isFriend(userId1: string, userId2: string): boolean {
    return true;
  }

  private getTodayStr(): string {
    return new Date().toDateString();
  }

  private hasWateredToday(plant: Plant, userId: string): boolean {
    const today = this.getTodayStr();
    return plant.lastWateredBy.some(
      (entry) => entry.userId === userId && new Date(entry.timestamp).toDateString() === today
    );
  }

  private hasFertilizedToday(plant: Plant, userId: string): boolean {
    const today = this.getTodayStr();
    return plant.lastFertilizedBy.some(
      (entry) => entry.userId === userId && new Date(entry.timestamp).toDateString() === today
    );
  }

  waterPlant(plantId: string, userId: string): WaterResult {
    const plant = this.plants.get(plantId);
    if (!plant) {
      return { success: false, message: '植物不存在' };
    }

    if (plant.ownerId !== userId && !this.isFriend(plant.ownerId, userId)) {
      return { success: false, message: '只能给自己或好友的植物浇水' };
    }

    if (plant.ownerId !== userId && this.hasWateredToday(plant, userId)) {
      return { success: false, message: '今天已经给这个好友的植物浇过水了' };
    }

    plant.health.water = Math.min(100, plant.health.water + 20);
    plant.lastWateredBy.push({ userId, timestamp: Date.now() });

    const user = this.users.get(userId);
    const username = user?.username || '用户';
    const entry = this.addDiaryEntry(plantId, 'water', `${username}给植物浇了水`);

    return { success: true, updatedPlant: plant, diaryEntry: entry };
  }

  fertilizePlant(plantId: string, userId: string): WaterResult {
    const plant = this.plants.get(plantId);
    if (!plant) {
      return { success: false, message: '植物不存在' };
    }

    if (plant.ownerId !== userId && !this.isFriend(plant.ownerId, userId)) {
      return { success: false, message: '只能给自己或好友的植物施肥' };
    }

    if (plant.ownerId !== userId && this.hasFertilizedToday(plant, userId)) {
      return { success: false, message: '今天已经给这个好友的植物施过肥了' };
    }

    plant.health.nutrition = Math.min(100, plant.health.nutrition + 20);
    plant.lastFertilizedBy.push({ userId, timestamp: Date.now() });

    const user = this.users.get(userId);
    const username = user?.username || '用户';
    const entry = this.addDiaryEntry(plantId, 'fertilize', `${username}给植物施了肥`);

    return { success: true, updatedPlant: plant, diaryEntry: entry };
  }

  adjustLight(plantId: string, userId: string): WaterResult {
    const plant = this.plants.get(plantId);
    if (!plant) {
      return { success: false, message: '植物不存在' };
    }

    if (plant.ownerId !== userId) {
      return { success: false, message: '只能调整自己植物的光照' };
    }

    plant.health.light = Math.min(100, plant.health.light + 20);

    const entry = this.addDiaryEntry(plantId, 'light', '调整了植物的光照');

    return { success: true, updatedPlant: plant, diaryEntry: entry };
  }

  private determineStage(progress: number, species: PlantSpecies): PlantStage {
    const config = PLANT_GROWTH_CONFIG[species];
    if (progress >= config.adultToFlowering) return 'flowering';
    if (progress >= config.sproutToAdult) return 'adult';
    if (progress >= config.seedToSprout) return 'sprout';
    return 'seed';
  }

  calculateGrowth(): Array<{ plant: Plant; oldStage: PlantStage; newStage: PlantStage }> {
    const stageChanges: Array<{ plant: Plant; oldStage: PlantStage; newStage: PlantStage }> = [];

    for (const plant of this.plants.values()) {
      const config = PLANT_GROWTH_CONFIG[plant.species];
      const healthAvg = (plant.health.water + plant.health.light + plant.health.nutrition) / 3;
      const healthMultiplier = healthAvg / 100;

      const oldStage = plant.stage;
      plant.progress = Math.min(100, plant.progress + config.baseGrowthRate * healthMultiplier);
      const newStage = this.determineStage(plant.progress, plant.species);

      plant.health.water = Math.max(0, plant.health.water - 2);
      plant.health.light = Math.max(0, plant.health.light - 1);
      plant.health.nutrition = Math.max(0, plant.health.nutrition - 1);

      if (oldStage !== newStage) {
        plant.stage = newStage;
        const stageNames: Record<PlantStage, string> = {
          seed: '种子',
          sprout: '发芽',
          adult: '成熟',
          flowering: '开花',
        };
        this.addDiaryEntry(
          plant.id,
          'stage',
          `植物成长到了${stageNames[newStage]}阶段！`
        );
        stageChanges.push({ plant, oldStage, newStage });
      }
    }

    return stageChanges;
  }

  getPlantsByUser(userId: string): Plant[] {
    const result: Plant[] = [];
    for (const plant of this.plants.values()) {
      if (plant.ownerId === userId) {
        result.push(plant);
      }
    }
    return result.sort((a, b) => b.createdAt - a.createdAt);
  }

  addDiaryEntry(plantId: string, type: DiaryEntryType, description: string): DiaryEntry {
    const entry: DiaryEntry = {
      id: uuidv4(),
      plantId,
      timestamp: Date.now(),
      type,
      description,
    };
    const diary = this.diaries.get(plantId) || [];
    diary.unshift(entry);
    this.diaries.set(plantId, diary);
    return entry;
  }

  getDiary(plantId: string): DiaryEntry[] {
    return this.diaries.get(plantId) || [];
  }
}
