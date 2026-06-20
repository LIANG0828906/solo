import { create } from 'zustand';

export type WeaponType = 'sword' | 'bow' | 'staff';
export type RuneType = 'fire' | 'ice' | 'thunder' | 'shadow' | 'holy';

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
  runeSlots: RuneSlot[];
  upgradeLevel: number;
  consecutiveFailures: number;
  failurePenaltyCount: number;
  baseAttack: number;
  fireDamage: number;
  iceDamage: number;
  thunderDamage: number;
  shadowDamage: number;
  holyDamage: number;
  critRate: number;
  gold: number;
  effects: EffectState;
  setWeaponType: (type: WeaponType) => void;
  setRune: (slotIndex: number, type: RuneType, level: number) => void;
  removeRune: (slotIndex: number) => void;
  upgrade: () => { success: boolean; guaranteed: boolean };
}

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

export const useStore = create<StoreState>((set, get) => {
  const initialAttrs = calculateAttributes('sword', createEmptySlots(), 0, 0);
  return {
    weaponType: 'sword',
    runeSlots: createEmptySlots(),
    upgradeLevel: 0,
    consecutiveFailures: 0,
    failurePenaltyCount: 0,
    ...initialAttrs,
    gold: 10000,
    effects: {
      particleType: null,
      successAnimation: false,
      failureAnimation: false,
    },
    setWeaponType: (type: WeaponType) => {
      const { runeSlots, upgradeLevel, failurePenaltyCount } = get();
      const attrs = calculateAttributes(type, runeSlots, upgradeLevel, failurePenaltyCount);
      set({ weaponType: type, ...attrs });
    },
    setRune: (slotIndex: number, type: RuneType, level: number) => {
      const { runeSlots, weaponType, upgradeLevel, failurePenaltyCount } = get();
      const newSlots = [...runeSlots];
      newSlots[slotIndex] = { type, level: Math.max(1, Math.min(5, level)) };
      const attrs = calculateAttributes(weaponType, newSlots, upgradeLevel, failurePenaltyCount);
      set({ runeSlots: newSlots, ...attrs, effects: { ...get().effects, particleType: type } });
      setTimeout(() => {
        set((state) => ({ effects: { ...state.effects, particleType: null } }));
      }, 800);
    },
    removeRune: (slotIndex: number) => {
      const { runeSlots, weaponType, upgradeLevel, failurePenaltyCount } = get();
      const newSlots = [...runeSlots];
      newSlots[slotIndex] = { type: null, level: 1 };
      const attrs = calculateAttributes(weaponType, newSlots, upgradeLevel, failurePenaltyCount);
      set({ runeSlots: newSlots, ...attrs });
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
        const attrs = calculateAttributes(state.weaponType, state.runeSlots, newLevel, state.failurePenaltyCount);
        set({
          upgradeLevel: newLevel,
          consecutiveFailures: 0,
          ...attrs,
          effects: { ...state.effects, successAnimation: true },
        });
        setTimeout(() => {
          set((s) => ({ effects: { ...s.effects, successAnimation: false } }));
        }, 1000);
        return { success: true, guaranteed };
      } else {
        const newFailures = state.consecutiveFailures + 1;
        const newPenaltyCount = state.failurePenaltyCount + 1;
        const attrs = calculateAttributes(state.weaponType, state.runeSlots, state.upgradeLevel, newPenaltyCount);
        set({
          consecutiveFailures: newFailures,
          failurePenaltyCount: newPenaltyCount,
          ...attrs,
          effects: { ...state.effects, failureAnimation: true },
        });
        setTimeout(() => {
          set((s) => ({ effects: { ...s.effects, failureAnimation: false } }));
        }, 1000);
        return { success: false, guaranteed: false };
      }
    },
  };
});
