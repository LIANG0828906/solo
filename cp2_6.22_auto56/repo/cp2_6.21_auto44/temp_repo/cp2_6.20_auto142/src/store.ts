import { create } from 'zustand'
import { VisualElement, ElementType, ThemeType, ELEMENT_DEFAULTS } from './types'

let nextId = 1

interface Store {
  elements: VisualElement[]
  selectedId: string | null
  theme: ThemeType
  frequencyData: Uint8Array
  timeData: Uint8Array
  isPlaying: boolean
  currentTime: number
  duration: number
  isRecording: boolean
  audioLoaded: boolean
  addElement: (type: ElementType) => void
  removeElement: (id: string) => void
  updateElement: (id: string, updates: Partial<VisualElement>) => void
  setSelectedId: (id: string | null) => void
  setTheme: (theme: ThemeType) => void
  setFrequencyData: (data: Uint8Array) => void
  setTimeData: (data: Uint8Array) => void
  setPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setRecording: (recording: boolean) => void
  setAudioLoaded: (loaded: boolean) => void
  syncAllElements: () => void
}

export const useStore = create<Store>((set) => ({
  elements: [],
  selectedId: null,
  theme: 'cyber',
  frequencyData: new Uint8Array(128),
  timeData: new Uint8Array(128),
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  isRecording: false,
  audioLoaded: false,

  addElement: (type) => {
    const id = `el_${nextId++}`
    const defaults = ELEMENT_DEFAULTS[type]
    const offset = (Math.random() - 0.5) * 2
    set((state) => ({
      elements: [
        ...state.elements,
        {
          id,
          type,
          position: [offset, 0, offset],
          rotation: [0, 0, 0],
          scale: 1,
          sensitivity: defaults.sensitivity,
          rotationSpeed: defaults.rotationSpeed,
          params: { ...defaults.params },
        },
      ],
      selectedId: id,
    }))
  },

  removeElement: (id) =>
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),

  updateElement: (id, updates) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    })),

  setSelectedId: (id) => set({ selectedId: id }),

  setTheme: (theme) => set({ theme }),

  setFrequencyData: (data) => set({ frequencyData: data }),
  setTimeData: (data) => set({ timeData: data }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setRecording: (recording) => set({ isRecording: recording }),
  setAudioLoaded: (loaded) => set({ audioLoaded: loaded }),

  syncAllElements: () =>
    set((state) => ({
      elements: state.elements.map((el) => ({
        ...el,
        sensitivity: ELEMENT_DEFAULTS[el.type].sensitivity,
        rotationSpeed: ELEMENT_DEFAULTS[el.type].rotationSpeed,
      })),
    })),
}))
