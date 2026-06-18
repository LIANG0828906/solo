import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { eventBus } from './eventBus'

export interface Crystal {
  id: string
  xPercent: number
  yOffset: number
  size: number
}

export interface VisualEffect {
  id: string
  type: 'ring' | 'particles'
  x: number
  y: number
  createdAt: number
  color?: string
}

export interface GameState {
  energy: {
    engine: number
    shield: number
    engineRatio: number
    shieldRatio: number
    totalConsumed: number
  }
  mining: {
    playerScore: number
    npcScore: number
    playerXPercent: number
    npcXPercent: number
    npcSpeedFactor: number
    crystals: Crystal[]
  }
  game: {
    status: 'idle' | 'playing' | 'finished'
    timeLeft: number
  }
  ship: {
    speedMultiplier: number
  }
  effects: VisualEffect[]
}

type Action =
  | { type: 'SET_ENERGY_RATIO'; engineRatio: number; shieldRatio: number }
  | { type: 'UPDATE_ENERGY'; engine: number; shield: number; totalConsumed: number }
  | { type: 'UPDATE_SPEED_MULTIPLIER'; multiplier: number }
  | { type: 'UPDATE_SHIP_POSITIONS'; playerXPercent: number; npcXPercent: number }
  | { type: 'UPDATE_NPC_SPEED'; factor: number }
  | { type: 'SET_CRYSTALS'; crystals: Crystal[] }
  | { type: 'ADD_CRYSTAL'; crystal: Crystal }
  | { type: 'REMOVE_CRYSTAL'; id: string }
  | { type: 'MINING_SUCCESS'; who: 'player' | 'npc'; x: number; y: number; score: number; energyCost: number }
  | { type: 'ADD_EFFECT'; effect: VisualEffect }
  | { type: 'REMOVE_EFFECT'; id: string }
  | { type: 'SET_TIME'; timeLeft: number }
  | { type: 'START_GAME' }
  | { type: 'END_GAME' }
  | { type: 'RESET_GAME' }

const generateCrystals = (): Crystal[] => {
  const count = 10 + Math.floor(Math.random() * 6)
  const crystals: Crystal[] = []
  for (let i = 0; i < count; i++) {
    crystals.push({
      id: `crystal-${Date.now()}-${i}`,
      xPercent: 5 + Math.random() * 90,
      yOffset: 40 + Math.random() * 40,
      size: 12 + Math.random() * 6,
    })
  }
  return crystals
}

const initialState: GameState = {
  energy: {
    engine: 100,
    shield: 100,
    engineRatio: 50,
    shieldRatio: 50,
    totalConsumed: 0,
  },
  mining: {
    playerScore: 0,
    npcScore: 0,
    playerXPercent: 10,
    npcXPercent: 10,
    npcSpeedFactor: 1,
    crystals: generateCrystals(),
  },
  game: {
    status: 'idle',
    timeLeft: 30,
  },
  ship: {
    speedMultiplier: 1,
  },
  effects: [],
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_ENERGY_RATIO':
      return {
        ...state,
        energy: {
          ...state.energy,
          engineRatio: action.engineRatio,
          shieldRatio: action.shieldRatio,
        },
      }
    case 'UPDATE_ENERGY':
      return {
        ...state,
        energy: {
          ...state.energy,
          engine: Math.max(0, action.engine),
          shield: Math.max(0, action.shield),
          totalConsumed: action.totalConsumed,
        },
      }
    case 'UPDATE_SPEED_MULTIPLIER':
      return {
        ...state,
        ship: { speedMultiplier: action.multiplier },
      }
    case 'UPDATE_SHIP_POSITIONS':
      return {
        ...state,
        mining: {
          ...state.mining,
          playerXPercent: Math.max(0, Math.min(100, action.playerXPercent)),
          npcXPercent: Math.max(0, Math.min(100, action.npcXPercent)),
        },
      }
    case 'UPDATE_NPC_SPEED':
      return {
        ...state,
        mining: { ...state.mining, npcSpeedFactor: action.factor },
      }
    case 'SET_CRYSTALS':
      return {
        ...state,
        mining: { ...state.mining, crystals: action.crystals },
      }
    case 'ADD_CRYSTAL':
      return {
        ...state,
        mining: { ...state.mining, crystals: [...state.mining.crystals, action.crystal] },
      }
    case 'REMOVE_CRYSTAL':
      return {
        ...state,
        mining: {
          ...state.mining,
          crystals: state.mining.crystals.filter((c) => c.id !== action.id),
        },
      }
    case 'MINING_SUCCESS': {
      const effectId = `effect-${Date.now()}-${Math.random()}`
      const effect: VisualEffect = {
        id: effectId,
        type: action.who === 'player' ? 'ring' : 'particles',
        x: action.x,
        y: action.y,
        createdAt: Date.now(),
        color: action.who === 'npc' ? '#FF4500' : undefined,
      }
      return {
        ...state,
        mining: {
          ...state.mining,
          playerScore:
            action.who === 'player'
              ? state.mining.playerScore + action.score
              : state.mining.playerScore,
          npcScore:
            action.who === 'npc'
              ? state.mining.npcScore + action.score
              : state.mining.npcScore,
        },
        energy: {
          ...state.energy,
          totalConsumed: state.energy.totalConsumed + action.energyCost,
        },
        effects: [...state.effects, effect],
      }
    }
    case 'ADD_EFFECT':
      return { ...state, effects: [...state.effects, action.effect] }
    case 'REMOVE_EFFECT':
      return {
        ...state,
        effects: state.effects.filter((e) => e.id !== action.id),
      }
    case 'SET_TIME':
      return {
        ...state,
        game: { ...state.game, timeLeft: action.timeLeft },
      }
    case 'START_GAME':
      return {
        ...state,
        game: { status: 'playing', timeLeft: 30 },
      }
    case 'END_GAME':
      return {
        ...state,
        game: { ...state.game, status: 'finished' },
      }
    case 'RESET_GAME': {
      return {
        ...initialState,
        mining: {
          ...initialState.mining,
          crystals: generateCrystals(),
        },
      }
    }
    default:
      return state
  }
}

interface GameContextValue {
  state: GameState
  dispatch: React.Dispatch<Action>
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const off1 = eventBus.on('ENERGY_UPDATED', (data) => {
      dispatch({
        type: 'UPDATE_ENERGY',
        engine: data.engine,
        shield: data.shield,
        totalConsumed: data.totalConsumed,
      })
    })

    const off2 = eventBus.on('MINING_SUCCESS', (data) => {
      dispatch({
        type: 'MINING_SUCCESS',
        who: data.who,
        x: data.x,
        y: data.y,
        score: data.score,
        energyCost: data.energyCost,
      })
    })

    const off3 = eventBus.on('GAME_RESET', () => {
      dispatch({ type: 'RESET_GAME' })
    })

    return () => {
      off1()
      off2()
      off3()
    }
  }, [])

  return (
    <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>
  )
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
