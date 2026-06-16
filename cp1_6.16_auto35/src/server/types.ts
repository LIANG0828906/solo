export type PlantSpecies = 'cactus' | 'sunflower' | 'succulent';

export type PlantStage = 'seed' | 'sprout' | 'adult' | 'flowering';

export interface PlantGrowthConfig {
  seedToSprout: number;
  sproutToAdult: number;
  adultToFlowering: number;
  baseGrowthRate: number;
}

export const PLANT_GROWTH_CONFIG: Record<PlantSpecies, PlantGrowthConfig> = {
  cactus: {
    seedToSprout: 20,
    sproutToAdult: 50,
    adultToFlowering: 85,
    baseGrowthRate: 1.5,
  },
  sunflower: {
    seedToSprout: 15,
    sproutToAdult: 45,
    adultToFlowering: 80,
    baseGrowthRate: 2.0,
  },
  succulent: {
    seedToSprout: 25,
    sproutToAdult: 55,
    adultToFlowering: 90,
    baseGrowthRate: 1.2,
  },
};

export interface User {
  id: string;
  username: string;
  password: string;
  avatar: string;
  friends: string[];
}

export interface PlantHealth {
  water: number;
  light: number;
  nutrition: number;
}

export interface Plant {
  id: string;
  ownerId: string;
  species: PlantSpecies;
  name: string;
  stage: PlantStage;
  progress: number;
  health: PlantHealth;
  createdAt: number;
  lastWateredBy: Array<{ userId: string; timestamp: number }>;
  lastFertilizedBy: Array<{ userId: string; timestamp: number }>;
}

export type DiaryEntryType = 'water' | 'fertilize' | 'light' | 'stage' | 'create';

export interface DiaryEntry {
  id: string;
  plantId: string;
  timestamp: number;
  type: DiaryEntryType;
  description: string;
}

export type NotificationType = 'water' | 'fertilize' | 'friend' | 'stage' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  fromUserId: string;
  fromUsername: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar: string;
  totalScore: number;
  recentPlants: Plant[];
}
