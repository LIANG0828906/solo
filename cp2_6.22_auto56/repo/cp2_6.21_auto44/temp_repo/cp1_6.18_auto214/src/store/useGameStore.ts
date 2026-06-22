import { create } from 'zustand'
import * as THREE from 'three'
import { GameState, GameAction, Star, Connection, ConstellationTemplate, Particle } from '@/types'

const initialState: GameState = {
  stars: [],
  connections: [],
  constellations: [],
  selectedStarId: null,
  isDragging: false,
  draggedStarId: null,
  unlockedCount: 0,
  totalConstellations: 10,
  activeStoryConstellation: null,
  particles: [],
  isResetting: false,
  constellationStarPositions: new Map()
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return { ...initialState }

    case 'SELECT_STAR': {
      const stars = state.stars.map(star => ({
        ...star,
        isSelected: star.id === action.starId || star.isSelected
      }))
      return { ...state, stars, selectedStarId: action.starId }
    }

    case 'START_DRAG': {
      const stars = state.stars.map(star =>
        star.id === action.starId
          ? { ...star, isDragging: true, position: action.position.clone() }
          : star
      )
      return { ...state, stars, isDragging: true, draggedStarId: action.starId }
    }

    case 'DRAG_STAR': {
      const stars = state.stars.map(star =>
        star.id === action.starId
          ? { ...star, position: action.position.clone() }
          : star
      )
      return { ...state, stars }
    }

    case 'END_DRAG': {
      const stars = state.stars.map(star =>
        star.id === action.starId
          ? { ...star, isDragging: false, position: star.originalPosition.clone() }
          : star
      )
      return { ...state, stars, isDragging: false, draggedStarId: null }
    }

    case 'CHECK_CONNECTION': {
      const existingConnection = state.connections.find(
        c => (c.from === action.fromId && c.to === action.toId) ||
             (c.from === action.toId && c.to === action.fromId)
      )
      if (existingConnection) return state

      const targetConstellation = state.constellations.find(c => {
        if (c.isUnlocked) return false
        const currentConnections = state.connections.filter(conn => !conn.isPreview)
        const connectedStarIds = [
          ...new Set([...currentConnections.map(c => c.from), ...currentConnections.map(c => c.to), action.fromId, action.toId])
        ]
        return c.starIds.every(id => connectedStarIds.includes(id))
      })

      const constellation = state.constellations.find(c =>
        !c.isUnlocked && c.starIds.includes(action.fromId) && c.starIds.includes(action.toId)
      )

      if (constellation) {
        const newConnection: Connection = {
          id: `conn-${Date.now()}-${Math.random()}`,
          from: action.fromId,
          to: action.toId,
          isPreview: false,
          isValid: true,
          isShaking: false
        }
        return { ...state, connections: [...state.connections, newConnection] }
      } else {
        const newConnection: Connection = {
          id: `conn-${Date.now()}-${Math.random()}`,
          from: action.fromId,
          to: action.toId,
          isPreview: false,
          isValid: false,
          isShaking: true
        }
        const stars = state.stars.map(star =>
          star.id === action.fromId || star.id === action.toId
            ? { ...star, brightness: 0.2 }
            : star
        )
        setTimeout(() => {
          state.connections = state.connections.filter(c => c.id !== newConnection.id)
          const restoredStars = state.stars.map(star => {
            if (star.id === action.fromId || star.id === action.toId) {
              return { ...star, brightness: 0.4 + Math.random() * 0.6 }
            }
            return star
          })
          state.stars = restoredStars
        }, 300)
        return { ...state, connections: [...state.connections, newConnection], stars }
      }
    }

    case 'UNLOCK_CONSTELLATION': {
      const constellations = state.constellations.map(c =>
        c.id === action.constellationId ? { ...c, isUnlocked: true } : c
      )
      const unlocked = constellations.find(c => c.id === action.constellationId)
      const stars = state.stars.map(star => {
        if (unlocked && unlocked.starIds.includes(star.id)) {
          return { ...star, isPartOfConstellation: true, constellationId: action.constellationId }
        }
        return star
      })
      return {
        ...state,
        constellations,
        stars,
        unlockedCount: state.unlockedCount + 1,
        activeStoryConstellation: unlocked || null,
        selectedStarId: null
      }
    }

    case 'CLEAR_SELECTION': {
      const stars = state.stars.map(star => ({ ...star, isSelected: false }))
      return { ...state, stars, selectedStarId: null }
    }

    case 'RESET_GAME': {
      return { ...initialState, isResetting: true }
    }

    case 'CLOSE_STORY':
      return { ...state, activeStoryConstellation: null }

    case 'ADD_PARTICLES':
      return { ...state, particles: [...state.particles, ...action.particles] }

    case 'UPDATE_PARTICLES':
      return { ...state, particles: action.particles }

    case 'SHAKE_CONNECTION': {
      const connections = state.connections.map(c =>
        c.id === action.connectionId ? { ...c, isShaking: true } : c
      )
      return { ...state, connections }
    }

    case 'STOP_SHAKE': {
      const connections = state.connections.map(c =>
        c.id === action.connectionId ? { ...c, isShaking: false } : c
      )
      return { ...state, connections }
    }

    case 'SET_CONSTELLATION_POSITIONS': {
      const newPositions = new Map(state.constellationStarPositions)
      newPositions.set(action.constellationId, action.positions)
      return { ...state, constellationStarPositions: newPositions }
    }

    default:
      return state
  }
}

export const useGameStore = create<GameState & {
  dispatch: (action: GameAction) => void
  setStars: (stars: Star[]) => void
  setConstellations: (constellations: ConstellationTemplate[]) => void
  addPreviewConnection: (fromId: string, toId: string) => void
  removePreviewConnection: () => void
}>((set, get) => ({
  ...initialState,

  dispatch: (action: GameAction) => {
    set(state => gameReducer(state, action))
  },

  setStars: (stars: Star[]) => set({ stars }),

  setConstellations: (constellations: ConstellationTemplate[]) => set({ constellations }),

  addPreviewConnection: (fromId: string, toId: string) => {
    const state = get()
    const previewConn: Connection = {
      id: 'preview',
      from: fromId,
      to: toId,
      isPreview: true,
      isValid: true,
      isShaking: false
    }
    const filteredConnections = state.connections.filter(c => c.id !== 'preview')
    set({ connections: [...filteredConnections, previewConn] })
  },

  removePreviewConnection: () => {
    const state = get()
    set({ connections: state.connections.filter(c => c.id !== 'preview') })
  }
}))
