import { create } from 'zustand'

interface Letter {
  id: string
  toEmail: string
  subject: string
  content: string
  sendDate: string
  mood: 'happy' | 'calm' | 'sad' | 'miss'
  photo?: string
  weatherEmoji: string
  createdAt: string
  status: 'pending' | 'sent' | 'recalled'
}

interface LetterState {
  letters: Letter[]
  selectedMood: 'happy' | 'calm' | 'sad' | 'miss' | null
  weatherEmoji: string
  setSelectedMood: (mood: 'happy' | 'calm' | 'sad' | 'miss' | null) => void
  setWeatherEmoji: (emoji: string) => void
  fetchLetters: () => Promise<void>
  createLetter: (data: Omit<Letter, 'id' | 'weatherEmoji' | 'createdAt' | 'status'>) => Promise<void>
  updateLetter: (id: string, data: Partial<Letter>) => Promise<void>
  recallLetter: (id: string) => Promise<void>
}

export const useLetterStore = create<LetterState>((set, get) => ({
  letters: [],
  selectedMood: null,
  weatherEmoji: '🌙',
  setSelectedMood: (mood) => set({ selectedMood: mood }),
  setWeatherEmoji: (emoji) => set({ weatherEmoji: emoji }),
  fetchLetters: async () => {
    const res = await fetch('/api/letters')
    const data = await res.json()
    set({ letters: data })
  },
  createLetter: async (data) => {
    await fetch('/api/letters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    await get().fetchLetters()
  },
  updateLetter: async (id, data) => {
    await fetch(`/api/letters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    await get().fetchLetters()
  },
  recallLetter: async (id) => {
    await fetch(`/api/letters/${id}`, { method: 'DELETE' })
    await get().fetchLetters()
  },
}))
