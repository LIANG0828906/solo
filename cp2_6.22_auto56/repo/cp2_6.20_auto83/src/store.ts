import { create } from 'zustand';

export type WeaponType = 'sword' | 'bow' | 'staff';
export type RuneType = 'fire' | 'ice' | 'thunder' | 'shadow' | 'holy';

export interface Rune {
  type: RuneType;
  level: number;
}

export interface Slot {
  id: number;
  rune: Rune | null;
}

export interface RuneSlot {
  type: RuneType | null;
  level: number;
}

export interface EffectState {
  particleType: RuneType | null;
  successAnimation: boolean;
  failureAnimation: boolean;
}

export interface StoreState {
  weaponType: WeaponType;
  weaponName: string;
  attack: number;
  elementDamage: number;
  critRate: number;
  gold: number;
  upgradeLevel: number;
  upgradeChance: number;
  slots: Slot[];
  animation: 'success' | 'fail' | '';
  runeSlots: RuneSlot[];
  consecutiveFailures: number;
  failurePenaltyCount: number;
  baseAttack: number;
  fireDamage: number;
  iceDamage: number;
  thunderDamage: number;
  shadowDamage: number;
  holyDamage: number;
  effects: EffectState;
  setWeaponType: (type: WeaponType) => void;
  setRune: (slotIndex: number, type: RuneType, level: number) => void;
  setRuneInSlot: (slotIndex: number, rune: Rune) => void;
  removeRuneFromSlot: (slotIndex: number) => void;
  removeRune: (slotIndex: number) => void;
  upgrade: () => { success: boolean; guaranteed: boolean };
}

export const availableRunes: Record<RuneType, Rune[]> = {
  fire: [{ type: 'fire', level: 1 }],
  ice: [{ type: 'ice', level: 1 }],
  thunder: [{ type: 'thunder', level: 1 }],
  shadow: [{ type: 'shadow', level: 1 }],
  holy: [{ type: 'holy', level: 1 }],
};

export const runeMultipliers: Record<RuneType, number> = {
  fire: 1.0,
  ice: 1.0,
  thunder: 1.0,
  shadow: 1.0,
  holy: 1.0,
};

const WEAPON_NAMES: Record<WeaponType, string> = {
  sword: '精钢长剑',
  bow: '猎鹰长弓',
  staff: '奥术法杖',
};

const BASE_ATTACK_MAP: Record<WeaponType, number> = {
  sword: 100,
  bow: 80,
  staff: 70,
};

const UPGRADE_PROBABILITIES: Record<number, number> = {
  0: 1.0,
  1: 0.8,
  2: 0.6,
  3: 0.4,
  4: 0.2,
  5: 0.1,
};

const createEmptySlots = (): RuneSlot[] =>
  Array.from({ length: 5 }, () => ({ type: null, level: 1 }));

const calculateAttributes = (
  weaponType: WeaponType,
  runeSlots: RuneSlot[],
  upgradeLevel: number,
  failurePenaltyCount: number
) => {
  let baseAttack = BASE_ATTACK_MAP[weaponType];
  let fireDamage = 0;
  let iceDamage = 0;
  let thunderDamage = 0;
  let shadowDamage = 0;
  let holyDamage = 0;
  let critRate = 0;

  runeSlots.forEach((slot) => {
    if (slot.type) {
      baseAttack += slot.level * 5;
      critRate += slot.level * 2;
      switch (slot.type) {
        case 'fire':
          fireDamage += slot.level * 15;
          break;
        case 'ice':
          iceDamage += slot.level * 15;
          break;
        case 'thunder':
          thunderDamage += slot.level * 15;
          break;
        case 'shadow':
          shadowDamage += slot.level * 15;
          break;
        case 'holy':
          holyDamage += slot.level * 15;
          break;
      }
    }
  });

  const successMultiplier = upgradeLevel > 0 ? Math.pow(1.1, upgradeLevel) : 1;
  const failPenalty = failurePenaltyCount > 0 ? Math.pow(0.95, failurePenaltyCount) : 1;
  const totalMultiplier = successMultiplier * failPenalty;

  baseAttack = Math.round(baseAttack * totalMultiplier);
  fireDamage = Math.round(fireDamage * totalMultiplier);
  iceDamage = Math.round(iceDamage * totalMultiplier);
  thunderDamage = Math.round(thunderDamage * totalMultiplier);
  shadowDamage = Math.round(shadowDamage * totalMultiplier);
  holyDamage = Math.round(holyDamage * totalMultiplier);
  critRate = Math.round(critRate * 100) / 100;

  return {
    baseAttack,
    fireDamage,
    iceDamage,
    thunderDamage,
    shadowDamage,
    holyDamage,
    critRate,
  };
};

const calculateDerivedStats = (
  weaponType: WeaponType,
  runeSlots: RuneSlot[],
  upgradeLevel: number,
  failurePenaltyCount: number
) => {
  const baseAttrs = calculateAttributes(weaponType, runeSlots, upgradeLevel, failurePenaltyCount);
  const elementDamage =
    baseAttrs.fireDamage +
    baseAttrs.iceDamage +
    baseAttrs.thunderDamage +
    baseAttrs.shadowDamage +
    baseAttrs.holyDamage;
  return {
    ...baseAttrs,
    attack: baseAttrs.baseAttack,
    elementDamage,
    critRate: baseAttrs.critRate,
  };
};

const createEmptySlotsV2 = (): Slot[] =>
  Array.from({ length: 5 }, (_, i) => ({ id: i, rune: null }));

const syncSlots = (slots: Slot[]): RuneSlot[] =>
  slots.map((s) => ({
    type: s.rune?.type || null,
    level: s.rune?.level || 1,
  }));

export const useStore = create<StoreState>((set, get) => {
  const initialAttrs = calculateDerivedStats('sword', createEmptySlots(), 0, 0);
  return {
    weaponType: 'sword',
    weaponName: WEAPON_NAMES['sword'],
    ...initialAttrs,
    gold: 10000,
    upgradeLevel: 0,
    upgradeChance: UPGRADE_PROBABILITIES[0],
    slots: createEmptySlotsV2(),
    animation: '',
    runeSlots: createEmptySlots(),
    consecutiveFailures: 0,
    failurePenaltyCount: 0,
    effects: {
      particleType: null,
      successAnimation: false,
      failureAnimation: false,
    },
    setWeaponType: (type: WeaponType) => {
      const { slots, upgradeLevel, failurePenaltyCount } = get();
      const runeSlots = syncSlots(slots);
      const attrs = calculateDerivedStats(type, runeSlots, upgradeLevel, failurePenaltyCount);
      set({
        weaponType: type,
        weaponName: WEAPON_NAMES[type],
        ...attrs,
      });
    },
    setRune: (slotIndex: number, type: RuneType, level: number) => {
      const { slots, weaponType, upgradeLevel, failurePenaltyCount } = get();
      const newSlots = [...slots];
      newSlots[slotIndex] = { ...newSlots[slotIndex], rune: { type, level: Math.max(1, Math.min(5, level)) } };
      const runeSlots = syncSlots(newSlots);
      const attrs = calculateDerivedStats(weaponType, runeSlots, upgradeLevel, failurePenaltyCount);
      set({
        slots: newSlots,
        runeSlots,
        ...attrs,
        effects: { ...get().effects, particleType: type },
      });
      setTimeout(() => {
        set((state) => ({ effects: { ...state.effects, particleType: null } }));
      }, 800);
    },
    setRuneInSlot: (slotIndex: number, rune: Rune) => {
      const { slots, weaponType, upgradeLevel, failurePenaltyCount } = get();
      const newSlots = [...slots];
      newSlots[slotIndex] = { ...newSlots[slotIndex], rune: { ...rune, level: Math.max(1, Math.min(5, rune.level)) } };
      const runeSlots = syncSlots(newSlots);
      const attrs = calculateDerivedStats(weaponType, runeSlots, upgradeLevel, failurePenaltyCount);
      set({
        slots: newSlots,
        runeSlots,
        ...attrs,
        effects: { ...get().effects, particleType: rune.type },
      });
      setTimeout(() => {
        set((state) => ({ effects: { ...state.effects, particleType: null } }));
      }, 800);
    },
    removeRuneFromSlot: (slotIndex: number) => {
      const { slots, weaponType, upgradeLevel, failurePenaltyCount } = get();
      const newSlots = [...slots];
      newSlots[slotIndex] = { ...newSlots[slotIndex], rune: null };
      const runeSlots = syncSlots(newSlots);
      const attrs = calculateDerivedStats(weaponType, runeSlots, upgradeLevel, failurePenaltyCount);
      set({
        slots: newSlots,
        runeSlots,
        ...attrs,
      });
    },
    removeRune: (slotIndex: number) => {
      const { slots, weaponType, upgradeLevel, failurePenaltyCount } = get();
      const newSlots = [...slots];
      newSlots[slotIndex] = { ...newSlots[slotIndex], rune: null };
      const runeSlots = syncSlots(newSlots);
      const attrs = calculateDerivedStats(weaponType, runeSlots, upgradeLevel, failurePenaltyCount);
      set({
        slots: newSlots,
        runeSlots,
        ...attrs,
      });
    },
    upgrade: () => {
      const state = get();
      if (state.upgradeLevel >= 5) {
        return { success: false, guaranteed: false };
      }

      const guaranteed = state.consecutiveFailures >= 3;
      const probability = guaranteed ? 1 : UPGRADE_PROBABILITIES[state.upgradeLevel];
      const roll = Math.random();
      const success = guaranteed || roll < probability;

      if (success) {
        const newLevel = state.upgradeLevel + 1;
        const runeSlots = syncSlots(state.slots);
        const attrs = calculateDerivedStats(state.weaponType, runeSlots, newLevel, state.failurePenaltyCount);
        const newChance = UPGRADE_PROBABILITIES[Math.min(newLevel, 5)];
        set({
          upgradeLevel: newLevel,
          upgradeChance: newChance,
          consecutiveFailures: 0,
          ...attrs,
          animation: 'success',
          effects: { ...state.effects, successAnimation: true },
        });
        setTimeout(() => {
          set((s) => ({
            animation: '',
            effects: { ...s.effects, successAnimation: false },
          }));
        }, 1000);
        return { success: true, guaranteed };
      } else {
        const newFailures = state.consecutiveFailures + 1;
        let newPenaltyCount = state.failurePenaltyCount;
        let newLevel = state.upgradeLevel;

        if (newFailures >= 3) {
          newLevel = state.upgradeLevel + 1;
          newFailures = 0;
        } else {
          newPenaltyCount = state.failurePenaltyCount + 1;
        }

        const runeSlots = syncSlots(state.slots);
        const attrs = calculateDerivedStats(state.weaponType, runeSlots, newLevel, newPenaltyCount);
        const newChance = UPGRADE_PROBABILITIES[Math.min(newLevel, 5)];
        set({
          upgradeLevel: newLevel,
          upgradeChance: newChance,
          consecutiveFailures: newFailures,
          failurePenaltyCount: newPenaltyCount,
          ...attrs,
          animation: 'fail',
          effects: { ...state.effects, failureAnimation: true },
        });
        setTimeout(() => {
          set((s) => ({
            animation: '',
            effects: { ...s.effects, failureAnimation: false },
          }));
        }, 1000);
        return { success: false, guaranteed: false };
      }
    },
  };
});

export const useForgeStore = useStore;
