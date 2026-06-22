import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react'
import type { CharacterId, CharacterState, CharacterContextState, Skill } from '@/types/game'

const DEFAULT_CHARACTERS: Record<CharacterId, CharacterState> = {
  berserker: {
    id: 'berserker',
    name: '近战狂战士',
    hp: 150,
    maxHp: 150,
    skills: [
      { id: 'heavy_strike', name: '重击', cooldown: 1500, currentCooldown: 0, damage: 30, range: 60 },
      { id: 'whirlwind', name: '旋风斩', cooldown: 3000, currentCooldown: 0, damage: 20, range: 80 },
      { id: 'war_cry', name: '战吼', cooldown: 5000, currentCooldown: 0, damage: 0, range: 0 },
    ],
    switchCooldown: 0,
    position: { x: 200, y: 300 },
  },
  ranger: {
    id: 'ranger',
    name: '远程游侠',
    hp: 100,
    maxHp: 100,
    skills: [
      { id: 'precise_shot', name: '精准射击', cooldown: 1000, currentCooldown: 0, damage: 25, range: 200 },
      { id: 'multi_arrow', name: '多重箭', cooldown: 4000, currentCooldown: 0, damage: 15, range: 150 },
      { id: 'dodge', name: '闪避', cooldown: 2000, currentCooldown: 0, damage: 0, range: 0 },
    ],
    switchCooldown: 0,
    position: { x: 200, y: 300 },
  },
  sage: {
    id: 'sage',
    name: '治疗贤者',
    hp: 80,
    maxHp: 80,
    skills: [
      { id: 'heal', name: '治疗术', cooldown: 3000, currentCooldown: 0, damage: 0, range: 0 },
      { id: 'holy_bolt', name: '圣光弹', cooldown: 2000, currentCooldown: 0, damage: 15, range: 150 },
      { id: 'shield', name: '护盾', cooldown: 8000, currentCooldown: 0, damage: 0, range: 0 },
    ],
    switchCooldown: 0,
    position: { x: 200, y: 300 },
  },
}

const initialState: CharacterContextState = {
  activeCharacterId: 'berserker',
  characters: DEFAULT_CHARACTERS,
  switchCooldownEnd: 0,
  isSwitching: false,
  haloActive: false,
}

type Action =
  | { type: 'SWITCH_CHARACTER'; characterId: CharacterId }
  | { type: 'SWITCH_COMPLETE' }
  | { type: 'HALO_END' }
  | { type: 'UPDATE_POSITION'; characterId: CharacterId; position: { x: number; y: number } }
  | { type: 'USE_SKILL'; skillId: string }
  | { type: 'TICK_COOLDOWNS'; now: number }
  | { type: 'TAKE_DAMAGE'; characterId: CharacterId; damage: number }
  | { type: 'HEAL'; characterId: CharacterId; amount: number }
  | { type: 'RESET_SKILL_COOLDOWN'; skillId: string }

function reducer(state: CharacterContextState, action: Action): CharacterContextState {
  switch (action.type) {
    case 'SWITCH_CHARACTER': {
      if (action.characterId === state.activeCharacterId) return state
      const now = Date.now()
      if (now < state.switchCooldownEnd) return state
      return {
        ...state,
        activeCharacterId: action.characterId,
        switchCooldownEnd: now + 500,
        isSwitching: true,
        haloActive: true,
      }
    }
    case 'SWITCH_COMPLETE':
      return { ...state, isSwitching: false }
    case 'HALO_END':
      return { ...state, haloActive: false }
    case 'UPDATE_POSITION': {
      const char = state.characters[action.characterId]
      if (!char) return state
      return {
        ...state,
        characters: {
          ...state.characters,
          [action.characterId]: { ...char, position: action.position },
        },
      }
    }
    case 'USE_SKILL': {
      const char = state.characters[state.activeCharacterId]
      const skill = char.skills.find((s: Skill) => s.id === action.skillId)
      if (!skill || Date.now() < skill.currentCooldown) return state
      const updatedSkills = char.skills.map((s: Skill) =>
        s.id === action.skillId ? { ...s, currentCooldown: Date.now() + s.cooldown } : s
      )
      return {
        ...state,
        characters: {
          ...state.characters,
          [state.activeCharacterId]: { ...char, skills: updatedSkills },
        },
      }
    }
    case 'TICK_COOLDOWNS': {
      const updatedChars = { ...state.characters }
      for (const id of Object.keys(updatedChars) as CharacterId[]) {
        const char = updatedChars[id]
        updatedChars[id] = {
          ...char,
          skills: char.skills.map((s: Skill) =>
            action.now >= s.currentCooldown ? { ...s, currentCooldown: 0 } : s
          ),
        }
      }
      return { ...state, characters: updatedChars }
    }
    case 'TAKE_DAMAGE': {
      const char = state.characters[action.characterId]
      if (!char) return state
      return {
        ...state,
        characters: {
          ...state.characters,
          [action.characterId]: {
            ...char,
            hp: Math.max(0, char.hp - action.damage),
          },
        },
      }
    }
    case 'HEAL': {
      const char = state.characters[action.characterId]
      if (!char) return state
      return {
        ...state,
        characters: {
          ...state.characters,
          [action.characterId]: {
            ...char,
            hp: Math.min(char.maxHp, char.hp + action.amount),
          },
        },
      }
    }
    case 'RESET_SKILL_COOLDOWN': {
      const char = state.characters[state.activeCharacterId]
      const updatedSkills = char.skills.map((s: Skill) =>
        s.id === action.skillId ? { ...s, currentCooldown: 0 } : s
      )
      return {
        ...state,
        characters: {
          ...state.characters,
          [state.activeCharacterId]: { ...char, skills: updatedSkills },
        },
      }
    }
    default:
      return state
  }
}

interface CharacterContextValue {
  state: CharacterContextState
  switchCharacter: (id: CharacterId) => void
  useSkill: (skillId: string) => void
  updatePosition: (id: CharacterId, pos: { x: number; y: number }) => void
  takeDamage: (id: CharacterId, damage: number) => void
  heal: (id: CharacterId, amount: number) => void
  tickCooldowns: (now: number) => void
  getActiveCharacter: () => CharacterState
}

const CharacterContext = createContext<CharacterContextValue | null>(null)

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const switchCharacter = useCallback((id: CharacterId) => {
    dispatch({ type: 'SWITCH_CHARACTER', characterId: id })
    setTimeout(() => dispatch({ type: 'SWITCH_COMPLETE' }), 500)
    setTimeout(() => dispatch({ type: 'HALO_END' }), 300)
  }, [])

  const useSkill = useCallback((skillId: string) => {
    dispatch({ type: 'USE_SKILL', skillId })
  }, [])

  const updatePosition = useCallback((id: CharacterId, pos: { x: number; y: number }) => {
    dispatch({ type: 'UPDATE_POSITION', characterId: id, position: pos })
  }, [])

  const takeDamage = useCallback((id: CharacterId, damage: number) => {
    dispatch({ type: 'TAKE_DAMAGE', characterId: id, damage })
  }, [])

  const heal = useCallback((id: CharacterId, amount: number) => {
    dispatch({ type: 'HEAL', characterId: id, amount })
  }, [])

  const tickCooldowns = useCallback((now: number) => {
    dispatch({ type: 'TICK_COOLDOWNS', now })
  }, [])

  const getActiveCharacter = useCallback(() => {
    return state.characters[state.activeCharacterId]
  }, [state])

  return (
    <CharacterContext.Provider
      value={{
        state,
        switchCharacter,
        useSkill,
        updatePosition,
        takeDamage,
        heal,
        tickCooldowns,
        getActiveCharacter,
      }}
    >
      {children}
    </CharacterContext.Provider>
  )
}

export function useCharacter() {
  const ctx = useContext(CharacterContext)
  if (!ctx) throw new Error('useCharacter must be used within CharacterProvider')
  return ctx
}
