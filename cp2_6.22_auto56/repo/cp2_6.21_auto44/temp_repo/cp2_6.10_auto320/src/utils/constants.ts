export const DAILY_BOX_LIMIT = 5;
export const TOTAL_PLOTS = 8;
export const GROWTH_STAGES = ['seed', 'sprout', 'growing', 'blooming', 'seeding'] as const;
export const STORAGE_KEY = 'cloud_garden_state_v1';
export const REPORT_INTERVAL_DAYS = 7;

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;

export const getCurrentSeason = (): 'spring' | 'summer' | 'autumn' | 'winter' => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
};

export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const generateInstanceId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const RARITY_WEIGHTS: Record<string, number> = {
  common: 60,
  uncommon: 25,
  rare: 12,
  legendary: 3,
};

export const WEATHER_TRIGGER_THRESHOLD = 3;
