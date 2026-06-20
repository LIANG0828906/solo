import { create } from 'zustand'

export type HandwritingStyle = 'roundChild' | 'elegantRunning' | 'neatRegular' | 'cursiveScript' | 'retroBrush'

export type BackgroundTexture = 'kraftPaper' | 'chalkboard' | 'ricePaper' | 'linen' | 'frostedGlass' | 'gradient'

export type SystemFont = 'SimSun' | 'SimHei' | 'KaiTi'

export interface StyleParams {
  strokeWidth: number
  inkDensity: number
  skewAngle: number
  animationDuration: number
}

export interface BackgroundConfig {
  texture: BackgroundTexture
  opacity: number
}

export interface ComparisonSample {
  enabled: boolean
  type: 'system' | 'saved'
  font?: SystemFont
  savedStyle?: HandwritingStyle
  savedParams?: StyleParams
}

export interface MagnifierState {
  visible: boolean
  x: number
  y: number
}

export interface UIState {
  panelOpen: boolean
  exportModalOpen: boolean
}

export interface SavedStyle {
  id: string
  name: string
  style: HandwritingStyle
  params: StyleParams
  background: BackgroundConfig
  createdAt: number
}

interface AppState {
  text: string
  style: HandwritingStyle
  styleParams: StyleParams
  background: BackgroundConfig
  comparisonSample: ComparisonSample | null
  dividerPosition: number
  magnifier: MagnifierState
  uiState: UIState
  savedStyles: SavedStyle[]

  setText: (text: string) => void
  setStyle: (style: HandwritingStyle) => void
  setStyleParams: (params: Partial<StyleParams>) => void
  setBackground: (background: Partial<BackgroundConfig>) => void
  setComparisonSample: (sample: ComparisonSample | null) => void
  setDividerPosition: (position: number) => void
  setMagnifier: (magnifier: Partial<MagnifierState>) => void
  setUIState: (state: Partial<UIState>) => void
  saveCurrentStyle: (name: string) => void
  deleteSavedStyle: (id: string) => void
  resetEditor: () => void
}

const defaultStyleParams: StyleParams = {
  strokeWidth: 4,
  inkDensity: 0.85,
  skewAngle: 0,
  animationDuration: 2,
}

const defaultBackground: BackgroundConfig = {
  texture: 'ricePaper',
  opacity: 0.8,
}

export const useAppStore = create<AppState>((set, get) => ({
  text: '手写体风格模拟',
  style: 'elegantRunning',
  styleParams: defaultStyleParams,
  background: defaultBackground,
  comparisonSample: null,
  dividerPosition: 50,
  magnifier: {
    visible: false,
    x: 0,
    y: 0,
  },
  uiState: {
    panelOpen: true,
    exportModalOpen: false,
  },
  savedStyles: [],

  setText: (text) => set({ text: text.slice(0, 200) }),
  setStyle: (style) => set({ style }),
  setStyleParams: (params) =>
    set((state) => ({ styleParams: { ...state.styleParams, ...params } })),
  setBackground: (background) =>
    set((state) => ({ background: { ...state.background, ...background } })),
  setComparisonSample: (sample) => set({ comparisonSample: sample }),
  setDividerPosition: (position) => set({ dividerPosition: Math.max(10, Math.min(90, position)) }),
  setMagnifier: (magnifier) =>
    set((state) => ({ magnifier: { ...state.magnifier, ...magnifier } })),
  setUIState: (state) =>
    set((prev) => ({ uiState: { ...prev.uiState, ...state } })),
  saveCurrentStyle: (name) => {
    const state = get()
    const newStyle: SavedStyle = {
      id: Date.now().toString(),
      name,
      style: state.style,
      params: { ...state.styleParams },
      background: { ...state.background },
      createdAt: Date.now(),
    }
    set((prev) => ({ savedStyles: [...prev.savedStyles, newStyle] }))
  },
  deleteSavedStyle: (id) =>
    set((state) => ({
      savedStyles: state.savedStyles.filter((s) => s.id !== id),
    })),
  resetEditor: () =>
    set({
      text: '手写体风格模拟',
      style: 'elegantRunning',
      styleParams: defaultStyleParams,
      background: defaultBackground,
      comparisonSample: null,
      magnifier: { visible: false, x: 0, y: 0 },
    }),
}))
