import { v4 as uuidv4 } from 'uuid';

export interface CareSchedule {
  wateringPeriods: number[];
  fertilizingPeriods: number[];
}

export interface Plant {
  id: string;
  name: string;
  species: string;
  purchaseDate: string;
  avatar: string;
  createdAt: string;
  lastWateredAt: string | null;
  lastFertilizedAt: string | null;
  schedule: CareSchedule;
}

export type CareLogType = 'water' | 'fertilize' | 'repot' | 'light';

export interface CareLog {
  id: string;
  plantId: string;
  type: CareLogType;
  timestamp: string;
  note?: string;
}

export type Severity = 'low' | 'medium' | 'high';

export interface DiseaseRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RecognitionResult {
  id: string;
  plantId: string;
  disease: string;
  severity: Severity;
  severityLabel: string;
  recommendation: string;
  imageUrl: string;
  diseaseRegions: DiseaseRegion[];
  timestamp: string;
}

export interface StatsOverview {
  needWatering: number;
  recentDiseases: number;
  totalPlants: number;
}

const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23c8e6c9"/><text x="50" y="65" text-anchor="middle" font-size="50">🌱</text></svg>';

class Storage {
  private plants: Plant[] = [];
  private careLogs: CareLog[] = [];
  private recognitions: RecognitionResult[] = [];

  constructor() {
    this.seedData();
  }

  private seedData(): void {
    const now = new Date();
    const plant1Id = uuidv4();
    const plant2Id = uuidv4();
    const plant3Id = uuidv4();

    this.plants = [
      {
        id: plant1Id,
        name: '小绿',
        species: '绿萝',
        purchaseDate: '2025-09-15',
        avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23a5d6a7"/><text x="50" y="65" text-anchor="middle" font-size="50">🌿</text></svg>',
        createdAt: '2025-09-15T10:00:00Z',
        lastWateredAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        lastFertilizedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        schedule: { wateringPeriods: [3, 5], fertilizingPeriods: [14, 21] }
      },
      {
        id: plant2Id,
        name: '多多',
        species: '多肉植物',
        purchaseDate: '2025-11-20',
        avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23c5e1a5"/><text x="50" y="65" text-anchor="middle" font-size="50">🌵</text></svg>',
        createdAt: '2025-11-20T14:00:00Z',
        lastWateredAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        lastFertilizedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        schedule: { wateringPeriods: [7, 10], fertilizingPeriods: [30, 45] }
      },
      {
        id: plant3Id,
        name: '玫瑰',
        species: '月季花',
        purchaseDate: '2026-01-10',
        avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23ffcdd2"/><text x="50" y="65" text-anchor="middle" font-size="50">🌹</text></svg>',
        createdAt: '2026-01-10T09:00:00Z',
        lastWateredAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        lastFertilizedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        schedule: { wateringPeriods: [2, 3], fertilizingPeriods: [10, 15] }
      }
    ];

    this.careLogs = [
      { id: uuidv4(), plantId: plant1Id, type: 'water', timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), note: '浇了约200ml水' },
      { id: uuidv4(), plantId: plant1Id, type: 'light', timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: uuidv4(), plantId: plant1Id, type: 'fertilize', timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), note: '使用了液体复合肥' },
      { id: uuidv4(), plantId: plant2Id, type: 'water', timestamp: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString() },
      { id: uuidv4(), plantId: plant2Id, type: 'repot', timestamp: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(), note: '换了更大的花盆' },
      { id: uuidv4(), plantId: plant3Id, type: 'water', timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { id: uuidv4(), plantId: plant3Id, type: 'fertilize', timestamp: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString() }
    ];

    this.recognitions = [
      {
        id: uuidv4(),
        plantId: plant1Id,
        disease: '叶斑病',
        severity: 'low',
        severityLabel: '低',
        recommendation: '## 处理建议\n\n1. **及时修剪**：将已感染的叶片剪除并销毁，防止病菌扩散\n2. **保持通风**：确保植株周围空气流通，避免湿度过高\n3. **控制浇水**：避免叶片积水，浇水时直接浇灌根部\n4. **药物治疗**：可喷施多菌灵或百菌清800倍液，每周1次，连续2-3次',
        imageUrl: DEFAULT_AVATAR,
        diseaseRegions: [{ x: 30, y: 40, width: 25, height: 20 }],
        timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  getPlants(): Plant[] {
    return [...this.plants];
  }

  getPlant(id: string): Plant | undefined {
    return this.plants.find(p => p.id === id);
  }

  createPlant(data: Omit<Plant, 'id' | 'createdAt' | 'lastWateredAt' | 'lastFertilizedAt' | 'schedule'> & Partial<Pick<Plant, 'schedule'>>): Plant {
    const plant: Plant = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      lastWateredAt: null,
      lastFertilizedAt: null,
      schedule: data.schedule || { wateringPeriods: [3, 5], fertilizingPeriods: [14, 21] },
      ...data
    };
    this.plants.push(plant);
    return plant;
  }

  updatePlant(id: string, data: Partial<Plant>): Plant | undefined {
    const idx = this.plants.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    this.plants[idx] = { ...this.plants[idx], ...data };
    return this.plants[idx];
  }

  deletePlant(id: string): boolean {
    const idx = this.plants.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.plants.splice(idx, 1);
    this.careLogs = this.careLogs.filter(l => l.plantId !== id);
    this.recognitions = this.recognitions.filter(r => r.plantId !== id);
    return true;
  }

  updateSchedule(plantId: string, schedule: CareSchedule): Plant | undefined {
    return this.updatePlant(plantId, { schedule });
  }

  getCareLogs(plantId: string): CareLog[] {
    return this.careLogs
      .filter(l => l.plantId === plantId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  addCareLog(plantId: string, type: CareLogType, note?: string): CareLog | undefined {
    const plant = this.getPlant(plantId);
    if (!plant) return undefined;

    const log: CareLog = {
      id: uuidv4(),
      plantId,
      type,
      timestamp: new Date().toISOString(),
      note
    };
    this.careLogs.push(log);

    if (type === 'water') {
      this.updatePlant(plantId, { lastWateredAt: log.timestamp });
    } else if (type === 'fertilize') {
      this.updatePlant(plantId, { lastFertilizedAt: log.timestamp });
    }

    return log;
  }

  getRecognitions(plantId: string): RecognitionResult[] {
    return this.recognitions
      .filter(r => r.plantId === plantId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getRecognition(id: string): RecognitionResult | undefined {
    return this.recognitions.find(r => r.id === id);
  }

  addRecognition(
    plantId: string,
    disease: string,
    severity: Severity,
    severityLabel: string,
    recommendation: string,
    imageUrl: string,
    diseaseRegions: DiseaseRegion[]
  ): RecognitionResult | undefined {
    const plant = this.getPlant(plantId);
    if (!plant) return undefined;

    const result: RecognitionResult = {
      id: uuidv4(),
      plantId,
      disease,
      severity,
      severityLabel,
      recommendation,
      imageUrl,
      diseaseRegions,
      timestamp: new Date().toISOString()
    };
    this.recognitions.push(result);
    return result;
  }

  getStatsOverview(): StatsOverview {
    const now = new Date();
    let needWatering = 0;

    for (const plant of this.plants) {
      const lastWatered = plant.lastWateredAt ? new Date(plant.lastWateredAt) : new Date(plant.createdAt);
      const daysSinceWatered = Math.floor((now.getTime() - lastWatered.getTime()) / (24 * 60 * 60 * 1000));
      const minPeriod = Math.min(...plant.schedule.wateringPeriods);
      if (daysSinceWatered >= minPeriod) {
        needWatering++;
      }
    }

    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentDiseases = this.recognitions.filter(r => new Date(r.timestamp) >= weekAgo).length;

    return {
      needWatering,
      recentDiseases,
      totalPlants: this.plants.length
    };
  }

  getDaysWaterNeeded(plantId: string): number {
    const plant = this.getPlant(plantId);
    if (!plant) return 0;
    const now = new Date();
    const lastWatered = plant.lastWateredAt ? new Date(plant.lastWateredAt) : new Date(plant.createdAt);
    const daysSinceWatered = Math.floor((now.getTime() - lastWatered.getTime()) / (24 * 60 * 60 * 1000));
    const minPeriod = Math.min(...plant.schedule.wateringPeriods);
    return Math.max(0, minPeriod - daysSinceWatered);
  }

  getDefaultAvatar(): string {
    return DEFAULT_AVATAR;
  }
}

export const storage = new Storage();
