import { createStore, combineReducers, Action } from 'redux'
import type { GeneratedPoem } from '../modules/generation/GeneratorModule'
import type { StyleConfig } from '../modules/styling/StyleModule'
import { defaultStyle } from '../modules/styling/StyleModule'
import type { HistoryItem } from '../modules/history/HistoryModule'
import { loadHistory } from '../modules/history/HistoryModule'

export const GENERATE_POEM = 'GENERATE_POEM'
export const APPLY_STYLE = 'APPLY_STYLE'
export const SAVE_HISTORY = 'SAVE_HISTORY'
export const DELETE_HISTORY = 'DELETE_HISTORY'
export const LOAD_HISTORY = 'LOAD_HISTORY'
export const SET_CURRENT_POEM = 'SET_CURRENT_POEM'

interface GeneratePoemAction extends Action<typeof GENERATE_POEM> {
  payload: GeneratedPoem
}

interface SetCurrentPoemAction extends Action<typeof SET_CURRENT_POEM> {
  payload: GeneratedPoem | null
}

interface ApplyStyleAction extends Action<typeof APPLY_STYLE> {
  payload: StyleConfig
}

interface SaveHistoryAction extends Action<typeof SAVE_HISTORY> {
  payload: HistoryItem
}

interface DeleteHistoryAction extends Action<typeof DELETE_HISTORY> {
  payload: string
}

interface LoadHistoryAction extends Action<typeof LOAD_HISTORY> {
  payload: HistoryItem[]
}

export type AppActions =
  | GeneratePoemAction
  | SetCurrentPoemAction
  | ApplyStyleAction
  | SaveHistoryAction
  | DeleteHistoryAction
  | LoadHistoryAction

export interface PoemState {
  currentPoem: GeneratedPoem | null
}

export interface StyleState {
  currentStyle: StyleConfig
}

export interface HistoryState {
  items: HistoryItem[]
}

export interface AppState {
  poem: PoemState
  style: StyleState
  history: HistoryState
}

const initialPoemState: PoemState = {
  currentPoem: null
}

const initialStyleState: StyleState = {
  currentStyle: defaultStyle
}

const initialHistoryState: HistoryState = {
  items: []
}

function poemReducer(state: PoemState = initialPoemState, action: AppActions): PoemState {
  switch (action.type) {
    case GENERATE_POEM:
      return { currentPoem: action.payload }
    case SET_CURRENT_POEM:
      return { currentPoem: action.payload }
    default:
      return state
  }
}

function styleReducer(state: StyleState = initialStyleState, action: AppActions): StyleState {
  switch (action.type) {
    case APPLY_STYLE:
      return { currentStyle: action.payload }
    default:
      return state
  }
}

function historyReducer(state: HistoryState = initialHistoryState, action: AppActions): HistoryState {
  switch (action.type) {
    case LOAD_HISTORY:
      return { items: action.payload }
    case SAVE_HISTORY: {
      const exists = state.items.some(item => item.id === action.payload.id)
      if (exists) return state
      const newItems = [action.payload, ...state.items]
      return { items: newItems.slice(0, 100) }
    }
    case DELETE_HISTORY:
      return { items: state.items.filter(item => item.id !== action.payload) }
    default:
      return state
  }
}

const rootReducer = combineReducers({
  poem: poemReducer,
  style: styleReducer,
  history: historyReducer
})

export function generatePoemAction(poem: GeneratedPoem): GeneratePoemAction {
  return { type: GENERATE_POEM, payload: poem }
}

export function setCurrentPoemAction(poem: GeneratedPoem | null): SetCurrentPoemAction {
  return { type: SET_CURRENT_POEM, payload: poem }
}

export function applyStyleAction(style: StyleConfig): ApplyStyleAction {
  return { type: APPLY_STYLE, payload: style }
}

export function saveHistoryAction(item: HistoryItem): SaveHistoryAction {
  return { type: SAVE_HISTORY, payload: item }
}

export function deleteHistoryAction(id: string): DeleteHistoryAction {
  return { type: DELETE_HISTORY, payload: id }
}

export function loadHistoryAction(items: HistoryItem[]): LoadHistoryAction {
  return { type: LOAD_HISTORY, payload: items }
}

const store = createStore(rootReducer)

store.dispatch(loadHistoryAction(loadHistory()))

export default store
