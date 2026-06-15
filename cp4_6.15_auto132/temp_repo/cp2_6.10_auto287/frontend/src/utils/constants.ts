import { ElementType, CalculusAttributes } from '@/types';

export const GENERATION: Record<ElementType, ElementType> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
};

export const OVERCOMING: Record<ElementType, ElementType> = {
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
  metal: 'wood',
};

export const ELEMENT_BASE_ATTRIBUTES: Record<ElementType, CalculusAttributes> = {
  wood: {
    hardness: 40,
    sharpness: 30,
    resonance: 70,
    durability: 50,
    flexibility: 80,
  },
  fire: {
    hardness: 30,
    sharpness: 90,
    resonance: 60,
    durability: 20,
    flexibility: 40,
  },
  earth: {
    hardness: 70,
    sharpness: 20,
    resonance: 40,
    durability: 90,
    flexibility: 30,
  },
  metal: {
    hardness: 90,
    sharpness: 85,
    resonance: 50,
    durability: 75,
    flexibility: 20,
  },
  water: {
    hardness: 20,
    sharpness: 50,
    resonance: 80,
    durability: 40,
    flexibility: 90,
  },
};

export const ARTIFACT_TYPES: Record<string, { name: string; icon: string }> = {
  chariot: { name: '战车', icon: '⚔️' },
  farm: { name: '农具', icon: '🌾' },
  instrument: { name: '乐器', icon: '🎵' },
  weapon: { name: '兵器', icon: '🗡️' },
  vessel: { name: '容器', icon: '🏺' },
  unknown: { name: '奇物', icon: '✨' },
};

export const BONUS_EFFECTS: Record<string, string> = {
  'wood-fire': '木火通明',
  'fire-earth': '火土相生',
  'earth-metal': '土生金气',
  'metal-water': '金水相涵',
  'water-wood': '水木清华',
  'wood-earth': '木克土虚',
  'earth-water': '土克水浊',
  'water-fire': '水克火熄',
  'fire-metal': '火克金熔',
  'metal-wood': '金克木伤',
};

export const API_BASE_URL = 'http://localhost:8000';
