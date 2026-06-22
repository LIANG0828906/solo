import { v4 as uuidv4 } from 'uuid';
import type {
  ItemFragment,
  Equipment,
  KeyInventory,
  Rarity,
  InventoryFilter,
} from '../../types';
import { getEquipmentName, compareRarity } from '../chest/chestLogic';

export function addFragment(
  fragments: ItemFragment[],
  newFragment: ItemFragment,
): ItemFragment[] {
  const existingIndex = fragments.findIndex((f) => f.id === newFragment.id);

  if (existingIndex >= 0) {
    const updated = [...fragments];
    updated[existingIndex] = {
      ...updated[existingIndex],
      quantity: updated[existingIndex].quantity + newFragment.quantity,
    };
    return updated;
  }

  return [...fragments, { ...newFragment }];
}

export function addFragments(
  fragments: ItemFragment[],
  newFragments: ItemFragment[],
): ItemFragment[] {
  let result = [...fragments];
  for (const frag of newFragments) {
    result = addFragment(result, frag);
  }
  return result;
}

export function canCraft(fragment: ItemFragment): boolean {
  return fragment.quantity >= fragment.requiredForCraft;
}

export function craftEquipment(fragment: ItemFragment): {
  equipment: Equipment;
  remainingFragment: ItemFragment | null;
} {
  if (!canCraft(fragment)) {
    throw new Error('Not enough fragments to craft');
  }

  const equipment: Equipment = {
    id: `${fragment.id}-eq-${uuidv4()}`,
    name: getEquipmentName(fragment.setName, fragment.slot),
    slot: fragment.slot,
    rarity: fragment.rarity,
    setName: fragment.setName,
  };

  const remainingQuantity = fragment.quantity - fragment.requiredForCraft;

  if (remainingQuantity > 0) {
    return {
      equipment,
      remainingFragment: {
        ...fragment,
        quantity: remainingQuantity,
      },
    };
  }

  return {
    equipment,
    remainingFragment: null,
  };
}

export function filterFragments(
  fragments: ItemFragment[],
  filter: InventoryFilter,
  search: string,
): ItemFragment[] {
  let result = fragments;

  if (filter !== 'all') {
    result = result.filter((f) => f.slot === filter);
  }

  if (search.trim()) {
    const lowerSearch = search.toLowerCase();
    result = result.filter(
      (f) =>
        f.name.toLowerCase().includes(lowerSearch) ||
        f.setName.toLowerCase().includes(lowerSearch),
    );
  }

  return result;
}

export function sortFragments(fragments: ItemFragment[]): ItemFragment[] {
  return [...fragments].sort((a, b) => {
    const rarityCompare = compareRarity(b.rarity, a.rarity);
    if (rarityCompare !== 0) return rarityCompare;

    if (a.setName !== b.setName) return a.setName.localeCompare(b.setName);

    if (a.slot !== b.slot) return a.slot.localeCompare(b.slot);

    return 0;
  });
}

export function consumeKeys(
  keys: KeyInventory,
  rarity: Rarity,
  amount: number,
): KeyInventory {
  if (keys[rarity] < amount) {
    throw new Error('Not enough keys');
  }
  return {
    ...keys,
    [rarity]: keys[rarity] - amount,
  };
}

export function addKeys(
  keys: KeyInventory,
  rarity: Rarity,
  amount: number,
): KeyInventory {
  return {
    ...keys,
    [rarity]: keys[rarity] + amount,
  };
}

export function hasEnoughKeys(
  keys: KeyInventory,
  rarity: Rarity,
  amount: number,
): boolean {
  return keys[rarity] >= amount;
}

export function getTotalFragmentCount(fragments: ItemFragment[]): number {
  return fragments.reduce((sum, f) => sum + f.quantity, 0);
}

export function checkAchievement(
  totalCollected: number,
  lastAchievementCount: number,
): { achieved: boolean; rewards: number } {
  const milestonesAchieved = Math.floor(totalCollected / 10);
  const lastMilestone = Math.floor(lastAchievementCount / 10);
  const rewards = milestonesAchieved - lastMilestone;

  return {
    achieved: rewards > 0,
    rewards,
  };
}

export function getRandomKeyRarity(): Rarity {
  const rarities: Rarity[] = ['common', 'rare', 'epic', 'legendary'];
  const weights = [0.5, 0.3, 0.15, 0.05];
  const roll = Math.random();
  let cumulative = 0;

  for (let i = 0; i < rarities.length; i++) {
    cumulative += weights[i];
    if (roll < cumulative) {
      return rarities[i];
    }
  }

  return 'common';
}

export function addEquipment(
  equipmentList: Equipment[],
  equipment: Equipment,
): Equipment[] {
  return [...equipmentList, equipment];
}

export function getFragmentById(
  fragments: ItemFragment[],
  id: string,
): ItemFragment | undefined {
  return fragments.find((f) => f.id === id);
}
