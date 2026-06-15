import { create } from 'zustand';
import type { Rune, Enemy, SpellEffect, GameState } from './types';
import { combineRunes } from './runeCombinationEngine';

interface DamageNumber {
  id: string;
  value: number;
  targetId: string;
}

interface GameStore {
  gameState: GameState;
  selectedRunes: (Rune | null)[];
  enemies: Enemy[];
  energy: number;
  frenzyMode: boolean;
  frenzyCastsLeft: number;
  currentSpell: SpellEffect | null;
  isCasting: boolean;
  damageNumbers: DamageNumber[];
  screenFlash: boolean;
  setGameState: (state: GameState) => void;
  setRune: (slotIndex: number, rune: Rune | null) => void;
  removeRune: (slotIndex: number) => void;
  clearRunes: () => void;
  castSpell: () => void;
  generateEnemies: () => void;
  activateFrenzy: () => void;
  addDamageNumber: (id: string, value: number, targetId: string) => void;
  removeDamageNumber: (id: string) => void;
}

const ENEMY_NAMES = [
  '哥布林战士',
  '暗影法师',
  '石像鬼',
  '毒蜘蛛',
  '亡灵骑士',
  '火焰元素',
  '冰霜巨人',
  '雷霆鸟',
  '幽灵王',
  '恶魔领主',
];

const ATTACK_TYPES = ['近战', '远程', '法术', '毒素', '雷电', '火焰', '冰霜'];

function generateRandomEnemy(index: number): Enemy {
  const name = ENEMY_NAMES[Math.floor(Math.random() * ENEMY_NAMES.length)];
  const maxHp = 80 + Math.floor(Math.random() * 120);
  const attackType = ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)];

  return {
    id: `enemy-${index}-${Date.now()}`,
    name,
    maxHp,
    currentHp: maxHp,
    attackType,
    statusEffects: [],
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'preview',
  selectedRunes: [null, null, null, null],
  enemies: [],
  energy: 0,
  frenzyMode: false,
  frenzyCastsLeft: 0,
  currentSpell: null,
  isCasting: false,
  damageNumbers: [],
  screenFlash: false,

  setGameState: (state: GameState) => set({ gameState: state }),

  setRune: (slotIndex: number, rune: Rune | null) =>
    set((state) => {
      const newRunes = [...state.selectedRunes];
      newRunes[slotIndex] = rune;
      return { selectedRunes: newRunes };
    }),

  removeRune: (slotIndex: number) =>
    set((state) => {
      const newRunes = [...state.selectedRunes];
      newRunes[slotIndex] = null;
      return { selectedRunes: newRunes };
    }),

  clearRunes: () => set({ selectedRunes: [null, null, null, null] }),

  castSpell: () => {
    const { selectedRunes, frenzyMode, frenzyCastsLeft } = get();
    const runes = selectedRunes.filter((r): r is Rune => r !== null);

    if (runes.length === 0) return;

    const spell = combineRunes(runes);
    const enemies = get().enemies;

    let updatedEnemies = enemies.map((enemy) => {
      if (spell.type === 'aoe' || enemy.id === enemies[0]?.id) {
        const newHp = Math.max(0, enemy.currentHp - spell.damage);
        return {
          ...enemy,
          currentHp: newHp,
          statusEffects: [...enemy.statusEffects, ...spell.statusEffects],
        };
      }
      return enemy;
    });

    const energyGain = Math.min(100, get().energy + 15);
    const newFrenzyCastsLeft = frenzyMode ? frenzyCastsLeft - 1 : frenzyCastsLeft;
    const newFrenzyMode = frenzyMode && newFrenzyCastsLeft > 0;

    set({
      currentSpell: spell,
      isCasting: true,
      enemies: updatedEnemies,
      energy: energyGain,
      frenzyMode: newFrenzyMode,
      frenzyCastsLeft: newFrenzyCastsLeft,
      screenFlash: true,
    });

    setTimeout(() => {
      set({ isCasting: false, screenFlash: false });
    }, 500);
  },

  generateEnemies: () => {
    const enemies = [0, 1, 2].map((i) => generateRandomEnemy(i));
    set({ enemies });
  },

  activateFrenzy: () => {
    const { energy } = get();
    if (energy >= 100) {
      set({
        energy: 0,
        frenzyMode: true,
        frenzyCastsLeft: 3,
      });
    }
  },

  addDamageNumber: (id: string, value: number, targetId: string) =>
    set((state) => ({
      damageNumbers: [...state.damageNumbers, { id, value, targetId }],
    })),

  removeDamageNumber: (id: string) =>
    set((state) => ({
      damageNumbers: state.damageNumbers.filter((d) => d.id !== id),
    })),
}));
