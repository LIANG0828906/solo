import { create } from 'zustand'

export interface Spell {
  id: string
  name: string
  icon: string
  color: string
  description: string
  gesture: string
}

export interface SpellHistory {
  id: string
  spellId: string
  spellName: string
  timestamp: Date
  score: number
  icon: string
  color: string
}

interface GameState {
  spells: Spell[]
  history: SpellHistory[]
  currentScore: number | null
  isCasting: boolean
  activeSpell: Spell | null
  addHistory: (spell: Spell, score: number) => void
  setScore: (score: number | null) => void
  setCasting: (casting: boolean) => void
  setActiveSpell: (spell: Spell | null) => void
}

const SPELLS: Spell[] = [
  {
    id: 'fireball',
    name: '火球术',
    icon: '🔥',
    color: '#ff6b35',
    description: '画圆召唤炽热火球',
    gesture: 'circle'
  },
  {
    id: 'lightning',
    name: '雷电术',
    icon: '⚡',
    color: '#ffe135',
    description: '闪电形状召唤天雷',
    gesture: 'zigzag'
  },
  {
    id: 'frost',
    name: '冰霜新星',
    icon: '❄️',
    color: '#35d0ff',
    description: '三角形召唤冰霜',
    gesture: 'triangle'
  },
  {
    id: 'wind',
    name: '风刃',
    icon: '💨',
    color: '#8fff8f',
    description: '横向挥斩召唤风刃',
    gesture: 'swipe'
  },
  {
    id: 'shadow',
    name: '暗影弹',
    icon: '🌑',
    color: '#9b59ff',
    description: '向下按压召唤暗影',
    gesture: 'push'
  }
]

export const useGameStore = create<GameState>((set) => ({
  spells: SPELLS,
  history: [],
  currentScore: null,
  isCasting: false,
  activeSpell: null,

  addHistory: (spell: Spell, score: number) =>
    set((state) => {
      const newEntry: SpellHistory = {
        id: `${Date.now()}-${Math.random()}`,
        spellId: spell.id,
        spellName: spell.name,
        timestamp: new Date(),
        score,
        icon: spell.icon,
        color: spell.color
      }
      const newHistory = [newEntry, ...state.history].slice(0, 5)
      return { history: newHistory }
    }),

  setScore: (score: number | null) => set({ currentScore: score }),

  setCasting: (casting: boolean) => set({ isCasting: casting }),

  setActiveSpell: (spell: Spell | null) => set({ activeSpell: spell })
}))
