import { create } from 'zustand';
import {
  ChestType,
  OpenMethod,
  Fragment,
  Inscription,
  OpenResult,
  HistoryRecord,
  ElementType,
  treasureApi,
} from '../api/treasureApi';

interface PlayerStats {
  hp: number;
  reputation: number;
  totalOpens: number;
  successCount: number;
}

interface GameState {
  selectedChest: ChestType | null;
  selectedMethod: OpenMethod | null;
  isOpening: boolean;
  openResult: OpenResult | null;
  playerStats: PlayerStats;
  fragments: Record<string, Fragment>;
  inscriptions: Inscription[];
  inscriptionSlots: (Inscription | null)[];
  history: HistoryRecord[];

  selectChest: (chest: ChestType) => void;
  selectMethod: (method: OpenMethod) => void;
  openChest: () => Promise<void>;
  addFragments: (newFragments: Array<{ element: string; count: number }>) => void;
  synthesize: (element: ElementType) => boolean;
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

const INITIAL_SLOTS: (Inscription | null)[] = [null, null, null];

const ELEMENT_INFO: Record<ElementType, { name: string; color: string }> = {
  fire: { name: '火焰碎片', color: '#ff4444' },
  ice: { name: '寒冰碎片', color: '#44aaff' },
  thunder: { name: '雷电碎片', color: '#ffcc00' },
  shadow: { name: '暗影碎片', color: '#8844aa' },
  holy: { name: '圣光碎片', color: '#ffffff' },
};

const createFragment = (element: ElementType, count: number = 0): Fragment => ({
  id: `frag_${element}`,
  element,
  name: ELEMENT_INFO[element].name,
  color: ELEMENT_INFO[element].color,
  count,
});

const createInscription = (element: ElementType, level: number = 1): Inscription => {
  const info = ELEMENT_INFO[element];
  const inscriptionNames: Record<ElementType, string> = {
    fire: '炎狱铭文',
    ice: '霜寒铭文',
    thunder: '雷霆铭文',
    shadow: '暗渊铭文',
    holy: '圣辉铭文',
  };
  const baseEffects = (): Inscription['effects'] => {
    switch (element) {
      case 'fire':
        return { success_boost: 5 * level, fragment_bonus: 10 * level };
      case 'ice':
        return { trap_reduction: 8 * level, luck_boost: 3 * level };
      case 'thunder':
        return { success_boost: 3 * level, rare_chance: 5 * level };
      case 'shadow':
        return { trap_reduction: 5 * level, rare_chance: 8 * level };
      case 'holy':
        return { luck_boost: 8 * level, success_boost: 2 * level };
    }
  };
  return {
    id: `insc_${element}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    element,
    name: inscriptionNames[element],
    level,
    color: info.color,
    effects: baseEffects(),
    equippedSlot: null,
  };
};

const buildInitialFragments = (): Record<string, Fragment> => ({
  fire: createFragment('fire'),
  ice: createFragment('ice'),
  thunder: createFragment('thunder'),
  shadow: createFragment('shadow'),
  holy: createFragment('holy'),
});

export const useGameStore = create<GameState>((set, get) => ({
  selectedChest: null,
  selectedMethod: null,
  isOpening: false,
  openResult: null,
  playerStats: { ...INITIAL_PLAYER_STATS },
  fragments: buildInitialFragments(),
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
    const { selectedChest, selectedMethod, inscriptionSlots, playerStats } = get();

    if (!selectedChest || !selectedMethod) {
      return;
    }

    set({ isOpening: true, openResult: null });

    try {
      const inscriptionsParam = inscriptionSlots
        .filter((i): i is Inscription => i !== null)
        .map((i) => ({ element: i.element, level: i.level }));

      const result = await treasureApi.openChest(
        selectedChest,
        selectedMethod,
        inscriptionsParam
      );

      const newHp = Math.max(0, playerStats.hp - result.damage);

      const newFragments = { ...get().fragments };
      result.fragments.forEach((f) => {
        const elem = f.element as ElementType;
        if (newFragments[elem]) {
          newFragments[elem] = { ...newFragments[elem], count: newFragments[elem].count + f.count };
        } else {
          newFragments[elem] = createFragment(elem, f.count);
        }
      });

      const rewardsCount = result.fragments.reduce((sum, f) => sum + f.count, 0) + result.items.length;

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
        playerStats: {
          hp: newHp,
          reputation: playerStats.reputation,
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

  addFragments: (newFragments: Array<{ element: string; count: number }>) => {
    set((state) => {
      const updated = { ...state.fragments };
      newFragments.forEach((f) => {
        const elem = f.element as ElementType;
        if (updated[elem]) {
          updated[elem] = { ...updated[elem], count: updated[elem].count + f.count };
        } else {
          updated[elem] = createFragment(elem, f.count);
        }
      });
      return { fragments: updated };
    });
  },

  synthesize: (element: ElementType): boolean => {
    const { fragments, inscriptions } = get();
    const frag = fragments[element];
    if (!frag || frag.count < 5) {
      return false;
    }

    const newInscription = createInscription(element, 1);

    set((state) => ({
      fragments: {
        ...state.fragments,
        [element]: {
          ...state.fragments[element],
          count: state.fragments[element].count - 5,
        },
      },
      inscriptions: [...state.inscriptions, newInscription],
    }));

    return true;
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
      fragments: buildInitialFragments(),
      inscriptions: [],
      inscriptionSlots: [...INITIAL_SLOTS],
      history: [],
      selectedChest: null,
      selectedMethod: null,
      openResult: null,
    });
  },
}));
