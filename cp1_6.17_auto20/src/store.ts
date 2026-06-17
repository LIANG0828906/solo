import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type CharacterType = 'swordsman' | 'mage';
export type LogType = 'attack' | 'defense' | 'special' | 'system';
export type SwordsmanSkill = 'heavySlash' | 'whirlwind' | 'block';
export type MageSkill = 'fireball' | 'iceSpike' | 'shield';

export interface Character {
  name: string;
  type: CharacterType;
  maxHp: number;
  currentHp: number;
  attack: number;
  skill: SwordsmanSkill | MageSkill;
  color: string;
}

export interface LogEntry {
  id: string;
  round: number;
  message: string;
  type: LogType;
  timestamp: number;
}

export interface SkillConfig {
  name: string;
  type: LogType;
  damageModifier: number;
  defenseModifier: number;
  color: string;
  description: string;
}

export const SWORDSMAN_SKILLS: Record<SwordsmanSkill, SkillConfig> = {
  heavySlash: {
    name: '重斩',
    type: 'attack',
    damageModifier: 1.5,
    defenseModifier: 0,
    color: '#00BFFF',
    description: '强力一击，造成1.5倍伤害',
  },
  whirlwind: {
    name: '旋风斩',
    type: 'special',
    damageModifier: 1.2,
    defenseModifier: 0.2,
    color: '#CE93D8',
    description: '旋转攻击，造成1.2倍伤害并提升20%防御',
  },
  block: {
    name: '格挡',
    type: 'defense',
    damageModifier: 0.5,
    defenseModifier: 0.6,
    color: '#69F0AE',
    description: '防御姿态，减少40%受到的伤害',
  },
};

export const MAGE_SKILLS: Record<MageSkill, SkillConfig> = {
  fireball: {
    name: '火球',
    type: 'attack',
    damageModifier: 1.6,
    defenseModifier: 0,
    color: '#FF5722',
    description: '发射火球，造成1.6倍伤害',
  },
  iceSpike: {
    name: '冰锥',
    type: 'special',
    damageModifier: 1.3,
    defenseModifier: 0.15,
    color: '#00BCD4',
    description: '冰锥穿刺，造成1.3倍伤害并提升15%防御',
  },
  shield: {
    name: '护盾',
    type: 'defense',
    damageModifier: 0.4,
    defenseModifier: 0.7,
    color: '#69F0AE',
    description: '魔法护盾，减少50%受到的伤害',
  },
};

interface FightState {
  swordsman: Character;
  mage: Character;
  isFighting: boolean;
  round: number;
  logs: LogEntry[];
  winner: string | null;
  showVictory: boolean;

  setSwordsmanStats: (stats: Partial<Character>) => void;
  setMageStats: (stats: Partial<Character>) => void;
  startFight: () => void;
  resetFight: () => void;
  recordLog: (message: string, type: LogType, round: number) => void;
  endFight: (winner: string) => void;
  setShowVictory: (show: boolean) => void;
  dealDamage: (target: CharacterType, damage: number) => void;
}

const createInitialSwordsman = (): Character => ({
  name: '剑士',
  type: 'swordsman',
  maxHp: 200,
  currentHp: 200,
  attack: 30,
  skill: 'heavySlash',
  color: '#00BFFF',
});

const createInitialMage = (): Character => ({
  name: '法师',
  type: 'mage',
  maxHp: 140,
  currentHp: 140,
  attack: 40,
  skill: 'fireball',
  color: '#FF4080',
});

export const useFightStore = create<FightState>((set, get) => ({
  swordsman: createInitialSwordsman(),
  mage: createInitialMage(),
  isFighting: false,
  round: 0,
  logs: [],
  winner: null,
  showVictory: false,

  setSwordsmanStats: (stats) =>
    set((state) => {
      const updated = { ...state.swordsman, ...stats };
      if (stats.maxHp !== undefined) {
        updated.currentHp = stats.maxHp;
      }
      return { swordsman: updated };
    }),

  setMageStats: (stats) =>
    set((state) => {
      const updated = { ...state.mage, ...stats };
      if (stats.maxHp !== undefined) {
        updated.currentHp = stats.maxHp;
      }
      return { mage: updated };
    }),

  startFight: () => {
    const { swordsman, mage } = get();
    set({
      isFighting: true,
      round: 1,
      logs: [],
      winner: null,
      showVictory: false,
      swordsman: { ...swordsman, currentHp: swordsman.maxHp },
      mage: { ...mage, currentHp: mage.maxHp },
    });
    get().recordLog('战斗开始！', 'system', 0);
  },

  resetFight: () => {
    const { swordsman, mage } = get();
    set({
      isFighting: false,
      round: 0,
      logs: [],
      winner: null,
      showVictory: false,
      swordsman: { ...swordsman, currentHp: swordsman.maxHp },
      mage: { ...mage, currentHp: mage.maxHp },
    });
  },

  recordLog: (message, type, round) =>
    set((state) => {
      const newLog: LogEntry = {
        id: uuidv4(),
        round,
        message,
        type,
        timestamp: Date.now(),
      };
      const newLogs = [newLog, ...state.logs];
      if (newLogs.length > 30) {
        newLogs.length = 30;
      }
      return { logs: newLogs };
    }),

  endFight: (winner) => {
    set({ isFighting: false, winner, showVictory: true });
    get().recordLog(`${winner}获胜！`, 'system', get().round);
  },

  setShowVictory: (show) => set({ showVictory: show }),

  dealDamage: (target, damage) =>
    set((state) => {
      const key = target === 'swordsman' ? 'swordsman' : 'mage';
      const char = state[key];
      const newHp = Math.max(0, char.currentHp - damage);
      return {
        [key]: { ...char, currentHp: newHp },
      } as Partial<FightState>;
    }),
}));
