import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react'
import type { ContentItem, Material, CalendarDay, SyncLog, PublishStatus } from '@/types'
import { contentApi, materialApi, calendarApi } from '@/services/api'

interface AppState {
  contentItems: ContentItem[]
  materials: Material[]
  calendarDays: CalendarDay[]
  syncLogs: SyncLog[]
  loading: boolean
  error: string | null
}

type AppAction =
  | { type: 'SET_CONTENT'; payload: ContentItem[] }
  | { type: 'ADD_CONTENT'; payload: ContentItem }
  | { type: 'UPDATE_CONTENT'; payload: ContentItem }
  | { type: 'DELETE_CONTENT'; payload: string }
  | { type: 'UPDATE_STATUS'; payload: { id: string; status: PublishStatus } }
  | { type: 'REORDER_CONTENT'; payload: string[] }
  | { type: 'SET_MATERIALS'; payload: Material[] }
  | { type: 'ADD_MATERIAL'; payload: Material }
  | { type: 'DELETE_MATERIAL'; payload: string }
  | { type: 'SET_CALENDAR'; payload: CalendarDay[] }
  | { type: 'SET_SYNC_LOGS'; payload: SyncLog[] }
  | { type: 'ADD_SYNC_LOG'; payload: SyncLog }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

const initialState: AppState = {
  contentItems: [],
  materials: [],
  calendarDays: [],
  syncLogs: [],
  loading: false,
  error: null,
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CONTENT':
      return { ...state, contentItems: action.payload }
    case 'ADD_CONTENT':
      return { ...state, contentItems: [...state.contentItems, action.payload] }
    case 'UPDATE_CONTENT':
      return {
        ...state,
        contentItems: state.contentItems.map(item =>
          item.id === action.payload.id ? action.payload : item
        ),
      }
    case 'DELETE_CONTENT':
      return {
        ...state,
        contentItems: state.contentItems.filter(item => item.id !== action.payload),
      }
    case 'UPDATE_STATUS':
      return {
        ...state,
        contentItems: state.contentItems.map(item =>
          item.id === action.payload.id ? { ...item, status: action.payload.status } : item
        ),
      }
    case 'REORDER_CONTENT': {
      const idOrder = action.payload
      const itemMap = new Map(state.contentItems.map(item => [item.id, item]))
      const reordered = idOrder
        .map((id, index) => {
          const item = itemMap.get(id)
          return item ? { ...item, order: index } : null
        })
        .filter((item): item is ContentItem => item !== null)
      return { ...state, contentItems: reordered }
    }
    case 'SET_MATERIALS':
      return { ...state, materials: action.payload }
    case 'ADD_MATERIAL':
      return { ...state, materials: [...state.materials, action.payload] }
    case 'DELETE_MATERIAL':
      return {
        ...state,
        materials: state.materials.filter(m => m.id !== action.payload),
      }
    case 'SET_CALENDAR':
      return { ...state, calendarDays: action.payload }
    case 'SET_SYNC_LOGS':
      return { ...state, syncLogs: action.payload }
    case 'ADD_SYNC_LOG':
      return { ...state, syncLogs: [action.payload, ...state.syncLogs] }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    default:
      return state
  }
}

const fetchActions = {
  fetchContent: () => async (dispatch: Dispatch<AppAction>) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const items = await contentApi.getContent()
      dispatch({ type: 'SET_CONTENT', payload: items })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: (err as Error).message })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  },

  fetchMaterials: (page = 1, limit = 20) => async (dispatch: Dispatch<AppAction>) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const result = await materialApi.getMaterials(page, limit)
      dispatch({ type: 'SET_MATERIALS', payload: result.items })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: (err as Error).message })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  },

  fetchCalendar: (year: number, month: number) => async (dispatch: Dispatch<AppAction>) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const days = await calendarApi.getCalendar(year, month)
      dispatch({ type: 'SET_CALENDAR', payload: days })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: (err as Error).message })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  },

  fetchSyncLogs: (contentId?: string) => async (dispatch: Dispatch<AppAction>) => {
    try {
      const logs = await calendarApi.getSyncLogs(contentId)
      dispatch({ type: 'SET_SYNC_LOGS', payload: logs })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: (err as Error).message })
    }
  },
}

interface AppContextValue {
  state: AppState
  dispatch: Dispatch<AppAction>
  fetchActions: typeof fetchActions
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return (
    <AppContext.Provider value={{ state, dispatch, fetchActions }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

export { fetchActions }
