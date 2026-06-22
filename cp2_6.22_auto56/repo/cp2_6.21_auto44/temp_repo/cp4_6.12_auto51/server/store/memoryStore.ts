import { v4 as uuidv4 } from 'uuid';
import type { Plant, PlantLog, LogType } from '../types/index.js';

class MemoryStore {
  private plants: Map<string, Plant> = new Map();

  constructor() {
    this.initMockData();
  }

  private initMockData(): void {
    const now = new Date();
    const mockPlants: Array<Omit<Plant, 'id' | 'createdAt' | 'nextWaterAt' | 'logs'>> = [
      {
        name: '绿萝',
        species: 'Epipremnum aureum',
        potDiameter: 18,
        location: '客厅北墙',
        waterInterval: 5,
        fertilizeInterval: 30,
        photoUrl: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop',
      },
      {
        name: '虎皮兰',
        species: 'Sansevieria trifasciata',
        potDiameter: 22,
        location: '玄关柜',
        waterInterval: 14,
        fertilizeInterval: 60,
        photoUrl: 'https://images.unsplash.com/photo-1593482892290-f54927ae1bb6?w=400&h=400&fit=crop',
      },
      {
        name: '多肉',
        species: 'Echeveria elegans',
        potDiameter: 12,
        location: '阳台窗台',
        waterInterval: 10,
        fertilizeInterval: 45,
        photoUrl: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop',
      },
      {
        name: '龟背竹',
        species: 'Monstera deliciosa',
        potDiameter: 28,
        location: '书房角落',
        waterInterval: 7,
        fertilizeInterval: 30,
        photoUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&h=400&fit=crop',
      },
      {
        name: '吊兰',
        species: 'Chlorophytum comosum',
        potDiameter: 15,
        location: '厨房窗台',
        waterInterval: 4,
        fertilizeInterval: 25,
        photoUrl: 'https://images.unsplash.com/photo-1597055181321-e9b9a4e67b32?w=400&h=400&fit=crop',
      },
      {
        name: '发财树',
        species: 'Pachira aquatica',
        potDiameter: 30,
        location: '办公室门口',
        waterInterval: 12,
        fertilizeInterval: 50,
        photoUrl: 'https://images.unsplash.com/photo-1597055181321-e9b9a4e67b32?w=400&h=400&fit=crop',
      },
    ];

    mockPlants.forEach((mock, index) => {
      const createdAt = new Date(now.getTime() - (30 + index * 2) * 24 * 60 * 60 * 1000);
      const plantId = uuidv4();

      const logs: PlantLog[] = this.generateMockLogs(
        mock.waterInterval,
        mock.fertilizeInterval,
        createdAt,
        now
      );

      const waterLogs = logs.filter((l) => l.type === 'water');
      const fertilizeLogs = logs.filter((l) => l.type === 'fertilize');

      const lastWateredAt = waterLogs.length > 0
        ? waterLogs.reduce((a, b) => (new Date(a.createdAt) > new Date(b.createdAt) ? a : b)).createdAt
        : undefined;

      const lastFertilizedAt = fertilizeLogs.length > 0
        ? fertilizeLogs.reduce((a, b) => (new Date(a.createdAt) > new Date(b.createdAt) ? a : b)).createdAt
        : undefined;

      const nextWaterBase = lastWateredAt ?? createdAt.toISOString();
      const nextWaterAt = new Date(
        new Date(nextWaterBase).getTime() + mock.waterInterval * 24 * 60 * 60 * 1000
      ).toISOString();

      const plant: Plant = {
        id: plantId,
        ...mock,
        createdAt: createdAt.toISOString(),
        lastWateredAt,
        lastFertilizedAt,
        nextWaterAt,
        logs,
      };

      this.plants.set(plantId, plant);
    });
  }

  private generateMockLogs(
    waterInterval: number,
    fertilizeInterval: number,
    plantCreatedAt: Date,
    now: Date
  ): PlantLog[] {
    const logs: PlantLog[] = [];
    const daysDiff = Math.floor(
      (now.getTime() - plantCreatedAt.getTime()) / (24 * 60 * 60 * 1000)
    );

    let lastWaterDay = -waterInterval + Math.floor(Math.random() * 3);
    let lastFertilizeDay = -fertilizeInterval + Math.floor(Math.random() * 10);

    const waterCount = 5 + Math.floor(Math.random() * 4);
    const fertilizeCount = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < waterCount; i++) {
      const dayOffset = lastWaterDay + waterInterval + Math.floor(Math.random() * 3) - 1;
      if (dayOffset >= 0 && dayOffset <= daysDiff) {
        const logDate = new Date(plantCreatedAt.getTime() + dayOffset * 24 * 60 * 60 *