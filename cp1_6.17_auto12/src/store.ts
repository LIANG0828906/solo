import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type SwordsmanSkill = 'heavy_slash' | 'whirlwind' | 'block'
export type MageSkill = 'fireball' | 'ice_spike' | 'shield'
export type LogType = 'attack' | 'defense' | 'special'
export type FightStatus = 'idle' | 'fighting' | 'victory'

export interface Character {
  hp: number
  maxHp: number
  attack: number
  skill: SwordsmanSkill | MageSkill
  x: number
  y: number
}

export interface LogEntry {
  id: string
  round: number
  text: string
  type: LogType
  timestamp: number
}

interface FightStore {
  swordsman: Character
  mage: Character
  fightStatus: FightStatus
  round: number
  winner: 'swordsman' | 'mage' | null
  logs: LogEntry[]
  updateCharacter: (
    role: 'swordsman' | 'mage',
    updates: Partial<Character>
  ) => void
  startFight: () => void
  resetFight: () => void
  recordLog: (text: string, type: LogType) => void
  applyDamage: (target: 'swordsman' | 'mage', damage: number) => void
  setWinner: (winner: 'swordsman' | 'mage') => void
  incrementRound: () => void
}

const createSwordsman = (): Character => ({
  hp: 200,
  maxHp: 200,
  attack: 30,
  skill: 'heavy_slash',
  x: 180,
  y: 350,
})

const createMage = (): Character => ({
  hp: 140,
  maxHp: 140,
  attack: 40,
  skill: 'fireball',
  x: 620,
  y: 350,
})

export const useFightStore = create<FightStore>((set, get) => ({
  swordsman: createSwordsman(),
  mage: createMage(),
  fightStatus: 'idle',
  round: 0,
  winner: null,
  logs: [],

  updateCharacter: (role, updates) =>
    set((state) => ({
      [role]: { ...state[role], ...updates },
    })),

  startFight: () => {
    const state = get()
    set({
      fightStatus: 'fighting',
      round: 1,
      winner: null,
      logs: [],
      swordsman: { ...state.swordsman, hp: state.swordsman.maxHp },
      mage: { ...state.mage, hp: state.mage.maxHp },
    })
  },

  resetFight: () =>
    set({
      fightStatus: 'idle',
      round: 0,
      winner: null,
      logs: [],
    }),

  recordLog: (text, type) =>
    set((state) => {
      const entry: LogEntry = {
        id: uuidv4(),
        round: state.round,
        text,
        type,
        timestamp: Date.now(),
      }
      const newLogs = [entry, ...state.logs].slice(0, 30)
      return { logs: newLogs }
    }),

  applyDamage: (target, damage) =>
    set((state) => {
      const char = state[target]
      const newHp = Math.max(0, char.hp - damage)
      return {
        [target]: { ...char, hp: newHp },
      }
    }),

  setWinner: (winner) =>
    set({
      winner,
      fightStatus: 'victory',
    }),

  incrementRound: () => set((state) => ({ round: state.round + 1 })),
}))
