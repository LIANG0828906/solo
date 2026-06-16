export type PlantSpecies = 'cactus' | 'sunflower' | 'succulent';

export type PlantStage = 'seed' | 'sprout' | 'adult' | 'flowering';

export enum PlantStatus {
  HEALTHY = 'healthy',
  NEEDS_WATER = 'needs_water',
  NEEDS_LIGHT = 'needs_light',
  NEEDS_NUTRITION = 'needs_nutrition',
  CRITICAL = 'critical',
}

export interface PlantHealth {
  water: number;
  light: number;
  nutrition: number;
}

export interface User {
  id: string;
  username: string;
  password: string;
  avatar: string;
  friends: string[];
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
  lastWateredBy: Array<{ userId: string; username: string; timestamp: number }>;
  lastFertilizedBy: Array<{ userId: string; username: string; timestamp: number }>;
  lastHelpers: Array<{ userId: string; username: string; avatar: string; timestamp: number }>;
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
  plantId?: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar: string;
  totalScore: number;
  recentPlants: Plant[];
  previousRank?: number;
}

export type ActionType = 'water' | 'fertilize' | 'light' | null;

export interface WSMessage {
  type: 'subscribe' | 'unsubscribe' | 'heartbeat' | 'plants_update' | 'notification' | 'leaderboard';
  userId?: string;
  targetUserId?: string;
  payload?: unknown;
}
