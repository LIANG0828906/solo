import { create } from 'zustand'

export type Mood = 'happy' | 'confused' | 'thinking' | 'encouraging'
export type Language = 'zh' | 'en'

export interface ChatMessage {
  id: string
  original: string
  translated: string
  timestamp: number
  sourceLang: Language
  targetLang: Language
}

interface AppState {
  isListening: boolean
  currentMood: Mood
  sourceLang: Language
  targetLang: Language
  currentText: string
  translatedText: string
  messages: ChatMessage[]
  audioLevel: number
  setIsListening: (v: boolean) => void
  setMood: (m: Mood) => void
  setSourceLang: (l: Language) => void
  setTargetLang: (l: Language) => void
  setCurrentText: (t: string) => void
  setTranslatedText: (t: string) => void
  addMessage: (msg: ChatMessage) => void
  setAudioLevel: (l: number) => void
  toggleLanguages: () => void
}

export const useStore = create<AppState>((set, get) => ({
  isListening: false,
  currentMood: 'happy',
  sourceLang: 'zh',
  targetLang: 'en',
  currentText: '',
  translatedText: '',
  messages: [],
  audioLevel: 0,
  setIsListening: (v) => set({ isListening: v }),
  setMood: (m) => set({ currentMood: m }),
  setSourceLang: (l) => set({ sourceLang: l }),
  setTargetLang: (l) => set({ targetLang: l }),
  setCurrentText: (t) => set({ currentText: t }),
  setTranslatedText: (t) => set({ translatedText: t }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setAudioLevel: (l) => set({ audioLevel: l }),
  toggleLanguages: () => {
    const { sourceLang, targetLang } = get()
    set({ sourceLang: targetLang, targetLang: sourceLang })
  },
}))
