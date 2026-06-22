import { v4 as uuidv4 } from 'uuid';
import type { Pet, PetStats, InteractionType, ItemType } from './types';
import { ITEM_INFO } from './types';

export const createInitialStats = (): PetStats => ({
  hunger: 80,
  happiness: 70,
  cleanliness: 90,
  energy: 85,
});

export const createPet = (name: string, color: string): Pet => ({
  id: uuidv4(),
  name,
  color,
  stats: createInitialStats(),
  isSick: false,
  createdAt: Date.now(),
  lastInteraction: Date.now(),
});

export const clampStat = (value: number): number => Math.max(0, Math.min(100, value));

export const calculateDecay = (stats: PetStats, minutesElapsed: number): PetStats => {
  const decayPer10Min = 5;
  const energyDecayPer5Min = 2;
  
  const periods10 = minutesElapsed / 10;
  const periods5 = minutesElapsed / 5;
  
  return {
    hunger: clampStat(stats.hunger - decayPer10Min * periods10),
    happiness: clampStat(stats.happiness - decayPer10Min * periods10),
    cleanliness: clampStat(stats.cleanliness - decayPer10Min * periods10),
    energy: clampStat(stats.energy - energyDecayPer5Min * periods5),
  };
};

export const interact = (stats: PetStats, type: InteractionType): PetStats => {
  const newStats = { ...stats };
  
  switch (type) {
    case 'feed':
      newStats.hunger = clampStat(stats.hunger + 15);
      newStats.happiness = clampStat(stats.happiness + 3);
      break;
    case 'clean':
      newStats.cleanliness = clampStat(stats.cleanliness + 20);
      newStats.happiness = clampStat(stats.happiness + 2);
      break;
    case 'play':
      newStats.happiness = clampStat(stats.happiness + 18);
      newStats.energy = clampStat(stats.energy - 8);
      newStats.hunger = clampStat(stats.hunger - 3);
      break;
  }
  
  return newStats;
};

export const useItem = (stats: PetStats, itemType: ItemType): PetStats => {
  const item = ITEM_INFO[itemType];
  const newStats = { ...stats };
  newStats[item.stat] = clampStat(stats[item.stat] + item.value);
  return newStats;
};

export const checkSick = (stats: PetStats): boolean => {
  return stats.hunger <= 0 || stats.happiness <= 0 || stats.cleanliness <= 0 || stats.energy <= 0;
};

export const getWarningStats = (stats: PetStats): Array<keyof PetStats> => {
  const warnings: Array<keyof PetStats> = [];
  if (stats.hunger < 20) warnings.push('hunger');
  if (stats.happiness < 20) warnings.push('happiness');
  if (stats.cleanliness < 20) warnings.push('cleanliness');
  if (stats.energy < 20) warnings.push('energy');
  return warnings;
};

export const STAT_NAMES: Record<keyof PetStats, string> = {
  hunger: '饥饿度',
  happiness: '快乐度',
  cleanliness: '清洁度',
  energy: '精力',
};

export const generateUserId = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
