import React, { useEffect, useRef, useReducer, useCallback } from 'react'
import Panel from './ui/Panel'
import { ParticleScene, SerializedParticle } from './three/ParticleScene'
import { FieldType } from './utils/physics'

export interface Preset {
  id: string
  name: string
  fieldType: FieldType
  strength: number
  direction: { x: number; y: number; z: number }
  trailLength: number
  particles: SerializedParticle[]
  timestamp: number
}

interface AppState {
  fieldType: FieldType
  strength: number
  direction: { x: number; y: number; z: number }
  trailLength: number
  presets: Preset[]
}

type Action =
  | { type: 'SET_FIELD_TYPE'; payload: FieldType }
  | { type: 'SET_STRENGTH'; payload: number }
  | { type: 'SET_DIRECTION'; payload: { axis: 'x' | 'y' | 'z'; value: number } }
  | { type: 'SET_TRAIL_LENGTH'; payload: number }
  | { type: 'LOAD_PRESETS'; payload: Preset[] }
  | { type: 'ADD_PRESET'; payload: Preset }
  | { type: 'DELETE_PRESET'; payload: string }
  | { type: 'LOAD_PRESET_STATE'; payload: Preset }

const STORAGE_KEY = 'particle-simulator-presets'

const initialState: AppState = {
  fieldType: 'gravity',
  strength: 50,
  direction: { x: 0, y: -50, z: 0 },
  trailLength: 30,
  presets: [],
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_FIELD_TYPE':
      return { ...state, fieldType: action.payload }
    case 'SET_STRENGTH':
      return { ...state, strength: action.payload }
    case 'SET_DIRECTION':
      return {
        ...state,
        direction: {
          ...state.direction,
          [action.payload.axis]: action.payload.value,
        },
      }
    case 'SET_TRAIL_LENGTH':
      return { ...state, trailLength: action.payload }
    case 'LOAD_PRESETS':
      return { ...state, presets: action.payload }
    case 'ADD_PRESET': {
      const newPresets = [...state.presets, action.payload]
      if (newPresets.length > 3) newPresets.shift()
      return { ...state, presets: newPresets }
    }
    case 'DELETE_PRESET':
      return {
        ...state,
        presets: state.presets.filter((p) => p.id !== action.payload),
      }
    case 'LOAD_PRESET_STATE':
      return {
        ...state,
        fieldType: action.payload.fieldType,
        strength: action.payload.strength,
        direction: { ...action.payload.direction },
        trailLength: action.payload.trailLength,
      }
    default:
      return state
  }
}

function loadPresetsFromStorage(): Preset[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? (JSON.parse(data) as Preset[]) : []
  } catch {
    return []
  }
}

function savePresetsToStorage(presets: Preset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  } catch {
    console.warn('无法保存预设到 localStorage')
  }
}

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const sceneContainerRef = useRef<HTMLDivElement>(null)
  const particleSceneRef = useRef<ParticleScene | null>(null)

  useEffect(() => {
    const saved = loadPresetsFromStorage()
    if (saved.length > 0) {
      dispatch({ type: 'LOAD_PRESETS', payload: saved })
    }
  }, [])

  useEffect(() => {
    if (!sceneContainerRef.current) return
    particleSceneRef.current = new ParticleScene(sceneContainerRef.current)
    particleSceneRef.current.setTrailLength(state.trailLength)

    return () => {
      particleSceneRef.current?.dispose()
      particleSceneRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!particleSceneRef.current) return
    const dirLength = Math.sqrt(
      state.direction.x ** 2 + state.direction.y ** 2 + state.direction.z ** 2
    )
    const normalized =
      dirLength > 0
        ? {
            x: state.direction.x / dirLength,
            y: state.direction.y / dirLength,
            z: state.direction.z / dirLength,
          }
        : { x: 0, y: -1, z: 0 }

    particleSceneRef.current.updateParticles({
      fieldType: state.fieldType,
      strength: state.strength,
      direction: normalized,
    })
  }, [state.fieldType, state.strength, state.direction])

  useEffect(() => {
    particleSceneRef.current?.setTrailLength(state.trailLength)
  }, [state.trailLength])

  useEffect(() => {
    savePresetsToStorage(state.presets)
  }, [state.presets])

  const handleReset = useCallback(() => {
    particleSceneRef.current?.resetParticles()
  }, [])

  const handleSavePreset = useCallback(() => {
    if (!particleSceneRef.current) return
    if (state.presets.length >= 3) {
      alert('最多只能保存3个预设，请先删除一个')
      return
    }
    const preset: Preset = {
      id: `preset-${Date.now()}`,
      name: `预设 ${state.presets.length + 1}`,
      fieldType: state.fieldType,
      strength: state.strength,
      direction: { ...state.direction },
      trailLength: state.trailLength,
      particles: particleSceneRef.current.getSerializedParticles(),
      timestamp: Date.now(),
    }
    dispatch({ type: 'ADD_PRESET', payload: preset })
  }, [state])

  const handleLoadPreset = useCallback((id: string) => {
    const preset = state.presets.find((p) => p.id === id)
    if (!preset || !particleSceneRef.current) return
    dispatch({ type: 'LOAD_PRESET_STATE', payload: preset })
    particleSceneRef.current.loadSerializedParticles(preset.particles)
  }, [state.presets])

  const handleDeletePreset = useCallback((id: string) => {
    dispatch({ type: 'DELETE_PRESET', payload: id })
  }, [])

  return (
    <div style={containerStyle}>
      <div ref={sceneContainerRef} style={sceneContainerStyle} data-scene-container />
      <div data-panel style={{ display: 'contents' }}>
        <Panel
          fieldType={state.fieldType}
          strength={state.strength}
          direction={state.direction}
          trailLength={state.trailLength}
          presets={state.presets}
          onFieldTypeChange={(type) => dispatch({ type: 'SET_FIELD_TYPE', payload: type })}
          onStrengthChange={(v) => dispatch({ type: 'SET_STRENGTH', payload: v })}
          onDirectionChange={(axis, value) =>
            dispatch({ type: 'SET_DIRECTION', payload: { axis, value } })
          }
          onTrailLengthChange={(v) => dispatch({ type: 'SET_TRAIL_LENGTH', payload: v })}
          onReset={handleReset}
          onSavePreset={handleSavePreset}
          onLoadPreset={handleLoadPreset}
          onDeletePreset={handleDeletePreset}
        />
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  position: 'relative',
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
}

const sceneContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
}

export default App
