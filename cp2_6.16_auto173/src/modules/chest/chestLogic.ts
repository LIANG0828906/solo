import { v4 as uuidv4 } from 'uuid';
import type {
  Rarity,
  EquipmentSlot,
  ChestConfig,
  DropRates,
  ItemFragment,
  ChestOpenResult,
} from '../../types';

const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary'];

export const CHEST_CONFIGS: Record<Rarity, ChestConfig> = {
  common: {
    rarity: 'common',
    name: '普通宝箱',
    keyCost: 1,
    color: '#7F8C8D',
    itemCount: 3,
  },
  rare: {
    rarity: 'rare',
    name: '稀有宝箱',
    keyCost: 3,
    color: '#2980B9',
    itemCount: 4,
  },
  epic: {
    rarity: 'epic',
    name: '史诗宝箱',
    keyCost: 7,
    color: '#8E44AD',
    itemCount: 5,
  },
  legendary: {
    rarity: 'legendary',
    name: '传说宝箱',
    keyCost: 15,
    color: '#F39C12',
    itemCount: 6,
  },
};

const SET_NAMES: Record<Rarity, string[]> = {
  common: ['新兵套装', '探索者套装'],
  rare: ['勇士套装', '猎手套装'],
  epic: ['宗师套装', '虚空套装'],
  legendary: ['神话套装', '永恒套装'],
};

const FRAGMENT_NAMES: Record<EquipmentSlot, string> = {
  weapon: '武器碎片',
  armor: '护甲碎片',
  accessory: '饰品碎片',
};

const EQUIPMENT_NAMES: Record<EquipmentSlot, string> = {
  weapon: '之刃',
  armor: '之甲',
  accessory: '之饰',
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function calculateDropRates(chestRarity: Rarity): DropRates {
  const baseRates: Record<Rarity, DropRates> = {
    common: { common: 0.7, rare: 0.25, epic: 0.04, legendary: 0.01 },
    rare: { common: 0.4, rare: 0.4, epic: 0.15, legendary: 0.05 },
    epic: { common: 0.15, rare: 0.35, epic: 0.35, legendary: 0.15 },
    legendary: { common: 0.05, rare: 0.2, epic: 0.4, legendary: 0.35 },
  };
  return baseRates[chestRarity];
}

export function rollRarity(dropRates: DropRates, randomFn: () => Math.random): Rarity {
  const roll = randomFn();
  let cumulative = 0;

  for (const rarity of RARITY_ORDER) {
    cumulative += dropRates[rarity];
    if (roll < cumulative) {
      return rarity;
    }
  }

  return 'common';
}

function randomSlot(randomFn: () => number): EquipmentSlot {
  const slots: EquipmentSlot[] = ['weapon', 'armor', 'accessory'];
  return slots[Math.floor(randomFn() * slots.length)];
}

function getRequiredForCraft(rarity: Rarity): number {
  const requirements: Record<Rarity, number> = {
    common: 3,
    rare: 5,
    epic: 8,
    legendary: 12,
  };
  return requirements[rarity];
}

function generateFragmentId(slot: EquipmentSlot, rarity: Rarity, setName: string): string {
  return `${rarity}-${setName}-${slot}`;
}

export function generateFragment(
  slot: EquipmentSlot,
  rarity: Rarity,
  randomFn: () => number,
): ItemFragment {
  const sets = SET_NAMES[rarity];
  const setName = sets[Math.floor(randomFn() * sets.length)];
  const requiredForCraft = getRequiredForCraft(rarity);

  return {
    id: generateFragmentId(slot, rarity, setName),
    name: `${setName}${FRAGMENT_NAMES[slot]}`,
    slot,
    rarity,
    setName,
    quantity: 1,
    requiredForCraft,
  };
}

export function generateChestResult(
  chestRarity: Rarity,
  seed?: number,
): ChestOpenResult {
  const actualSeed = seed ?? Math.floor(Math.random() * 100000);
  const randomFn = seededRandom(actualSeed);
  const config = CHEST_CONFIGS[chestRarity];
  const dropRates = calculateDropRates(chestRarity);

  const items: ItemFragment[] = [];
  let highestRarity: Rarity = 'common';

  for (let i = 0; i < config.itemCount; i++) {
    const rarity = rollRarity(dropRates, randomFn);
    const slot = randomSlot(randomFn);
    const fragment = generateFragment(slot, rarity, randomFn);
    items.push(fragment);

    if (RARITY_ORDER.indexOf(rarity) > RARITY_ORDER.indexOf(highestRarity)) {
      highestRarity = rarity;
    }
  }

  return {
    items,
    seed: actualSeed,
    highestRarity,
  };
}

export function getEquipmentName(setName: string, slot: EquipmentSlot): string {
  return `${setName}${EQUIPMENT_NAMES[slot]}`;
}

export function compareRarity(a: Rarity, b: Rarity): number {
  return RARITY_ORDER.indexOf(a) - RARITY_ORDER.indexOf(b);
}
