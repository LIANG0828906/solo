import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'

export type InspirationType = 'text' | 'image' | 'voice'

export interface Inspiration {
  id: string
  content: string
  type: InspirationType
  createdAt: number
  themeId: string | null
  label?: string
  x?: number
  y?: number
}

export interface Theme {
  id: string
  name: string
  createdAt: number
  color: string
}

export interface ThemeNode {
  inspirationId: string
  x: number
  y: number
  label: string
}

export interface ThemeLink {
  source: string
  target: string
}

export interface ThemeData {
  nodes: ThemeNode[]
  links: ThemeLink[]
}

export interface AppState {
  inspirations: Inspiration[]
  themes: Theme[]
  themeData: Record<string, ThemeData>
  activeThemeId: string | null
  viewMode: 'canvas' | 'timeline'
}

type Action =
  | { type: 'ADD_INSPIRATION'; payload: Omit<Inspiration, 'id' | 'createdAt'> }
  | { type: 'DELETE_INSPIRATION'; payload: string }
  | { type: 'UPDATE_INSPIRATION'; payload: { id: string; updates: Partial<Inspiration> } }
  | { type: 'ADD_THEME'; payload: { name: string } }
  | { type: 'SET_ACTIVE_THEME'; payload: string | null }
  | { type: 'SET_VIEW_MODE'; payload: 'canvas' | 'timeline' }
  | { type: 'ADD_NODE_TO_THEME'; payload: { themeId: string; inspirationId: string; x: number; y: number } }
  | { type: 'REMOVE_NODE_FROM_THEME'; payload: { themeId: string; inspirationId: string } }
  | { type: 'UPDATE_NODE_POSITION'; payload: { themeId: string; inspirationId: string; x: number; y: number } }
  | { type: 'UPDATE_NODE_LABEL'; payload: { themeId: string; inspirationId: string; label: string } }
  | { type: 'ADD_LINK'; payload: { themeId: string; source: string; target: string } }
  | { type: 'LOAD_STATE'; payload: AppState }

const STORAGE_KEY = 'inspiration-weaver-state'

const generateId = (): string => Math.random().toString(36).substring(2, 11)

const THEME_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']

const getInitialState = (): AppState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {
    // ignore
  }
  return {
    inspirations: [
      {
        id: generateId(),
        content: '今天在地铁上想到一个新的产品设计方向，主打极简主义和效率',
        type: 'text',
        createdAt: Date.now() - 86400000 * 3,
        themeId: null,
      },
      {
        id: generateId(),
        content: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400',
        type: 'image',
        createdAt: Date.now() - 86400000 * 2,
        themeId: null,
      },
      {
        id: generateId(),
        content: '语音笔记：下周会议需要讨论的三个重点：用户增长、产品迭代、团队协作',
        type: 'voice',
        createdAt: Date.now() - 86400000,
        themeId: null,
      },
    ],
    themes: [],
    themeData: {},
    activeThemeId: null,
    viewMode: 'canvas',
  }
}

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'ADD_INSPIRATION': {
      const newInspiration: Inspiration = {
        ...action.payload,
        id: generateId(),
        createdAt: Date.now(),
      }
      return {
        ...state,
        inspirations: [newInspiration, ...state.inspirations],
      }
    }
    case 'DELETE_INSPIRATION': {
      return {
        ...state,
        inspirations: state.inspirations.filter((i) => i.id !== action.payload),
      }
    }
    case 'UPDATE_INSPIRATION': {
      return {
        ...state,
        inspirations: state.inspirations.map((i) =>
          i.id === action.payload.id ? { ...i, ...action.payload.updates } : i
        ),
      }
    }
    case 'ADD_THEME': {
      const newTheme: Theme = {
        id: generateId(),
        name: action.payload.name,
        createdAt: Date.now(),
        color: THEME_COLORS[state.themes.length % THEME_COLORS.length],
      }
      return {
        ...state,
        themes: [...state.themes, newTheme],
        themeData: {
          ...state.themeData,
          [newTheme.id]: { nodes: [], links: [] },
        },
        activeThemeId: newTheme.id,
      }
    }
    case 'SET_ACTIVE_THEME': {
      return {
        ...state,
        activeThemeId: action.payload,
      }
    }
    case 'SET_VIEW_MODE': {
      return {
        ...state,
        viewMode: action.payload,
      }
    }
    case 'ADD_NODE_TO_THEME': {
      const { themeId, inspirationId, x, y } = action.payload
      const existingData = state.themeData[themeId] || { nodes: [], links: [] }
      if (existingData.nodes.some((n) => n.inspirationId === inspirationId)) {
        return state
      }
      const inspiration = state.inspirations.find((i) => i.id === inspirationId)
      const defaultLabel = inspiration
        ? inspiration.content.substring(0, 15) + (inspiration.content.length > 15 ? '...' : '')
        : '未命名'

      const newNode: ThemeNode = {
        inspirationId,
        x,
        y,
        label: defaultLabel,
      }

      const links = existingData.nodes.length > 0
        ? [
            ...existingData.links,
            { source: existingData.nodes[existingData.nodes.length - 1].inspirationId, target: inspirationId },
          ]
        : existingData.links

      return {
        ...state,
        themeData: {
          ...state.themeData,
          [themeId]: {
            nodes: [...existingData.nodes, newNode],
            links,
          },
        },
        inspirations: state.inspirations.map((i) =>
          i.id === inspirationId ? { ...i, themeId } : i
        ),
      }
    }
    case 'REMOVE_NODE_FROM_THEME': {
      const { themeId, inspirationId } = action.payload
      const existingData = state.themeData[themeId]
      if (!existingData) return state
      return {
        ...state,
        themeData: {
          ...state.themeData,
          [themeId]: {
            nodes: existingData.nodes.filter((n) => n.inspirationId !== inspirationId),
            links: existingData.links.filter(
              (l) => l.source !== inspirationId && l.target !== inspirationId
            ),
          },
        },
        inspirations: state.inspirations.map((i) =>
          i.id === inspirationId ? { ...i, themeId: null } : i
        ),
      }
    }
    case 'UPDATE_NODE_POSITION': {
      const { themeId, inspirationId, x, y } = action.payload
      const existingData = state.themeData[themeId]
      if (!existingData) return state
      return {
        ...state,
        themeData: {
          ...state.themeData,
          [themeId]: {
            ...existingData,
            nodes: existingData.nodes.map((n) =>
              n.inspirationId === inspirationId ? { ...n, x, y } : n
            ),
          },
        },
      }
    }
    case 'UPDATE_NODE_LABEL': {
      const { themeId, inspirationId, label } = action.payload
      const existingData = state.themeData[themeId]
      if (!existingData) return state
      return {
        ...state,
        themeData: {
          ...state.themeData,
          [themeId]: {
            ...existingData,
            nodes: existingData.nodes.map((n) =>
              n.inspirationId === inspirationId ? { ...n, label } : n
            ),
          },
        },
      }
    }
    case 'ADD_LINK': {
      const { themeId, source, target } = action.payload
      const existingData = state.themeData[themeId]
      if (!existingData) return state
      const exists = existingData.links.some(
        (l) =>
          (l.source === source && l.target === target) ||
          (l.source === target && l.target === source)
      )
      if (exists) return state
      return {
        ...state,
        themeData: {
          ...state.themeData,
          [themeId]: {
            ...existingData,
            links: [...existingData.links, { source, target }],
          },
        },
      }
    }
    case 'LOAD_STATE': {
      return action.payload
    }
    default:
      return state
  }
}

interface StoreContextType {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const StoreContext = createContext<StoreContextType | null>(null)

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore
    }
  }, [state])

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within StoreProvider')
  }
  return context
}
