import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type CharacterType = 'swordsman' | 'mage'
export type LogType = 'attack' | 'defense' | 'special'
export type SwordsmanSkill = '重斩' | '旋风斩' | '格挡'
export type MageSkill = '火球' | '冰锥' | '护盾'

export interface Character {
  id: string
  type: CharacterType
  name: string
  maxHp: number
  currentHp: number
  attack: number
  skill: SwordsmanSkill | MageSkill
  position: { x: number; y: number }
  color: string
}

export interface LogEntry {
  id: string
  round: number
  type: LogType
  message: string
  timestamp: number
}

interface CombatState {
  isFighting: boolean
  round: number
  winner: CharacterType | null
  showVictory: boolean
  swordsman: Character
  mage: Character
  logs: LogEntry[]
}

interface CombatActions {
  updateSwordsman: (config: Partial<Pick<Character, 'maxHp' | 'attack' | 'skill'>>) => void
  updateMage: (config: Partial<Pick<Character, 'maxHp' | 'attack' | 'skill'>>) => void
  startFight: () => void
  endFight: (winner: CharacterType) => void
  recordLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void
  resetFight: () => void
  nextRound: () => void
  applyDamage: (target: CharacterType, damage: number) => void
  setShowVictory: (show: boolean) => void
}

const createInitialSwordsman = (): Character => ({
  id: uuidv4(),
  type: 'swordsman',
  name: '剑士',
  maxHp: 200,
  currentHp: 200,
  attack: 30,
  skill: '重斩',
  position: { x: 150, y: 300 },
  color: '#00BFFF'
})

const createInitialMage = (): Character => ({
  id: uuidv4(),
  type: 'mage',
  name: '法师',
  maxHp: 140,
  currentHp: 140,
  attack: 40,
  skill: '火球',
  position: { x: 650, y: 300 },
  color: '#FF4080'
})

export const useCombatStore = create<CombatState & CombatActions>((set, get) => ({
  isFighting: false,
  round: 0,
  winner: null,
  showVictory: false,
  swordsman: createInitialSwordsman(),
  mage: createInitialMage(),
  logs: [],

  updateSwordsman: (config) => set((state) => ({
    swordsman: {
      ...state.swordsman,
      ...config,
      currentHp: config.maxHp ?? state.swordsman.maxHp
    }
  })),

  updateMage: (config) => set((state) => ({
    mage: {
      ...state.mage,
      ...config,
      currentHp: config.maxHp ?? state.mage.maxHp
    }
  })),

  startFight: () => set(() => ({
    isFighting: true,
    round: 1,
    winner: null,
    showVictory: false,
    logs: []
  })),

  endFight: (winner) => set(() => ({
    isFighting: false,
    winner,
    showVictory: true
  })),

  recordLog: (entry) => set((state) => {
    const newLog: LogEntry = {
      ...entry,
      id: uuidv4(),
      timestamp: Date.now()
    }
    const newLogs = [newLog, ...state.logs]
    if (newLogs.length > 30) {
      newLogs.pop()
    }
    return { logs: newLogs }
  }),

  resetFight: () => set(() => ({
    isFighting: false,
    round: 0,
    winner: null,
    showVictory: false,
    swordsman: { ...createInitialSwordsman(), ...get().swordsman, currentHp: get().swordsman.maxHp },
    mage: { ...createInitialMage(), ...get().mage, currentHp: get().mage.maxHp },
    logs: []
  })),

  nextRound: () => set((state) => ({
    round: state.round + 1
  })),

  applyDamage: (target, damage) => set((state) => {
    const char = target === 'swordsman' ? state.swordsman : state.mage
    const newHp = Math.max(0, char.currentHp - damage)
    const updatedChar = { ...char, currentHp: newHp }
    
    if (target === 'swordsman') {
      return { swordsman: updatedChar }
    } else {
      return { mage: updatedChar }
    }
  }),

  setShowVictory: (show) => set(() => ({ showVictory: show }))
}))
