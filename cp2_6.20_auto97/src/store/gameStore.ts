import { create } from 'zustand';
import {
  ChestType,
  OpenMethod,
  Fragment,
  FragmentCounts,
  Inscription,
  OpenResult,
  HistoryRecord,
  ElementType,
  Rarity,
  treasureApi,
} from '../api/treasureApi';

interface PlayerStats {
  hp: number;
  reputation: number;
  totalOpens: number;
  successCount: number;
}

interface SynthesizeResult {
  success: boolean;
  inscription?: Inscription;
  error?: string;
  element?: ElementType;
}

interface GameState {
  selectedChest: ChestType | null;
  selectedMethod: OpenMethod | null;
  isOpening: boolean;
  openResult: OpenResult | null;
  playerStats: PlayerStats;
  fragments: FragmentCounts;
  inscriptions: Inscription[];
  inscriptionSlots: (Inscription | null)[];
  history: HistoryRecord[];

  selectChest: (chest: ChestType) => void;
  selectMethod: (method: OpenMethod) => void;
  openChest: () => Promise<void>;
  addFragments: (newFragments: Fragment[]) => void;
  synthesizeInscription: (element: ElementType) => SynthesizeResult;
  equipInscription: (inscriptionId: string, slotIndex: number) => void;
  unequipInscription: (slotIndex: number) => void;
  clearOpenResult: () => void;
  resetPlayer: () => void;
}

const INITIAL_PLAYER_STATS: PlayerStats = {
  hp: 100,
  reputation: 0,
  totalOpens: 0,
  successCount: 0,
};

const INITIAL_FRAGMENTS: FragmentCounts = {
  fire: 0,
  ice: 0,
  thunder: 0,
  shadow: 0,
  holy: 0,
};

const INITIAL_SLOTS: (Inscription | null)[] = [null, null, null];

const RARITY_RANK: Record<Rarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
};

const getRandomRarity = (): Rarity => {
  const rand = Math.random();
  if (rand < 0.05) return 'legendary';
  if (rand < 0.15) return 'epic';
  if (rand < 0.35) return 'rare';
  if (rand < 0.65) return 'uncommon';
  return 'common';
};

const createInscription = (element: ElementType, level: number = 1): Inscription => {
  const inscriptionNames: Record<ElementType, string> = {
    fire: '炎狱铭文',
    ice: '霜寒铭文',
    thunder: '雷霆铭文',
    shadow: '暗渊铭文',
    holy: '圣辉铭文',
  };
  const rarity = getRandomRarity();
  const rarityMultiplier = RARITY_RANK[rarity];

  const effectsMap: Record<ElementType, string> = {
    fire: `提升${5 * level * rarityMultiplier}%开宝箱成功率，增加${10 * level}%碎片掉落`,
    ice: `减少${8 * level}%陷阱伤害，提升${3 * level}%幸运值`,
    thunder: `提升${3 * level}%成功率，增加${5 * level}%稀有物品几率`,
    shadow: `减少${5 * level}%陷阱伤害，增加${8 * level}%稀有物品几率`,
    holy: `提升${8 * level}%幸运值，增加${2 * level}%成功率`,
  };

  return {
    id: `insc_${element}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: element,
    name: inscriptionNames[element],
    rarity,
    level,
    effect: effectsMap[element],
    bonusStats: {
      success_boost: 5 * level * rarityMultiplier,
      fragment_bonus: 10 * level,
      trap_reduction: 8 * level,
      luck_boost: 3 * level,
      rare_chance: 5 * level,
    },
    equippedSlot: null,
  };
};

export const useGameStore = create<GameState>((set, get) => ({
  selectedChest: null,
  selectedMethod: null,
  isOpening: false,
  openResult: null,
  playerStats: { ...INITIAL_PLAYER_STATS },
  fragments: { ...INITIAL_FRAGMENTS },
  inscriptions: [],
  inscriptionSlots: [...INITIAL_SLOTS],
  history: [],

  selectChest: (chest: ChestType) => {
    set({ selectedChest: chest });
  },

  selectMethod: (method: OpenMethod) => {
    set({ selectedMethod: method });
  },

  openChest: async () => {
    const { selectedChest, selectedMethod, inscriptionSlots, playerStats, fragments } = get();

    if (!selectedChest || !selectedMethod) {
      return;
    }

    set({ isOpening: true, openResult: null });

    try {
      const result = await treasureApi.openChest(
        selectedChest,
        selectedMethod,
        inscriptionSlots
      );

      const newHp = Math.max(0, playerStats.hp - result.damageTaken);

      const newFragments: FragmentCounts = { ...fragments };
      result.rewards.fragments.forEach((f) => {
        newFragments[f.type] += f.amount;
      });

      const newInscriptions = [...get().inscriptions, ...result.rewards.inscriptions];

      const rewardsCount =
        result.rewards.fragments.reduce((sum, f) => sum + f.amount, 0) +
        result.rewards.items.length +
        result.rewards.inscriptions.length;

      const historyRecord: HistoryRecord = {
        id: crypto.randomUUID(),
        chestType: selectedChest,
        openMethod: selectedMethod,
        success: result.success,
        timestamp: new Date().toISOString(),
        rewardsCount,
      };

      set((state) => ({
        openResult: result,
        isOpening: false,
        fragments: newFragments,
        inscriptions: newInscriptions,
        playerStats: {
          hp: newHp,
          reputation: playerStats.reputation + result.rewards.reputation,
          totalOpens: playerStats.totalOpens + 1,
          successCount: result.success ? playerStats.successCount + 1 : playerStats.successCount,
        },
        history: [historyRecord, ...state.history].slice(0, 50),
      }));
    } catch (error) {
      set({
        isOpening: false,
        openResult: null,
      });
      throw error;
    }
  },

  addFragments: (newFragments: Fragment[]) => {
    set((state) => {
      const updated: FragmentCounts = { ...state.fragments };
      newFragments.forEach((f) => {
        updated[f.type] += f.amount;
      });
      return { fragments: updated };
    });
  },

  synthesizeInscription: (element: ElementType): SynthesizeResult => {
    const { fragments } = get();
    const currentCount = fragments[element];

    if (currentCount < 5) {
      return {
        success: false,
        error: `碎片不足，当前${currentCount}个，需要5个`,
        element,
      };
    }

    const newInscription = createInscription(element, 1);

    set((state) => ({
      fragments: {
        ...state.fragments,
        [element]: state.fragments[element] - 5,
      },
      inscriptions: [...state.inscriptions, newInscription],
    }));

    return {
      success: true,
      inscription: newInscription,
      element,
    };
  },

  equipInscription: (inscriptionId: string, slotIndex: number) => {
    if (slotIndex < 0 || slotIndex > 2) {
      return;
    }

    set((state) => {
      const inscription = state.inscriptions.find((i) => i.id === inscriptionId);
      if (!inscription) return {};

      const newSlots = [...state.inscriptionSlots];
      const previousInscription = newSlots[slotIndex];

      const newInscriptions = state.inscriptions.map((i) => {
        if (i.id === inscriptionId) {
          return { ...i, equippedSlot: slotIndex };
        }
        if (previousInscription && i.id === previousInscription.id) {
          return { ...i, equippedSlot: null };
        }
        return i;
      });

      if (inscription.equippedSlot !== null) {
        newSlots[inscription.equippedSlot] = null;
      }
      newSlots[slotIndex] = { ...inscription, equippedSlot: slotIndex };

      return {
        inscriptionSlots: newSlots,
        inscriptions: newInscriptions,
      };
    });
  },

  unequipInscription: (slotIndex: number) => {
    if (slotIndex < 0 || slotIndex > 2) {
      return;
    }

    set((state) => {
      const inscription = state.inscriptionSlots[slotIndex];
      if (!inscription) return {};

      const newSlots = [...state.inscriptionSlots];
      newSlots[slotIndex] = null;

      const newInscriptions = state.inscriptions.map((i) =>
        i.id === inscription.id ? { ...i, equippedSlot: null } : i
      );

      return {
        inscriptionSlots: newSlots,
        inscriptions: newInscriptions,
      };
    });
  },

  clearOpenResult: () => {
    set({ openResult: null });
  },

  resetPlayer: () => {
    set({
      playerStats: { ...INITIAL_PLAYER_STATS },
      fragments: { ...INITIAL_FRAGMENTS },
      inscriptions: [],
      inscriptionSlots: [...INITIAL_SLOTS],
      history: [],
      selectedChest: null,
      selectedMethod: null,
      openResult: null,
    });
  },
}));
