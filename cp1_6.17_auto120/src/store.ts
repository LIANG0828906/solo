import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DiaryEntry {
  date: string
  colorIndex: number
  content: string
}

interface AppState {
  entries: DiaryEntry[]
  selectedColorIndex: number
  inputText: string
  viewMode: 'month' | 'year'
  currentMonth: number
  currentYear: number
  isFlipping: boolean
  mobileCalendarOpen: boolean

  setSelectedColorIndex: (index: number) => void
  setInputText: (text: string) => void
  addEntry: (entry: DiaryEntry) => void
  setViewMode: (mode: 'month' | 'year') => void
  setCurrentMonth: (month: number) => void
  setCurrentYear: (year: number) => void
  setIsFlipping: (flipping: boolean) => void
  toggleMobileCalendar: () => void
  getEntryByDate: (date: string) => DiaryEntry | undefined
}

export const COLORS = [
  '#4A90D9',
  '#5BB5E8',
  '#6CCFF6',
  '#7ED6DF',
  '#A8E6CF',
  '#DCE775',
  '#FFD93D',
  '#FFB347',
  '#FF8C00',
  '#FF6B6B',
  '#D65DB1',
  '#9B59B6',
]

export const getComplementaryColor = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return '#' + [r, g, b].map((c) => (255 - c).toString(16).padStart(2, '0')).join('')
}

export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const today = new Date()

const generateDemoEntries = (): DiaryEntry[] => {
  const year = today.getFullYear()
  const month = today.getMonth()
  const entries: DiaryEntry[] = []
  const demoContents = [
    '今天阳光很好，心情愉快',
    '工作有点忙，但还不错',
    '和朋友聚会，很开心',
    '下雨天，有点忧郁',
    '读完了一本好书',
    '健身完浑身舒畅',
    '吃到了好吃的蛋糕',
    '听了一整天的音乐',
    '散步时看到了美丽的日落',
    '和家人通了电话',
    '完成了一个重要项目',
    '安静的一天，很放松',
    '学到了新东西',
    '有点焦虑，需要调整',
    '看了一场很棒的电影',
  ]

  for (let i = 0; i < 15; i++) {
    const day = Math.floor(Math.random() * Math.min(today.getDate(), 28)) + 1
    const colorIndex = Math.floor(Math.random() * 12)
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (!entries.find((e) => e.date === dateKey)) {
      entries.push({
        date: dateKey,
        colorIndex,
        content: demoContents[Math.floor(Math.random() * demoContents.length)],
      })
    }
  }

  return entries
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      entries: generateDemoEntries(),
      selectedColorIndex: 6,
      inputText: '',
      viewMode: 'month',
      currentMonth: today.getMonth(),
      currentYear: today.getFullYear(),
      isFlipping: false,
      mobileCalendarOpen: false,

      setSelectedColorIndex: (index) => set({ selectedColorIndex: index }),
      setInputText: (text) => set({ inputText: text }),
      addEntry: (entry) => {
        const { entries } = get()
        const existingIndex = entries.findIndex((e) => e.date === entry.date)
        if (existingIndex >= 0) {
          const newEntries = [...entries]
          newEntries[existingIndex] = entry
          set({ entries: newEntries })
        } else {
          set({ entries: [...entries, entry] })
        }
      },
      setViewMode: (mode) => set({ viewMode: mode }),
      setCurrentMonth: (month) => set({ currentMonth: month }),
      setCurrentYear: (year) => set({ currentYear: year }),
      setIsFlipping: (flipping) => set({ isFlipping: flipping }),
      toggleMobileCalendar: () =>
        set((state) => ({ mobileCalendarOpen: !state.mobileCalendarOpen })),
      getEntryByDate: (date) => get().entries.find((e) => e.date === date),
    }),
    {
      name: 'emotion-diary-storage',
      partialize: (state) => ({ entries: state.entries }),
    }
  )
)
