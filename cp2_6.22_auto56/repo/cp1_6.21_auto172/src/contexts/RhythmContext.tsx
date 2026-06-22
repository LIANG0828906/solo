import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react'
import type { RhythmContextState, HealthTimelinePoint, CharacterId } from '@/types/game'

const initialState: RhythmContextState = {
  comboCount: 0,
  maxCombo: 0,
  lastAttackTime: 0,
  comboBroken: false,
  comboBrokenTime: 0,
  healthTimeline: [],
  currentWave: 1,
  totalWaves: 5,
  enemiesRemaining: 0,
  waveTransition: false,
  waveTransitionTime: 0,
  screenShake: false,
  comboMilestone: 0,
}

type Action =
  | { type: 'ATTACK'; timestamp: number }
  | { type: 'COMBO_BREAK'; timestamp: number }
  | { type: 'CLEAR_COMBO_BREAK' }
  | { type: 'RECORD_HEALTH'; point: HealthTimelinePoint }
  | { type: 'SET_WAVE'; wave: number; enemies: number; total: number }
  | { type: 'DECREMENT_ENEMIES' }
  | { type: 'START_WAVE_TRANSITION'; timestamp: number }
  | { type: 'END_WAVE_TRANSITION' }
  | { type: 'TRIGGER_SCREEN_SHAKE' }
  | { type: 'CLEAR_SCREEN_SHAKE' }
  | { type: 'SET_COMBO_MILESTONE'; milestone: number }
  | { type: 'CLEAR_COMBO_MILESTONE' }
  | { type: 'LOAD_HEALTH_TIMELINE'; timeline: HealthTimelinePoint[] }

function reducer(state: RhythmContextState, action: Action): RhythmContextState {
  switch (action.type) {
    case 'ATTACK': {
      const now = action.timestamp
      const interval = now - state.lastAttackTime
      if (state.lastAttackTime === 0) {
        return { ...state, comboCount: 1, lastAttackTime: now, comboBroken: false }
      }
      if (interval < 800) {
        const newCombo = state.comboCount + 1
        const newMax = Math.max(state.maxCombo, newCombo)
        let milestone = 0
        if (newCombo === 10 || newCombo === 20 || newCombo === 50) {
          milestone = newCombo
        }
        return {
          ...state,
          comboCount: newCombo,
          maxCombo: newMax,
          lastAttackTime: now,
          comboBroken: false,
          comboMilestone: milestone,
        }
      }
      if (interval > 1500) {
        return {
          ...state,
          comboCount: 1,
          lastAttackTime: now,
          comboBroken: true,
          comboBrokenTime: now,
          comboMilestone: 0,
        }
      }
      return { ...state, lastAttackTime: now, comboBroken: false }
    }
    case 'COMBO_BREAK':
      return {
        ...state,
        comboCount: 0,
        lastAttackTime: 0,
        comboBroken: true,
        comboBrokenTime: action.timestamp,
      }
    case 'CLEAR_COMBO_BREAK':
      return { ...state, comboBroken: false }
    case 'RECORD_HEALTH':
      return {
        ...state,
        healthTimeline: [...state.healthTimeline, action.point],
      }
    case 'LOAD_HEALTH_TIMELINE':
      return { ...state, healthTimeline: action.timeline }
    case 'SET_WAVE':
      return {
        ...state,
        currentWave: action.wave,
        enemiesRemaining: action.enemies,
        totalWaves: action.total,
      }
    case 'DECREMENT_ENEMIES':
      return { ...state, enemiesRemaining: Math.max(0, state.enemiesRemaining - 1) }
    case 'START_WAVE_TRANSITION':
      return { ...state, waveTransition: true, waveTransitionTime: action.timestamp }
    case 'END_WAVE_TRANSITION':
      return { ...state, waveTransition: false }
    case 'TRIGGER_SCREEN_SHAKE':
      return { ...state, screenShake: true }
    case 'CLEAR_SCREEN_SHAKE':
      return { ...state, screenShake: false }
    case 'SET_COMBO_MILESTONE':
      return { ...state, comboMilestone: action.milestone }
    case 'CLEAR_COMBO_MILESTONE':
      return { ...state, comboMilestone: 0 }
    default:
      return state
  }
}

interface RhythmContextValue {
  state: RhythmContextState
  recordAttack: (timestamp: number) => void
  breakCombo: (timestamp: number) => void
  clearComboBreak: () => void
  recordHealth: (characterId: CharacterId, hp: number, maxHp: number) => void
  setWave: (wave: number, enemies: number, total: number) => void
  decrementEnemies: () => void
  startWaveTransition: (timestamp: number) => void
  endWaveTransition: () => void
  triggerScreenShake: () => void
  clearScreenShake: () => void
  setComboMilestone: (milestone: number) => void
  clearComboMilestone: () => void
  exportTimelineAsJson: () => string
}

const RhythmContext = createContext<RhythmContextValue | null>(null)

export function RhythmProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const recordAttack = useCallback((timestamp: number) => {
    dispatch({ type: 'ATTACK', timestamp })
  }, [])

  const breakCombo = useCallback((timestamp: number) => {
    dispatch({ type: 'COMBO_BREAK', timestamp })
  }, [])

  const clearComboBreak = useCallback(() => {
    dispatch({ type: 'CLEAR_COMBO_BREAK' })
  }, [])

  const recordHealth = useCallback((characterId: CharacterId, hp: number, maxHp: number) => {
    dispatch({
      type: 'RECORD_HEALTH',
      point: { timestamp: Date.now(), hp, maxHp, characterId },
    })
  }, [])

  const setWave = useCallback((wave: number, enemies: number, total: number) => {
    dispatch({ type: 'SET_WAVE', wave, enemies, total })
  }, [])

  const decrementEnemies = useCallback(() => {
    dispatch({ type: 'DECREMENT_ENEMIES' })
  }, [])

  const startWaveTransition = useCallback((timestamp: number) => {
    dispatch({ type: 'START_WAVE_TRANSITION', timestamp })
  }, [])

  const endWaveTransition = useCallback(() => {
    dispatch({ type: 'END_WAVE_TRANSITION' })
  }, [])

  const triggerScreenShake = useCallback(() => {
    dispatch({ type: 'TRIGGER_SCREEN_SHAKE' })
    setTimeout(() => dispatch({ type: 'CLEAR_SCREEN_SHAKE' }), 300)
  }, [])

  const clearScreenShake = useCallback(() => {
    dispatch({ type: 'CLEAR_SCREEN_SHAKE' })
  }, [])

  const setComboMilestone = useCallback((milestone: number) => {
    dispatch({ type: 'SET_COMBO_MILESTONE', milestone })
  }, [])

  const clearComboMilestone = useCallback(() => {
    dispatch({ type: 'CLEAR_COMBO_MILESTONE' })
  }, [])

  const exportTimelineAsJson = useCallback(() => {
    return JSON.stringify(state.healthTimeline, null, 2)
  }, [state.healthTimeline])

  return (
    <RhythmContext.Provider
      value={{
        state,
        recordAttack,
        breakCombo,
        clearComboBreak,
        recordHealth,
        setWave,
        decrementEnemies,
        startWaveTransition,
        endWaveTransition,
        triggerScreenShake,
        clearScreenShake,
        setComboMilestone,
        clearComboMilestone,
        exportTimelineAsJson,
      }}
    >
      {children}
    </RhythmContext.Provider>
  )
}

export function useRhythm() {
  const ctx = useContext(RhythmContext)
  if (!ctx) throw new Error('useRhythm must be used within RhythmProvider')
  return ctx
}
