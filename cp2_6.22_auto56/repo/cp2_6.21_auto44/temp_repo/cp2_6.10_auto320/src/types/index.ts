export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type GrowthStage = 'seed' | 'sprout' | 'growing' | 'blooming' | 'seeding';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type WeatherEvent = 'spring_rain' | 'summer_thunder' | 'autumn_wind' | 'winter_snow' | null;

export interface Flower {
  id: string;
  name: string;
  season: Season;
  rarity: Rarity;
  emoji: string;
  color: string;
  description: string;
  growthTime: number;
  isMagic: boolean;
}

export interface GardenFlower extends Flower {
  instanceId: string;
  plantedAt: number;
  currentStage: GrowthStage;
  stageProgress: number;
  plotIndex: number;
}

export interface BoxResult {
  success: boolean;
  item: Flower;
  isNew: boolean;
  weatherTriggered: WeatherEvent;
  message: string;
}

export interface WeeklyReport {
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalFlowers: number;
  uniqueSpecies: number;
  rarityDistribution: Record<Rarity, number>;
  seasonDistribution: Record<Season, number>;
  weatherEvents: WeatherEvent[];
  diversityScore: number;
  bloomCount: number;
  topFlowers: Flower[];
  rating: 'S' | 'A' | 'B' | 'C';
}

export interface GameState {
  dailyBoxesUsed: number;
  lastResetDate: string;
  gardenPlots: (GardenFlower | null)[];
  collectedFlowers: Flower[];
  weatherEvent: WeatherEvent;
  currentSeason: Season;
}

export interface StoredState {
  gameState: GameState;
  lastReportDate?: string;
  reportHistory: WeeklyReport[];
  weatherEventHistory: WeatherEvent[];
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: 'explosion' | 'rain' | 'snow' | 'leaf' | 'sparkle';
  rotation?: number;
  rotationSpeed?: number;
}

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  legendary: '#f59e0b',
};

export const RARITY_LABELS: Record<Rarity, string> = {
  common: '普通',
  uncommon: '稀有',
  rare: '珍稀',
  legendary: '传说',
};

export const SEASON_LABELS: Record<Season, string> = {
  spring: '春生',
  summer: '夏长',
  autumn: '秋收',
  winter: '冬藏',
};

export const SEASON_GRADIENTS: Record<Season, string> = {
  spring: 'from-green-50 via-emerald-100 to-teal-200',
  summer: 'from-emerald-100 via-green-200 to-lime-300',
  autumn: 'from-amber-100 via-orange-200 to-yellow-300',
  winter: 'from-sky-100 via-blue-200 to-indigo-200',
};

export const SEASON_COLORS: Record<Season, string> = {
  spring: '#9ae6b4',
  summer: '#38a169',
  autumn: '#d69e2e',
  winter: '#90cdf4',
};

export const STAGE_LABELS: Record<GrowthStage, string> = {
  seed: '播种',
  sprout: '发芽',
  growing: '抽枝',
  blooming: '开花',
  seeding: '结籽',
};
