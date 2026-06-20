import { create } from 'zustand';
import type {
  ItemFragment,
  Equipment,
  KeyInventory,
  Rarity,
  ChestOpenResult,
} from '../types';
import {
  addFragments,
  canCraft,
  craftEquipment,
  consumeKeys,
  addKeys,
  hasEnoughKeys,
  getTotalFragmentCount,
  checkAchievement,
  getRandomKeyRarity,
  addEquipment,
} from '../modules/inventory/inventoryManager';

interface GameState {
  keys: KeyInventory;
  fragments: ItemFragment[];
  equipment: Equipment[];
  totalFragmentsCollected: number;
  lastAchievementCount: number;
  isOpening: boolean;
  chestResult: ChestOpenResult | null;
  showInsufficientKeys: Rarity | null;
  showAchievementPopup: { rarity: Rarity; amount: number } | null;
  showCelebrationBanner: Equipment | null;
  setIsOpening: (opening: boolean) => void;
  setChestResult: (result: ChestOpenResult | null) => void;
  setShowInsufficientKeys: (rarity: Rarity | null) => void;
  setShowAchievementPopup: (data: { rarity: Rarity; amount: number } | null) => void;
  setShowCelebrationBanner: (equipment: Equipment | null) => void;
  openChest: (rarity: Rarity) => boolean;
  addChestItems: (items: ItemFragment[]) => void;
  tryCraft: (fragmentId: string) => Equipment | null;
  checkAndGrantAchievements: () => { rarity: Rarity; amount: number } | null;
}

const initialKeys: KeyInventory = {
  common: 5,
  rare: 0,
  epic: 0,
  legendary: 0,
};

export const useGameStore = create<GameState>((set, get) => ({
  keys: initialKeys,
  fragments: [],
  equipment: [],
  totalFragmentsCollected: 0,
  lastAchievementCount: 0,
  isOpening: false,
  chestResult: null,
  showInsufficientKeys: null,
  showAchievementPopup: null,
  showCelebrationBanner: null,

  setIsOpening: (opening) => set({ isOpening: opening }),
  setChestResult: (result) => set({ chestResult: result }),
  setShowInsufficientKeys: (rarity) => set({ showInsufficientKeys: rarity }),
  setShowAchievementPopup: (data) => set({ showAchievementPopup: data }),
  setShowCelebrationBanner: (equipment) => set({ showCelebrationBanner: equipment }),

  openChest: (rarity) => {
    const state = get();
    const keyCost = { common: 1, rare: 3, epic: 7, legendary: 15 }[rarity];

    if (!hasEnoughKeys(state.keys, rarity, keyCost)) {
      set({ showInsufficientKeys: rarity });
      return false;
    }

    set({
      keys: consumeKeys(state.keys, rarity, keyCost),
      isOpening: true,
    });
    return true;
  },

  addChestItems: (items) => {
    const state = get();
    const newFragments = addFragments(state.fragments, items);
    const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const newTotal = state.totalFragmentsCollected + itemsCount;

    set({
      fragments: newFragments,
      totalFragmentsCollected: newTotal,
    });
  },

  tryCraft: (fragmentId) => {
    const state = get();
    const fragment = state.fragments.find((f) => f.id === fragmentId);

    if (!fragment || !canCraft(fragment)) {
      return null;
    }

    const { equipment, remainingFragment } = craftEquipment(fragment);

    let newFragments: ItemFragment[];
    if (remainingFragment) {
      newFragments = state.fragments.map((f) =>
        f.id === fragmentId ? remainingFragment : f,
      );
    } else {
      newFragments = state.fragments.filter((f) => f.id !== fragmentId);
    }

    set({
      fragments: newFragments,
      equipment: addEquipment(state.equipment, equipment),
      showCelebrationBanner: equipment,
    });

    return equipment;
  },

  checkAndGrantAchievements: () => {
    const state = get();
    const { achieved, rewards } = checkAchievement(
      state.totalFragmentsCollected,
      state.lastAchievementCount,
    );

    if (!achieved) {
      return null;
    }

    let newKeys = { ...state.keys };
    let totalReward = 0;
    let rarity: Rarity = 'common';

    for (let i = 0; i < rewards; i++) {
      const randomRarity = getRandomKeyRarity();
      rarity = randomRarity;
      newKeys = addKeys(newKeys, randomRarity, 1);
      totalReward++;
    }

    const newLastCount = state.lastAchievementCount + rewards * 10;

    set({
      keys: newKeys,
      lastAchievementCount: newLastCount,
      showAchievementPopup: { rarity, amount: totalReward },
    });

    return { rarity, amount: totalReward };
  },
}));
